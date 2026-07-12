import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createRequire } from 'module'
import { SEED_SCHOLARSHIPS } from '@/lib/seed-scholarships'
import { matchScholarships } from '@/lib/quiz-match'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mail/resend'
import { captureServerEvent } from '@/lib/posthog-server'
import { campaignSchedule, displaySpots } from '@/lib/urgency-config'

const nodeRequire = createRequire(import.meta.url)

export const runtime = 'nodejs'
export const maxDuration = 120

// ---------- Mongo ----------
let client, db, connectPromise
async function connectToMongo() {
  if (db) return db
  if (!connectPromise) {
    connectPromise = (async () => {
      client = new MongoClient(process.env.MONGO_URL)
      await client.connect()
      db = client.db(process.env.DB_NAME || 'scholarshipfit')
      return db
    })()
  }
  return connectPromise
}

async function ensureSeed(db) {
  const col = db.collection('scholarships')
  // Idempotent seed: upsert by slug. Safe to run every request-time; only
  // inserts records whose slug doesn't already exist. Preserves any manual
  // edits made in the admin panel.
  await col.createIndex({ slug: 1 }, { unique: true, sparse: true }).catch(() => {})
  const bulkOps = SEED_SCHOLARSHIPS.map(s => ({
    updateOne: {
      filter: { slug: s.slug },
      update: {
        $setOnInsert: {
          id: uuidv4(),
          public_status: 'public',
          verification_status: s.trust_level || 'Source-linked',
          last_checked: new Date(),
          created_at: new Date(),
          ...s,
        },
      },
      upsert: true,
    },
  }))
  if (bulkOps.length) {
    try { await col.bulkWrite(bulkOps, { ordered: false }) } catch (e) { /* ignore dup errors */ }
  }

  // ---------- Email verification collection + TTL index ----------
  // Documents auto-expire once `expires_at` is reached. Also enforce a
  // uniqueness constraint so we can efficiently upsert per-email.
  try {
    const ev = db.collection('email_verifications')
    await ev.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }).catch(() => {})
    await ev.createIndex({ email: 1 }, { unique: true }).catch(() => {})
  } catch (_) { /* ignore */ }

  // ---------- Password reset collection + TTL index ----------
  try {
    const pr = db.collection('password_resets')
    await pr.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }).catch(() => {})
    await pr.createIndex({ token_hash: 1 }, { unique: true }).catch(() => {})
    await pr.createIndex({ email: 1 }).catch(() => {})
  } catch (_) { /* ignore */ }

  // ---------- Saved scholarships (deadline-reminder source of truth) ----------
  try {
    const ss = db.collection('saved_scholarships')
    await ss.createIndex({ user_id: 1, scholarship_id: 1 }, { unique: true }).catch(() => {})
    await ss.createIndex({ user_id: 1 }).catch(() => {})
    await ss.createIndex({ deadline_date: 1 }).catch(() => {})
  } catch (_) { /* ignore */ }

  // ---------- Reminder-unsubscribe tokens ----------
  try {
    const uu = db.collection('unsubscribe_tokens')
    await uu.createIndex({ token: 1 }, { unique: true }).catch(() => {})
    await uu.createIndex({ user_id: 1 }).catch(() => {})
  } catch (_) { /* ignore */ }

  // ---------- Application tracker (Kanban) ----------
  try {
    const ap = db.collection('applications')
    await ap.createIndex({ user_id: 1, status: 1, display_order: 1 }).catch(() => {})
    await ap.createIndex({ user_id: 1, updated_at: -1 }).catch(() => {})
  } catch (_) { /* ignore */ }

  // ---------- Grandfather existing users (one-shot) ----------
  // Anyone whose account was created before we introduced email verification
  // is automatically marked email_verified=true so they can keep logging in.
  // This runs at most once per boot (per Mongo document count) and is a
  // no-op after the first run.
  try {
    const users = db.collection('users')
    await users.updateMany(
      { email_verified: { $exists: false } },
      { $set: { email_verified: true, email_verified_at: new Date(), email_verified_source: 'grandfathered' } },
    )
  } catch (_) { /* ignore */ }
}

// ---------- CORS ----------
function withCORS(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}
export async function OPTIONS() { return withCORS(new NextResponse(null, { status: 200 })) }

// ---------- LLM (Emergent Universal Key → Claude Sonnet 4.5) ----------
const EMERGENT_URL = 'https://integrations.emergentagent.com/llm/chat/completions'
const MODEL = 'claude-sonnet-4-5'

async function callClaude({ system, messages, maxTokens = 4096, temperature = 0.2, jsonMode = false }) {
  const body = {
    model: MODEL,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: maxTokens,
    temperature,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }
  const res = await fetch(EMERGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EMERGENT_LLM_KEY}`,
      'X-App-ID': process.env.NEXT_PUBLIC_BASE_URL || 'scholarshipfit',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM ${res.status}: ${t.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function safeParseJSON(str) {
  try { return JSON.parse(str) } catch { /* fall through — try to extract embedded JSON */ }
  // Try to extract JSON block
  const m = str.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch { /* give up, return null below */ } }
  return null
}

// ---------- Matching prompt ----------
const MATCH_SYSTEM = `You are ScholarshipFit's scholarship matching engine.

STRICT RULES:
1. You may ONLY recommend scholarships that appear in the provided DATABASE list below.
2. You MUST NOT invent scholarship names, deadlines, funding amounts, eligibility rules, or universities that are not in the DATABASE.
3. Every recommendation MUST include the official source_url copied verbatim from the DATABASE record.
4. If a field (deadline, GPA threshold, etc.) is not in the DATABASE record, say "Check official source." Do not guess.
5. Do NOT claim guaranteed scholarships, admissions, visas, or funding.
6. Output MUST be a single valid JSON object matching the schema. No prose, no markdown, no code fences.

Scoring rubric (0-100 for overall_fit_score):
- Degree level match (20)
- Field of study match (20)
- Nationality eligibility (15)
- Academic thresholds (GPA, IELTS/TOEFL) (15)
- Country preference alignment (10)
- Funding vs budget alignment (10)
- Deadline realism / effort (5)
- Trust level / data quality (5)

Also produce:
- academic_fit_score (0-100)
- scholarship_fit_score (0-100): how well the scholarship type suits the profile
- budget_fit: "excellent" | "good" | "tight" | "unknown"
- eligibility_status: "eligible" | "likely_eligible" | "borderline" | "ineligible" | "insufficient_info"
- application_waste_risk: "low" | "medium" | "high"
- requirements_met: array of strings from the DATABASE record's required_documents/thresholds the user meets
- requirements_missing: array of strings the user is missing or unclear on
- fit_reasoning: 2-4 sentences explaining WHY this scholarship fits (or does not) — grounded in DATABASE fields.
- next_steps: 3-5 concrete short bullet strings.
- disclaimer_hint: always the string "Verify all details on the official source before applying."

Return JSON exactly of the form:
{
  "matches": [
    {
      "scholarship_id": "<id from DATABASE>",
      "slug": "<slug>",
      "scholarship_name": "<name>",
      "university_name": "<university>",
      "country": "<country>",
      "source_url": "<source_url>",
      "trust_level": "<trust_level>",
      "overall_fit_score": <int 0-100>,
      "academic_fit_score": <int 0-100>,
      "scholarship_fit_score": <int 0-100>,
      "budget_fit": "<...>",
      "eligibility_status": "<...>",
      "application_waste_risk": "<...>",
      "requirements_met": ["..."],
      "requirements_missing": ["..."],
      "fit_reasoning": "...",
      "funding_note": "...",
      "deadline_note": "...",
      "next_steps": ["...","..."],
      "disclaimer_hint": "Verify all details on the official source before applying."
    }
  ],
  "summary": "1-2 sentence portfolio overview grounded in the matches above.",
  "advisory": "1 sentence honest advice — not sales talk."
}

Return the top 6 matches ranked by overall_fit_score DESC. Include ALL DATABASE items if fewer than 6 exist.`

function buildDatabaseBlock(scholarships) {
  return scholarships.map(s => JSON.stringify({
    id: s.id,
    slug: s.slug,
    scholarship_name: s.scholarship_name,
    university_name: s.university_name,
    country: s.country,
    degree_levels: s.degree_levels,
    eligible_nationalities: s.eligible_nationalities,
    major_fields: s.major_fields,
    funding_type: s.funding_type,
    funding_amount: s.funding_amount,
    funding_summary: s.funding_summary,
    full_or_partial: s.full_or_partial,
    min_gpa: s.min_gpa,
    min_ielts: s.min_ielts,
    min_toefl: s.min_toefl,
    min_sat: s.min_sat || null,
    min_gre: s.min_gre || null,
    required_documents: s.required_documents,
    eligibility_summary: s.eligibility_summary,
    deadline_status: s.deadline_status,
    deadline_note: s.deadline_note,
    source_url: s.source_url,
    trust_level: s.trust_level,
  })).join('\n')
}

/* ============================================================================
   verifyReplyAgainstDb — anti-hallucination check for Nova's replies.
   Given the raw reply text and the DB block used to ground it, returns:
     • verified_scholarships: list of scholarship names cited that ARE in DB
     • unverified_flags: any phrase that looks like a scholarship name but
       could not be matched against the DB (heuristic — capitalised phrase
       ending with "Scholarship" / "Fellowship" / "Grant" / "Award" / etc.)
     • confidence: 'high' when all detected mentions match DB, 'medium' when
       0 mentions detected at all (still safe), 'low' when unverified names
       are found. Frontend uses this to render a badge on every reply.
   ============================================================================ */
function verifyReplyAgainstDb(reply, scholarships) {
  const text = String(reply || '')
  if (!text) return { verified_scholarships: [], unverified_flags: [], confidence: 'medium' }

  // 1. Match DB scholarships whose name (or trimmed variant) is mentioned.
  const verified = []
  const seen = new Set()
  for (const s of (scholarships || [])) {
    const name = String(s.scholarship_name || '').trim()
    if (!name || name.length < 6) continue
    // Case-insensitive whole-phrase check. Escape regex specials.
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${esc}\\b`, 'i')
    if (re.test(text) && !seen.has(s.id)) {
      seen.add(s.id)
      verified.push({ id: s.id, name, source_url: s.source_url })
    }
  }

  // 2. Detect capitalised phrases that LOOK like scholarship names but weren't
  //    matched above (potential hallucinations).
  const looksLikeScholarshipRegex = /\b([A-Z][A-Za-z0-9\-&']+(?:\s+[A-Z][A-Za-z0-9\-&']+){0,6}\s+(?:Scholarship|Fellowship|Grant|Award|Bursary|Programme|Program))\b/g
  const flags = []
  const flagSet = new Set()
  let m
  while ((m = looksLikeScholarshipRegex.exec(text)) !== null) {
    const phrase = m[1].trim()
    // Skip generic terms.
    if (/^(The|Our|Their|Available|This|That|A|An)\s/i.test(phrase)) continue
    if (phrase.length < 12) continue
    // If any verified name is a substring of this phrase (or vice-versa), it's OK.
    const alreadyVerified = verified.some(v =>
      v.name.toLowerCase().includes(phrase.toLowerCase()) ||
      phrase.toLowerCase().includes(v.name.toLowerCase())
    )
    if (alreadyVerified) continue
    // Also skip if any DB scholarship's first 3 significant words appear in this phrase
    // (guards against slight paraphrases like "Rhodes Scholarship" → "The Rhodes Scholarship").
    const paraphrased = (scholarships || []).some(s => {
      const parts = String(s.scholarship_name || '').split(/\s+/).filter(w => w.length > 3).slice(0, 3)
      return parts.length >= 2 && parts.every(p => phrase.toLowerCase().includes(p.toLowerCase()))
    })
    if (paraphrased) return { verified_scholarships: verified, unverified_flags: flags, confidence: verified.length ? 'high' : 'medium' }
    if (!flagSet.has(phrase.toLowerCase())) {
      flagSet.add(phrase.toLowerCase())
      flags.push(phrase)
    }
  }

  let confidence = 'medium'
  if (verified.length > 0 && flags.length === 0) confidence = 'high'
  else if (flags.length > 0) confidence = 'low'
  return { verified_scholarships: verified, unverified_flags: flags, confidence }
}

/* ============================================================================
   verifyScholarshipUrl — /verify tool backend.
   Traffic-light scoring for any user-pasted scholarship URL. Uses only local
   pattern analysis (no external calls) so it's fast and cannot leak PII.
   Signals scored:
     🟢 GREEN  when: HTTPS + institutional TLD (.edu / .gov / .ac.*) OR
                     domain matches a verified DB provider
     🟡 YELLOW when: HTTPS + generic domain (.com / .org) + no red flags
     🔴 RED    when: any scam signal (fee/apply-now-pay, .tk/.ml/.ga TLD,
                     no HTTPS, suspicious keywords).
   ============================================================================ */
function verifyScholarshipUrl(rawUrl, knownProviders = []) {
  const reasons = []
  let level = 'yellow'
  let url
  try { url = new URL(rawUrl) } catch {
    return { level: 'red', reasons: ['Not a valid URL'], normalized: null }
  }
  const host = url.hostname.toLowerCase()
  const scheme = url.protocol.toLowerCase()

  // Signal: HTTPS
  if (scheme !== 'https:') {
    reasons.push('URL does not use HTTPS — data you send is not encrypted')
    level = 'red'
  } else {
    reasons.push('Uses secure HTTPS connection')
  }

  // Signal: institutional TLD or trusted domain
  const instTlds = [
    /\.edu(\.[a-z]{2})?$/i,
    /\.ac\.[a-z]{2,}$/i,
    /\.gov(\.[a-z]{2})?$/i,
    /\.gob\.[a-z]{2,}$/i,
  ]
  const isInstitutional = instTlds.some(rx => rx.test(host))
  if (isInstitutional) {
    reasons.push('Institutional domain (.edu / .ac / .gov) — high trust')
    if (level !== 'red') level = 'green'
  }

  // Signal: matches a scholarship provider in our DB
  const rootHost = host.replace(/^www\./, '')
  const provMatch = knownProviders.find(p => {
    if (!p) return false
    try {
      const purl = new URL(String(p).startsWith('http') ? p : `https://${p}`)
      return purl.hostname.replace(/^www\./, '') === rootHost
    } catch { return false }
  })
  if (provMatch) {
    reasons.push('Domain matches a provider already in the ScholarshipFit verified database')
    if (level !== 'red') level = 'green'
  }

  // Signal: dodgy TLDs frequently abused by scam scholarships
  const dodgyTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.click', '.buzz', '.zip']
  if (dodgyTlds.some(t => host.endsWith(t))) {
    reasons.push('Free / low-reputation TLD frequently used by scam sites')
    level = 'red'
  }

  // Signal: URL contains payment / fee keywords → scholarship scam pattern
  const scammyKeywords = ['pay-now', 'application-fee', 'processing-fee', 'send-money', 'wire-transfer', 'western-union', 'moneygram', 'admission-fee', 'registration-fee']
  const pathLower = (url.pathname + '?' + url.search).toLowerCase()
  const matched = scammyKeywords.filter(k => pathLower.includes(k))
  if (matched.length) {
    reasons.push('URL contains payment-related keywords (' + matched.join(', ') + ') — legitimate scholarships never require payment to apply')
    level = 'red'
  }

  // Signal: subdomain masquerading (e.g. harvard-scholarship.tk)
  const brandInPath = /(harvard|oxford|cambridge|mit|stanford|princeton|yale|imperial|ethz|fulbright|chevening|rhodes|erasmus|daad|mext)/i.test(host)
  const looksLikeBrandOnScamHost = brandInPath && !isInstitutional && !provMatch
  if (looksLikeBrandOnScamHost) {
    reasons.push('Uses a famous institution\u2019s name on a non-institutional domain — possible impersonation')
    level = 'red'
  }

  if (!isInstitutional && !provMatch && level === 'yellow') {
    reasons.push('Generic domain, no institutional signals — verify on the provider\u2019s official website before applying')
  }

  return {
    level,
    reasons,
    normalized: `${scheme}//${host}${url.pathname}`,
    host,
    is_institutional: isInstitutional,
    matches_known_provider: !!provMatch,
    scam_signals: matched,
  }
}


// ---------- Router ----------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = '/' + path.join('/')
  const method = request.method

  try {
    const db = await connectToMongo()
    await ensureSeed(db)

    // Admin auth helper (available anywhere below)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
    const adminOK = () => {
      const h = request.headers.get('x-admin-key') || ''
      return !!(h && h === ADMIN_PASSWORD)
    }
    const requireAdmin = () =>
      withCORS(NextResponse.json({ error: 'Unauthorized (admin only)' }, { status: 401 }))

    // Session helper — hoisted here so ANY route below can look up the caller.
    // (Previously defined lower in the file, causing TDZ errors on routes that
    // are declared earlier — e.g. /advisor rate limiting.)
    const getSessionUser = async () => {
      const cookieStore = await cookies()
      const token = cookieStore.get('sf_session')?.value
      if (!token) return null
      const s = await db.collection('sessions').findOne({ session_token: token })
      if (!s) return null
      const u = await db.collection('users').findOne({ id: s.user_id })
      if (!u) return null
      const { _id, password_hash, ...clean } = u
      return clean
    }


    // Health
    if ((route === '/' || route === '/root') && method === 'GET') {
      return withCORS(NextResponse.json({ ok: true, service: 'ScholarshipFit API' }))
    }

    // ------- Logo Proxy -------
    // Fetches real university logos server-side. Chains multiple upstream providers
    // in order of quality and picks the first non-trivial image response.
    //   Clearbit -> icon.horse -> DuckDuckGo -> Google Favicon
    if (route === '/logo' && method === 'GET') {
      const url = new URL(request.url)
      const domain = url.searchParams.get('domain')
      if (!domain || !/^[a-z0-9.-]+$/i.test(domain)) {
        return withCORS(NextResponse.json({ error: 'bad domain' }, { status: 400 }))
      }
      const size = url.searchParams.get('sz') || '256'
      const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const providers = [
        `https://logo.clearbit.com/${encodeURIComponent(domain)}?size=${size}`,
        `https://icon.horse/icon/${encodeURIComponent(domain)}`,
        `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`,
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`,
      ]
      let best = null
      for (const src of providers) {
        try {
          const controller = new AbortController()
          const t = setTimeout(() => controller.abort(), 5000)
          const r = await fetch(src, { redirect: 'follow', headers: { 'User-Agent': UA }, signal: controller.signal })
          clearTimeout(t)
          if (!r.ok) continue
          const buf = Buffer.from(await r.arrayBuffer())
          if (buf.length < 400) continue // skip tiny/blank favicons
          // Keep the largest payload we've seen (typically = highest quality)
          if (!best || buf.length > best.buf.length) {
            best = { buf, contentType: r.headers.get('content-type') || 'image/png', source: new URL(src).hostname }
          }
          // If we already got a >5KB asset from a preferred provider, ship it fast
          if (buf.length > 5000) break
        } catch (_e) { /* try next */ }
      }
      if (best) {
        return withCORS(new NextResponse(best.buf, {
          status: 200,
          headers: {
            'Content-Type': best.contentType,
            'Cache-Control': 'public, max-age=604800, immutable',
            'X-Logo-Source': best.source,
          },
        }))
      }
      return withCORS(NextResponse.json({ error: 'no upstream logo available' }, { status: 502 }))
    }

    // ------- Scholarships -------
    if (route === '/scholarships' && method === 'GET') {
      const url = new URL(request.url)
      const q = url.searchParams.get('q')?.toLowerCase()
      const country = url.searchParams.get('country')
      const degree = url.searchParams.get('degree')
      const filter = { public_status: { $ne: 'hidden' } }
      if (country) filter.country = country
      if (degree) filter.degree_levels = degree
      let items = await db.collection('scholarships').find(filter).limit(500).toArray()
      if (q) {
        items = items.filter(s =>
          (s.scholarship_name || '').toLowerCase().includes(q) ||
          (s.university_name || '').toLowerCase().includes(q) ||
          (s.country || '').toLowerCase().includes(q) ||
          (s.major_fields || []).join(' ').toLowerCase().includes(q)
        )
      }
      const cleaned = items.map(({ _id, ...rest }) => rest)
      return withCORS(NextResponse.json({ scholarships: cleaned }))
    }

    if (route === '/scholarships' && method === 'POST') {
      if (!adminOK()) return requireAdmin()
      const body = await request.json()
      const doc = {
        id: uuidv4(),
        created_at: new Date(),
        public_status: body.public_status || 'public',
        trust_level: body.trust_level || 'Needs source review',
        ...body,
      }
      await db.collection('scholarships').insertOne(doc)
      const { _id, ...clean } = doc
      return withCORS(NextResponse.json({ scholarship: clean }))
    }

    if (route.startsWith('/scholarships/') && method === 'GET') {
      const id = route.split('/')[2]
      const doc = await db.collection('scholarships').findOne({ id })
      if (!doc) return withCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...clean } = doc
      return withCORS(NextResponse.json({ scholarship: clean }))
    }

    if (route.startsWith('/scholarships/') && method === 'PUT') {
      if (!adminOK()) return requireAdmin()
      const id = route.split('/')[2]
      const body = await request.json()
      delete body._id; delete body.id
      body.updated_at = new Date()
      await db.collection('scholarships').updateOne({ id }, { $set: body })
      const doc = await db.collection('scholarships').findOne({ id })
      const { _id, ...clean } = doc
      return withCORS(NextResponse.json({ scholarship: clean }))
    }

    // ------- Profiles -------
    if (route === '/profiles' && method === 'POST') {
      const body = await request.json()
      const now = new Date()
      let profile
      if (body.id) {
        await db.collection('profiles').updateOne(
          { id: body.id },
          { $set: { ...body, updated_at: now } },
          { upsert: true }
        )
        profile = await db.collection('profiles').findOne({ id: body.id })
      } else {
        profile = { id: uuidv4(), created_at: now, updated_at: now, ...body }
        await db.collection('profiles').insertOne(profile)
      }
      const { _id, ...clean } = profile
      return withCORS(NextResponse.json({ profile: clean }))
    }

    if (route.startsWith('/profiles/') && method === 'GET') {
      const id = route.split('/')[2]
      const doc = await db.collection('profiles').findOne({ id })
      if (!doc) return withCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...clean } = doc
      return withCORS(NextResponse.json({ profile: clean }))
    }

    // ------- AI Match -------
    if (route === '/scholarships/quiz-match' && method === 'POST') {
      // Deterministic rule-based matcher — takes quiz answers and returns
      // ranked REAL scholarships from the DB. No AI, no hallucination.
      const body = await request.json().catch(() => ({}))
      const answers = body?.answers || {}
      const scholarships = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } })
        .limit(500).toArray()
      const { matchScholarships } = await import('@/lib/quiz-match')
      const matches = matchScholarships(answers, scholarships)
      return withCORS(NextResponse.json({
        total_evaluated: scholarships.length,
        total_matches: matches.length,
        top_matches: matches.slice(0, 40),
        answers_echo: answers,
      }))
    }

    if (route === '/match' && method === 'POST') {
      const body = await request.json()
      const profile = body.profile
      const forceRefresh = !!body.force_refresh
      if (!profile) {
        return withCORS(NextResponse.json({ error: 'profile required' }, { status: 400 }))
      }

      const scholarships = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } })
        .limit(200).toArray()

      // ---- AI Match cache: SHA-256(profile relevant fields + DB count) ----
      const cacheKeyFields = {
        nationality: profile.nationality,
        current_country: profile.current_country,
        current_level: profile.current_level,
        degree_level: profile.degree_level,
        intended_major: profile.intended_major,
        gpa: profile.gpa,
        gpa_scale: profile.gpa_scale,
        ielts: profile.ielts,
        toefl: profile.toefl,
        sat: profile.sat,
        act: profile.act,
        gre: profile.gre,
        annual_budget_usd: profile.annual_budget_usd,
        preferred_countries: (profile.preferred_countries || []).slice().sort(),
        intake_year: profile.intake_year,
        full_funding_only: profile.full_funding_only,
        partial_funding_ok: profile.partial_funding_ok,
        db_hash: scholarships.map(s => s.id).sort().join(','),
      }
      const cacheKey = crypto
        .createHash('sha256')
        .update(JSON.stringify(cacheKeyFields))
        .digest('hex')
      const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

      if (!forceRefresh) {
        const cached = await db.collection('match_cache').findOne({ cache_key: cacheKey })
        if (cached && (Date.now() - new Date(cached.created_at).getTime()) < CACHE_TTL_MS) {
          const run = {
            id: uuidv4(),
            profile_id: profile.id || null,
            created_at: new Date(),
            cached: true,
            cache_key: cacheKey,
            result: cached.result,
          }
          await db.collection('match_runs').insertOne(run)
          const { _id, ...cleanRun } = run
          return withCORS(NextResponse.json({ run: cleanRun, cached: true, cache_age_ms: Date.now() - new Date(cached.created_at).getTime() }))
        }
      }

      const dbBlock = buildDatabaseBlock(scholarships)
      const userBlock = JSON.stringify({
        full_name: profile.full_name,
        nationality: profile.nationality,
        current_country: profile.current_country,
        current_level: profile.current_level,
        degree_level: profile.degree_level,
        intended_major: profile.intended_major,
        gpa: profile.gpa,
        gpa_scale: profile.gpa_scale,
        ielts: profile.ielts,
        toefl: profile.toefl,
        sat: profile.sat,
        act: profile.act,
        gre: profile.gre,
        annual_budget_usd: profile.annual_budget_usd,
        preferred_countries: profile.preferred_countries,
        intake_year: profile.intake_year,
        full_funding_only: profile.full_funding_only,
        partial_funding_ok: profile.partial_funding_ok,
        achievements: profile.achievements,
        documents_ready: profile.documents_ready,
      }, null, 2)

      const userMessage = `USER PROFILE:\n${userBlock}\n\nDATABASE (each line is one scholarship JSON):\n${dbBlock}\n\nReturn the JSON object per schema. Only reference scholarships from DATABASE by their exact id and source_url.`

      let raw
      try {
        raw = await callClaude({
          system: MATCH_SYSTEM,
          messages: [{ role: 'user', content: userMessage }],
          jsonMode: true,
          temperature: 0.15,
          maxTokens: 5000,
        })
      } catch (e) {
        return withCORS(NextResponse.json({ error: 'AI matching failed', detail: String(e.message) }, { status: 502 }))
      }

      const parsed = safeParseJSON(raw)
      if (!parsed || !Array.isArray(parsed.matches)) {
        return withCORS(NextResponse.json({ error: 'AI returned invalid JSON', raw: raw.slice(0, 500) }, { status: 502 }))
      }

      // Validate every match ID exists in DB (safety)
      const idSet = new Set(scholarships.map(s => s.id))
      const slugMap = new Map(scholarships.map(s => [s.slug, s]))
      parsed.matches = parsed.matches
        .map(m => {
          let s = idSet.has(m.scholarship_id) ? scholarships.find(x => x.id === m.scholarship_id) : slugMap.get(m.slug)
          if (!s) return null
          return {
            ...m,
            scholarship_id: s.id,
            slug: s.slug,
            scholarship_name: s.scholarship_name,
            university_name: s.university_name,
            country: s.country,
            source_url: s.source_url,
            application_link: s.application_link || s.source_url,
            trust_level: s.trust_level,
            funding_amount: s.funding_amount,
            deadline_status: s.deadline_status,
          }
        })
        .filter(Boolean)
        .sort((a, b) => (b.overall_fit_score || 0) - (a.overall_fit_score || 0))

      // Persist run
      const run = {
        id: uuidv4(),
        profile_id: profile.id || null,
        created_at: new Date(),
        cached: false,
        cache_key: cacheKey,
        result: parsed,
      }
      await db.collection('match_runs').insertOne(run)

      // Write to cache (upsert — keep latest for this key)
      await db.collection('match_cache').updateOne(
        { cache_key: cacheKey },
        { $set: { cache_key: cacheKey, result: parsed, created_at: new Date(), profile_snapshot: cacheKeyFields } },
        { upsert: true },
      )

      const { _id, ...cleanRun } = run
      return withCORS(NextResponse.json({ run: cleanRun, cached: false }))
    }

    if (route === '/matches' && method === 'GET') {
      const url = new URL(request.url)
      const profileId = url.searchParams.get('profileId')
      if (!profileId) return withCORS(NextResponse.json({ runs: [] }))
      const runs = await db.collection('match_runs')
        .find({ profile_id: profileId }).sort({ created_at: -1 }).limit(20).toArray()
      return withCORS(NextResponse.json({ runs: runs.map(({ _id, ...r }) => r) }))
    }

    // ------- AI Advisor Chat -------
    if (route === '/advisor' && method === 'POST') {
      const body = await request.json()
      const sessionId = body.session_id || uuidv4()
      const userMsg = body.message || ''
      if (!userMsg) return withCORS(NextResponse.json({ error: 'message required' }, { status: 400 }))

      // ============================================================================
      // Free-tier rate limiting — stops anonymous visitors from burning Claude
      // tokens indefinitely. Paid subscribers are unlimited.
      //   • Anonymous (identified by IP): 3 free replies / 24h
      //   • Signed-in free tier:          10 free replies / 24h
      //   • Paid subscriber (trialing or active): unlimited
      // Counts are stored in `nova_usage` with a compound key + rolling 24h window.
      // ============================================================================
      const currentUser = await getSessionUser()
      const isPaid = !!(currentUser?.subscription && (
        currentUser.subscription.plan === 'lifetime' ||
        currentUser.subscription.status === 'active' ||
        currentUser.subscription.status === 'trialing'
      ))
      const isOwner = currentUser?.role === 'owner'
      // Grant unlimited if paid OR owner OR admin-flagged
      const unlimited = isPaid || isOwner

      let usageKey, dailyLimit
      if (currentUser) {
        usageKey = `user:${currentUser.id}`
        dailyLimit = 10
      } else {
        // IP-based key for anonymous users. X-Forwarded-For handles reverse proxies.
        const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') || 'anon'
        usageKey = `ip:${rawIp}`
        dailyLimit = 3
      }

      const now = new Date()
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const used = await db.collection('nova_usage').countDocuments({
        key: usageKey, created_at: { $gte: dayAgo },
      })

      if (!unlimited && used >= dailyLimit) {
        return withCORS(NextResponse.json({
          error: 'rate_limited',
          limit_reason: currentUser ? 'free_tier_daily' : 'anonymous_daily',
          used, daily_limit: dailyLimit,
          message: currentUser
            ? `You've used all ${dailyLimit} of your free daily Nova replies. Reserve founder pricing to unlock unlimited AI advising.`
            : `You've used all ${dailyLimit} anonymous replies today. Create a free account for 10/day, or reserve founder pricing for unlimited.`,
          require: currentUser ? 'paywall' : 'signup',
        }, { status: 429 }))
      }

      const scholarships = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } }).limit(200).toArray()
      const dbBlock = buildDatabaseBlock(scholarships)

      const history = await db.collection('advisor_messages')
        .find({ session_id: sessionId }).sort({ created_at: 1 }).limit(30).toArray()

      const ADVISOR_SYSTEM = `You are Nova, ScholarshipFit's AI scholarship advisor. Talk like a calm, knowledgeable, honest guide — never salesy.

STRICT RULES:
1. Only reference scholarships from the DATABASE block below. Never invent scholarship names, universities, deadlines, funding amounts, or eligibility rules.
2. If a scholarship the user asks about is not in DATABASE, say: "That scholarship isn't in our verified database yet. I'd recommend checking the official provider website directly."
3. Never guarantee admission, scholarships, visas, or funding.
4. If the user's question needs specific deadline / GPA / funding numbers that are not in DATABASE, say "Check official source" and link the source_url.
5. Always append a short disclaimer once per response: "ScholarshipFit provides informational scholarship research only. Users apply directly through official provider websites."
6. Format responses in short paragraphs and bullet lists (Markdown). When you cite a scholarship, include its official source URL as a Markdown link.
7. Prefer 2-4 top matches over dumping every option.

DATABASE:\n${dbBlock}`

      const msgs = history.map(h => ({ role: h.role, content: h.content }))
      msgs.push({ role: 'user', content: userMsg })

      let reply
      try {
        reply = await callClaude({
          system: ADVISOR_SYSTEM,
          messages: msgs,
          temperature: 0.35,
          maxTokens: 1400,
        })
      } catch (e) {
        return withCORS(NextResponse.json({ error: 'Advisor failed', detail: String(e.message) }, { status: 502 }))
      }

      const finalNow = new Date()
      await db.collection('advisor_messages').insertMany([
        { id: uuidv4(), session_id: sessionId, role: 'user', content: userMsg, created_at: finalNow },
        { id: uuidv4(), session_id: sessionId, role: 'assistant', content: reply, created_at: new Date(finalNow.getTime() + 1) },
      ])

      // Increment usage counter (only if we're rate-limiting this user)
      if (!unlimited) {
        await db.collection('nova_usage').insertOne({
          id: uuidv4(),
          key: usageKey,
          user_id: currentUser?.id || null,
          session_id: sessionId,
          created_at: finalNow,
        }).catch(() => {})
      }

      const newUsed = unlimited ? 0 : used + 1

      // Anti-hallucination verification pass — grounds the response in DB and
      // surfaces any potentially invented scholarship names.
      const verification = verifyReplyAgainstDb(reply, scholarships)

      return withCORS(NextResponse.json({
        session_id: sessionId,
        reply,
        verification,
        usage: {
          used: newUsed,
          daily_limit: unlimited ? null : dailyLimit,
          unlimited,
          remaining: unlimited ? null : Math.max(0, dailyLimit - newUsed),
          tier: unlimited ? 'unlimited' : (currentUser ? 'free_signed_in' : 'anonymous'),
        },
      }))
    }

    // ============================================================================
    // Lead-magnet capture — exit-intent, deadline-calendar PDF download, etc.
    // Stores an email + source tag + optional intent into `leads` collection.
    // Returns a download URL for the deadline-calendar HTML page (browser can
    // print → PDF). This becomes an email-drip audience post-launch.
    // ============================================================================
    if (route === '/lead-magnet' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      const source = String(body.source || 'exit-intent').slice(0, 80)
      const intent = String(body.intent || 'deadline-calendar').slice(0, 80)
      const context = body.context && typeof body.context === 'object' ? body.context : {}
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Valid email required' }, { status: 400 }))
      }
      const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    request.headers.get('x-real-ip') || null
      const ua = request.headers.get('user-agent') || null
      const now = new Date()

      // Upsert — same email hitting the exit-intent again shouldn't create dupes.
      await db.collection('leads').updateOne(
        { email },
        {
          $setOnInsert: { id: uuidv4(), created_at: now },
          $set: {
            email, source, intent, context, ip: rawIp, user_agent: ua, updated_at: now,
          },
          $push: { history: { source, intent, at: now } },
        },
        { upsert: true },
      )

      return withCORS(NextResponse.json({
        ok: true,
        message: 'Your 2026 Scholarship Deadline Calendar is ready.',
        download_url: '/deadline-calendar',
      }))
    }

    // ------- Public deadline-calendar data (for the printable page) -------
    if (route === '/deadline-calendar/data' && method === 'GET') {
      const scholarships = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } })
        .project({
          _id: 0,
          id: 1, scholarship_name: 1, university_name: 1, country: 1,
          funding_amount: 1, funding_type: 1, deadline_note: 1,
          deadline_iso: 1, deadline_status: 1, source_url: 1,
        })
        .toArray()
      // Sort by real deadline date if available, else deadline_status alphabetical
      const withDate = scholarships.map(s => {
        const raw = s.deadline_iso || s.deadline_note
        const t = raw ? Date.parse(raw) : NaN
        return { ...s, _ts: isNaN(t) ? Infinity : t }
      }).sort((a, b) => a._ts - b._ts)
      return withCORS(NextResponse.json({ count: withDate.length, scholarships: withDate }))
    }

    // ============================================================================
    // /api/verify — public Scholarship Verifier tool. Paste any URL, get a
    // traffic-light score with reasons. No auth needed — this is a public
    // free lead-magnet feature. Rate-limited softly by IP (30 checks / hour).
    // ============================================================================
    if (route === '/verify' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const targetUrl = String(body.url || '').trim()
      if (!targetUrl) return withCORS(NextResponse.json({ error: 'url required' }, { status: 400 }))

      // Soft rate-limit: 30 / hour / IP
      const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    request.headers.get('x-real-ip') || 'anon'
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recent = await db.collection('verify_log').countDocuments({
        ip: rawIp, created_at: { $gte: hourAgo },
      })
      if (recent > 30) {
        return withCORS(NextResponse.json({
          error: 'rate_limited',
          message: 'Too many verifications this hour. Please try again in an hour.',
        }, { status: 429 }))
      }

      // Pull the DB provider list to boost the "known provider" green signal.
      const providers = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } })
        .project({ _id: 0, source_url: 1, university_name: 1 })
        .toArray()
      const providerUrls = providers.map(p => p.source_url).filter(Boolean)

      const result = verifyScholarshipUrl(targetUrl, providerUrls)

      // Audit
      await db.collection('verify_log').insertOne({
        id: uuidv4(),
        url: targetUrl,
        result,
        ip: rawIp,
        created_at: new Date(),
      }).catch(() => {})

      return withCORS(NextResponse.json({ ok: true, url: targetUrl, ...result }))
    }

    // ============================================================================
    // /api/rejection/analyze — Rejection Debugger.
    // User pastes a scholarship rejection letter. We use Claude to extract
    // (in structured JSON) the likely rejection categories + specific profile
    // gaps. Then we call the deterministic matcher against our DB to suggest
    // 3-5 REAL, better-fit alternatives — grounded, never invented.
    //
    // Privacy: rejection text is NOT persisted. We only log a hash + reason
    // categories + user id (if signed-in) into `rejection_analyses` for audit
    // and rate-limiting.
    //
    // Rate limits (per 24h rolling):
    //   anonymous (by IP): 2 analyses
    //   signed-in free:    5 analyses
    //   paid subscribers:  unlimited
    // ============================================================================
    if (route === '/rejection/analyze' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const letter = String(body.letter || '').trim().slice(0, 8000)
      if (letter.length < 40) {
        return withCORS(NextResponse.json({
          error: 'Rejection letter is too short — paste the full message so we can find useful patterns.',
        }, { status: 400 }))
      }

      const profile = body.profile && typeof body.profile === 'object' ? body.profile : {}

      // ---- Rate limiting ----
      const currentUser = await getSessionUser()
      const isPaid = !!(currentUser?.subscription && (
        currentUser.subscription.plan === 'lifetime' ||
        currentUser.subscription.status === 'active' ||
        currentUser.subscription.status === 'trialing'
      ))
      const isOwner = currentUser?.role === 'owner'
      const unlimited = isPaid || isOwner

      let usageKey, dailyLimit
      if (currentUser) { usageKey = `user:${currentUser.id}`; dailyLimit = 5 }
      else {
        const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') || 'anon'
        usageKey = `ip:${rawIp}`; dailyLimit = 2
      }
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const used = unlimited ? 0 : await db.collection('rejection_analyses').countDocuments({
        rl_key: usageKey, created_at: { $gte: dayAgo },
      })
      if (!unlimited && used >= dailyLimit) {
        return withCORS(NextResponse.json({
          error: 'rate_limited',
          message: currentUser
            ? `You\u2019ve used all ${dailyLimit} rejection analyses today. Reserve founder pricing for unlimited.`
            : `You\u2019ve used all ${dailyLimit} anonymous rejection analyses today. Create a free account for ${5}/day.`,
          require: currentUser ? 'paywall' : 'signup',
          used, daily_limit: dailyLimit,
        }, { status: 429 }))
      }

      // ---- Ask Claude to extract structured signals ----
      const REJECTION_SYSTEM = `You are a scholarship application analyst. Given a rejection letter (and optional user profile), extract STRUCTURED signals. Be empathetic but decisive. Never invent scholarships or details not stated in the letter.

Return STRICT JSON only (no prose, no markdown fences) with this shape:
{
  "scholarship_mentioned": string | null,          // scholarship name if clearly identifiable, else null
  "provider_mentioned": string | null,             // provider/institution if clearly identifiable
  "rejection_categories": [                        // ranked by likelihood, max 4
    {
      "code": "profile_below_bar" | "field_mismatch" | "nationality_ineligible" | "documentation" | "timing" | "high_competition" | "language_score" | "financial_criteria" | "essay_or_interview" | "unknown",
      "confidence": "high" | "medium" | "low",
      "reason": string,                             // 1 short sentence, factual, no assumptions beyond letter
      "quoted_signal": string                       // short quote from the letter that supports this (max 120 chars)
    }
  ],
  "profile_gaps": [                                // 2-5 SPECIFIC gaps the user should close
    { "area": "GPA" | "IELTS/TOEFL" | "work experience" | "publications" | "field alignment" | "leadership" | "documentation" | "financial demonstration", "action": string /* short imperative like "Retake IELTS to 8.0" */ }
  ],
  "recovery_time_estimate": "weeks" | "3-6 months" | "6-12 months" | "12+ months",
  "empathy_note": string                            // 1-2 sentences, kind, honest, forward-looking
}

STRICT RULES:
- If the letter is generic and gives no signal, use code "unknown" for categories and low confidence.
- Do NOT recommend specific scholarships in this JSON (a separate step does that from a verified DB).
- Do NOT judge the user. Rejection letters rarely reveal the real reason; state uncertainty honestly.`

      let extracted
      try {
        const rawJson = await callClaude({
          system: REJECTION_SYSTEM,
          messages: [{
            role: 'user',
            content: `Rejection letter:\n"""\n${letter}\n"""\n\nUser profile (optional): ${JSON.stringify(profile)}\n\nReturn the JSON now.`,
          }],
          temperature: 0.2,
          maxTokens: 1200,
        })
        // Try to parse: strip any code fences just in case.
        const cleaned = rawJson.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
        extracted = JSON.parse(cleaned)
      } catch (e) {
        return withCORS(NextResponse.json({
          error: 'Analysis failed — please try again in a moment.',
          detail: String(e?.message || e),
        }, { status: 502 }))
      }

      // ---- Find real, better-fit alternatives from our DB ----
      // We use the user's profile hints + gap areas to run the deterministic matcher.
      const scholarships = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } }).limit(400).toArray()

      // Derive a synthetic answers payload for matchScholarships.
      // Boost profile using gap awareness — if the letter flagged an IELTS gap,
      // don't pretend they have a higher score; keep their actual.
      const answers = {
        education_level: profile.degree || profile.education_level || 'masters',
        field:           profile.field || 'all',
        nationality:     profile.nationality || profile.country || '',
        gpa:             Number(profile.gpa) || null,
        gpa_scale:       profile.gpa_scale || '4',
        ielts:           Number(profile.ielts) || null,
        toefl:           Number(profile.toefl) || null,
        funding_pref:    'any',
        work_exp:        String(profile.work_exp ?? ''),
        timeline:        'flexible',
      }
      const ranked = (typeof matchScholarships === 'function')
        ? matchScholarships(answers, scholarships)
        : []

      // Filter out any scholarship name that appears in the rejection letter to
      // avoid re-suggesting the exact program the user was rejected from.
      const rejectedName = (extracted?.scholarship_mentioned || '').toLowerCase()
      const alternatives = ranked
        .filter(s => !rejectedName || !String(s.scholarship_name || '').toLowerCase().includes(rejectedName))
        .slice(0, 5)
        .map(s => ({
          scholarship_id: s.scholarship_id,
          slug: s.slug,
          name: s.scholarship_name,
          provider: s.university_name,
          country: s.country,
          fit_score: s.overall_fit_score,
          funding_type: s.funding_type,
          funding_amount: s.funding_amount,
          reasons: (s.reasons || []).slice(0, 3),
          gaps: (s.gaps || []).slice(0, 2),
          source_url: s.source_url,
        }))

      // ---- Audit (hashed, no plaintext letter) ----
      const letterHash = crypto.createHash('sha256').update(letter).digest('hex').slice(0, 24)
      await db.collection('rejection_analyses').insertOne({
        id: uuidv4(),
        rl_key: usageKey,
        user_id: currentUser?.id || null,
        letter_hash: letterHash,
        letter_length: letter.length,
        categories: (extracted?.rejection_categories || []).map(c => c.code),
        alt_ids: alternatives.map(a => a.scholarship_id).filter(Boolean),
        created_at: new Date(),
      }).catch(() => {})

      return withCORS(NextResponse.json({
        ok: true,
        analysis: extracted,
        alternatives,
        usage: {
          used: unlimited ? 0 : used + 1,
          daily_limit: unlimited ? null : dailyLimit,
          unlimited,
          remaining: unlimited ? null : Math.max(0, dailyLimit - (used + 1)),
          tier: unlimited ? 'unlimited' : (currentUser ? 'free_signed_in' : 'anonymous'),
        },
      }))
    }

    // ------- Nova usage snapshot (frontend uses this to show the counter) -------
    if (route === '/advisor/usage' && method === 'GET') {
      const currentUser = await getSessionUser()
      const isPaid = !!(currentUser?.subscription && (
        currentUser.subscription.plan === 'lifetime' ||
        currentUser.subscription.status === 'active' ||
        currentUser.subscription.status === 'trialing'
      ))
      const isOwner = currentUser?.role === 'owner'
      const unlimited = isPaid || isOwner
      let usageKey, dailyLimit
      if (currentUser) { usageKey = `user:${currentUser.id}`; dailyLimit = 10 }
      else {
        const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') || 'anon'
        usageKey = `ip:${rawIp}`; dailyLimit = 3
      }
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const used = unlimited ? 0 : await db.collection('nova_usage').countDocuments({
        key: usageKey, created_at: { $gte: dayAgo },
      })
      return withCORS(NextResponse.json({
        used,
        daily_limit: unlimited ? null : dailyLimit,
        remaining: unlimited ? null : Math.max(0, dailyLimit - used),
        unlimited,
        signed_in: !!currentUser,
        tier: unlimited ? 'unlimited' : (currentUser ? 'free_signed_in' : 'anonymous'),
      }))
    }

    if (route === '/advisor/history' && method === 'GET') {
      const url = new URL(request.url)
      const sessionId = url.searchParams.get('session_id')
      if (!sessionId) return withCORS(NextResponse.json({ messages: [] }))
      const messages = await db.collection('advisor_messages')
        .find({ session_id: sessionId }).sort({ created_at: 1 }).limit(200).toArray()
      return withCORS(NextResponse.json({ messages: messages.map(({ _id, ...m }) => m) }))
    }

    // ------- Application tracker -------
    if (route === '/tracker' && method === 'POST') {
      const body = await request.json()
      const now = new Date()
      const filter = { user_id: body.user_id, scholarship_id: body.scholarship_id }
      const update = { $set: { ...body, updated_at: now }, $setOnInsert: { id: uuidv4(), created_at: now } }
      await db.collection('trackers').updateOne(filter, update, { upsert: true })
      const doc = await db.collection('trackers').findOne(filter)
      const { _id, ...clean } = doc
      return withCORS(NextResponse.json({ tracker: clean }))
    }
    if (route === '/tracker' && method === 'GET') {
      const url = new URL(request.url)
      const userId = url.searchParams.get('user_id')
      const items = await db.collection('trackers').find({ user_id: userId }).toArray()
      return withCORS(NextResponse.json({ items: items.map(({ _id, ...t }) => t) }))
    }

    // ============ DOCUMENT PARSING (TRANSCRIPT / ESSAY) ============
    // Accepts multipart/form-data with a `file` field (PDF, DOCX, or TXT).
    // Extracts raw text in-memory (no persistence) and returns it so the
    // client can review / edit and feed it into /api/readiness. Max 10 MB.
    if (route === '/readiness/parse' && method === 'POST') {
      try {
        let form
        try {
          form = await request.formData()
        } catch (e) {
          return withCORS(NextResponse.json({ error: 'Expected multipart/form-data with a `file` field' }, { status: 400 }))
        }
        const file = form.get('file')
        if (!file || typeof file === 'string') {
          return withCORS(NextResponse.json({ error: 'file field is required' }, { status: 400 }))
        }
        const MAX = 10 * 1024 * 1024 // 10 MB
        if (file.size > MAX) {
          return withCORS(NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 }))
        }
        const name = String(file.name || '').toLowerCase()
        const type = String(file.type || '').toLowerCase()
        const buf = Buffer.from(await file.arrayBuffer())

        let text = ''
        let kind = ''
        if (name.endsWith('.pdf') || type === 'application/pdf') {
          kind = 'pdf'
          const { PDFParse } = nodeRequire('pdf-parse')
          const parser = new PDFParse(new Uint8Array(buf))
          try {
            const out = await parser.getText()
            text = String(out?.text || '').trim()
          } finally {
            try { await parser.destroy?.() } catch { /* parser cleanup errors ignored */ }
          }
        } else if (name.endsWith('.docx') || type.includes('officedocument.wordprocessingml')) {
          kind = 'docx'
          const mammoth = nodeRequire('mammoth')
          const { value } = await mammoth.extractRawText({ buffer: buf })
          text = String(value || '').trim()
        } else if (name.endsWith('.txt') || type.startsWith('text/')) {
          kind = 'txt'
          text = buf.toString('utf-8').trim()
        } else {
          return withCORS(NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' }, { status: 400 }))
        }

        if (!text || text.length < 20) {
          return withCORS(NextResponse.json({ error: 'Could not extract readable text from this file. If it is a scanned image PDF, please paste the text instead.' }, { status: 422 }))
        }
        // Hard cap on returned text — Claude context safety (approx 60k chars ~ 15k tokens)
        const CAP = 60000
        const truncated = text.length > CAP
        if (truncated) text = text.slice(0, CAP)

        return withCORS(NextResponse.json({
          ok: true,
          kind,
          filename: file.name,
          size: file.size,
          chars: text.length,
          truncated,
          text,
        }))
      } catch (e) {
        return withCORS(NextResponse.json({ error: 'Failed to parse document', detail: String(e?.message || e) }, { status: 500 }))
      }
    }

    // ============ APPLICATION READINESS SCORE ============
    // The killer differentiator. Given a profile + scholarship, Claude rates
    // the applicant's competitiveness on a 0-100 scale and tells them exactly
    // what to strengthen. Cached in `readiness_cache` (7-day TTL).
    // Optionally accepts transcript_text and essay_text (extracted from the
    // user's uploaded documents via /api/readiness/parse) for a deeper,
    // evidence-weighted analysis.
    if (route === '/readiness' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const profile = body.profile
      const scholarshipId = body.scholarship_id
      const forceRefresh = !!body.force_refresh
      const transcriptText = String(body.transcript_text || '').trim()
      const essayText = String(body.essay_text || '').trim()
      if (!profile || !scholarshipId) {
        return withCORS(NextResponse.json({ error: 'profile and scholarship_id required' }, { status: 400 }))
      }

      const sch = await db.collection('scholarships').findOne({ id: scholarshipId })
      if (!sch) return withCORS(NextResponse.json({ error: 'scholarship not found' }, { status: 404 }))

      // Hash uploaded document contents into the cache key so different
      // transcripts/essays produce fresh analyses.
      const docHash = crypto.createHash('sha256')
        .update(transcriptText + '\n---\n' + essayText).digest('hex').slice(0, 16)

      // Cache key = profile fingerprint + scholarship id + document hash
      const keyFields = {
        nationality: profile.nationality,
        degree_level: profile.degree_level,
        intended_major: profile.intended_major,
        gpa: profile.gpa, gpa_scale: profile.gpa_scale,
        ielts: profile.ielts, toefl: profile.toefl,
        sat: profile.sat, act: profile.act, gre: profile.gre,
        achievements: profile.achievements || '',
        scholarship_id: scholarshipId,
        doc_hash: docHash,
      }
      const cacheKey = crypto.createHash('sha256').update(JSON.stringify(keyFields)).digest('hex')
      const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

      if (!forceRefresh) {
        const cached = await db.collection('readiness_cache').findOne({ cache_key: cacheKey })
        if (cached && (Date.now() - new Date(cached.created_at).getTime()) < CACHE_TTL_MS) {
          return withCORS(NextResponse.json({ readiness: cached.result, cached: true }))
        }
      }

      const hasDocs = !!(transcriptText || essayText)

      const system = `You are a scholarship admissions expert. Given a student profile and a single scholarship record, honestly assess the student's competitiveness on a 0-100 scale and provide a concrete, prioritized action plan. RULES:
- Use ONLY the provided profile data, scholarship record, and any uploaded transcript/essay text; do not invent facts.
- If a scholarship criterion isn't stated in the record, do not assume it — note it as "unclear from source".
- Be honest, even blunt. Do not inflate scores.
- Score buckets: 80-100 Strong · 60-79 Competitive · 40-59 Reach · 0-39 Long-shot
- Each gap must include impact_points (0-30) = how many points the score would rise if that gap were closed.${hasDocs ? `
- **Documents provided:** the student uploaded ${transcriptText ? 'a transcript' : ''}${transcriptText && essayText ? ' and ' : ''}${essayText ? 'an essay/personal statement' : ''}. Weight this evidence heavily:
  * Transcript: verify GPA, look at course rigor (advanced/graduate-level courses, math/science density, upward trend, failing grades, retakes), majors/minors, honors, transfer notes.
  * Essay: judge narrative clarity, specificity of goals, alignment with the scholarship's mission, evidence of impact (numbers, outcomes), authenticity vs. cliché, grammar/prose quality, and whether it directly addresses this scholarship's stated criteria.
  * Reference specific quotes or courses from the uploaded documents in "strengths" and "gaps" so the student knows the evidence base.
  * If the transcript's GPA contradicts the profile's stated GPA, flag it as a "gap" with high impact_points.` : `
- No transcript or essay was uploaded. Note in the headline that a deeper analysis is possible if the student uploads their documents.`}
- Return STRICT JSON — no prose, no markdown fences.`

      const truncate = (s, n) => (s.length > n ? s.slice(0, n) + '\n[...truncated]' : s)
      const user = `SCHOLARSHIP:
${JSON.stringify({
  name: sch.scholarship_name,
  university: sch.university_name,
  country: sch.country,
  degree_levels: sch.degree_levels,
  major_fields: sch.major_fields,
  eligible_nationalities: sch.eligible_nationalities,
  funding: sch.funding_type,
  funding_summary: sch.funding_summary,
  min_gpa: sch.min_gpa,
  min_ielts: sch.min_ielts,
  min_toefl: sch.min_toefl,
  eligibility: sch.eligibility_summary,
  required_documents: sch.required_documents,
  deadline: sch.deadline_note || sch.deadline_status,
}, null, 2)}

PROFILE:
${JSON.stringify(profile, null, 2)}
${transcriptText ? `\nUPLOADED TRANSCRIPT (raw extracted text):\n"""\n${truncate(transcriptText, 25000)}\n"""` : ''}
${essayText ? `\nUPLOADED ESSAY / PERSONAL STATEMENT (raw extracted text):\n"""\n${truncate(essayText, 20000)}\n"""` : ''}

Respond with STRICT JSON in this schema:
{
  "score": 0-100 integer,
  "bucket": "Strong" | "Competitive" | "Reach" | "Long-shot",
  "headline": "one honest sentence explaining the score",
  "eligibility_status": "Eligible" | "Likely eligible" | "Ineligible" | "Unclear from source",
  "eligibility_reason": "short explanation",
  "strengths": [ { "label": "short", "detail": "sentence — cite transcript/essay evidence if available" } ],  // 2-4 items
  "gaps": [ { "label": "short", "detail": "sentence — cite transcript/essay evidence if available", "impact_points": 5-25 } ],  // 2-4 items, sorted highest impact first
  "actions": [ { "step": "concrete action", "impact_points": 5-25, "effort": "Low" | "Medium" | "High" } ],  // 3-5 items, sorted by ROI
  "waste_risk": "Low" | "Medium" | "High",  // effort-vs-fit — should they even bother?
  "essay_feedback": ${essayText ? '{ "clarity": 0-100, "specificity": 0-100, "alignment": 0-100, "notes": "2-3 sentences on how to strengthen the essay for this specific scholarship" }' : 'null'},
  "transcript_signals": ${transcriptText ? '{ "gpa_verified": true|false, "course_rigor": "Low"|"Medium"|"High", "trend": "Upward"|"Flat"|"Downward"|"Mixed", "notes": "2-3 sentences on standout or concerning academic patterns" }' : 'null'}
}`

      try {
        const claudeRes = await callClaude({
          system,
          messages: [{ role: 'user', content: user }],
          maxTokens: 2000,
          temperature: 0.2,
        })
        let parsed
        try {
          const clean = claudeRes.replace(/```json\s*|```/g, '').trim()
          parsed = JSON.parse(clean)
        } catch (e) {
          return withCORS(NextResponse.json({ error: 'AI returned invalid JSON', detail: claudeRes.slice(0, 300) }, { status: 502 }))
        }

        // Cache
        await db.collection('readiness_cache').updateOne(
          { cache_key: cacheKey },
          { $set: { cache_key: cacheKey, result: parsed, created_at: new Date(), profile_snapshot: keyFields } },
          { upsert: true },
        )

        return withCORS(NextResponse.json({ readiness: parsed, cached: false }))
      } catch (e) {
        return withCORS(NextResponse.json({ error: 'Readiness analysis failed', detail: String(e.message) }, { status: 502 }))
      }
    }

    // ------- Pre-orders / Founder reservations -------
    // Payments are not yet activated. This endpoint captures buyer intent
    // (email + chosen tier + billing cycle + locked-in founder price) so we
    // can send checkout links when LemonSqueezy goes live.
    if (route === '/preorder' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      const tier  = String(body.tier  || '').trim().toLowerCase()
      const cycle = String(body.cycle || 'monthly').trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Valid email required' }, { status: 400 }))
      }
      // Accept legacy tiers (pro/elite, quarterly/half_yearly for existing subs) and current plans (monthly/annual/lifetime)
      const VALID_TIERS = ['pro', 'elite', 'monthly', 'annual', 'lifetime', 'quarterly', 'half_yearly']
      if (!VALID_TIERS.includes(tier)) {
        return withCORS(NextResponse.json({ error: 'Invalid tier' }, { status: 400 }))
      }
      const now = new Date()
      const doc = {
        id: uuidv4(),
        email,
        tier,
        cycle,
        founder_price_monthly: body.founder_price_monthly || null,
        founder_price_yearly:  body.founder_price_yearly  || null,
        status: 'reserved',
        source: String(body.source || 'unknown').slice(0, 60),
        ip: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null,
        user_agent: (request.headers.get('user-agent') || '').slice(0, 200),
        created_at: now,
      }
      // Idempotent — same email+tier+cycle upserts, bumps updated_at
      await db.collection('preorders').updateOne(
        { email, tier, cycle },
        { $setOnInsert: doc, $set: { updated_at: now } },
        { upsert: true },
      )
      // If the user is signed in, also flag their user document with
      // `entitlement: 'founder_pending'` so premium features unlock early.
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get('sf_session')?.value
      if (sessionToken) {
        const s = await db.collection('sessions').findOne({ session_token: sessionToken })
        if (s?.user_id) {
          await db.collection('users').updateOne(
            { id: s.user_id },
            { $set: { entitlement: 'founder_pending', founder_tier: tier, founder_cycle: cycle, founder_since: now } },
          )
        }
      }
      return withCORS(NextResponse.json({ ok: true, message: 'Your founder spot is reserved.' }))
    }

    if (route === '/preorders' && method === 'GET') {
      if (!adminOK()) return requireAdmin()
      const items = await db.collection('preorders').find({}).sort({ created_at: -1 }).limit(500).toArray()
      return withCORS(NextResponse.json({ items: items.map(({ _id, ...i }) => i) }))
    }

    // ------- Admin auth login endpoint -------
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      if (body.password && body.password === ADMIN_PASSWORD) {
        return withCORS(NextResponse.json({ ok: true, token: ADMIN_PASSWORD }))
      }
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 }))
    }

    // ============================================================================
    // Admin — Seed the owner account.
    // Idempotent: creates or resets the owner user with lifetime VIP access.
    // Required in any fresh environment (e.g. a new production deploy has an
    // empty users collection, so the owner needs bootstrapping).
    //
    // Auth: pass the ADMIN_PASSWORD either as `x-admin-key` header OR in the
    // POST JSON body as `admin_password`. Returns the email/password to use.
    // ============================================================================
    if (route === '/admin/seed-owner' && method === 'POST') {
      const hdr = request.headers.get('x-admin-key') || ''
      const body = await request.json().catch(() => ({}))
      const pass = body.admin_password || hdr
      if (!ADMIN_PASSWORD || pass !== ADMIN_PASSWORD) {
        return withCORS(NextResponse.json({ ok: false, error: 'Invalid admin password' }, { status: 401 }))
      }
      const bcrypt = nodeRequire('bcryptjs')

      // Allow the caller to override credentials, else fall back to defaults.
      const email    = String(body.email    || 'admin@scholarshipfit.com').toLowerCase().trim()
      const password = String(body.password || 'ScholarshipFitOwner2026!')
      if (password.length < 8) {
        return withCORS(NextResponse.json({ ok: false, error: 'Password must be 8+ chars' }, { status: 400 }))
      }
      const password_hash = await bcrypt.hash(password, 10)
      const now = new Date()
      const lifetimeSub = {
        plan: 'lifetime',
        status: 'active',
        provider: 'admin-seed',
        price_usd: 79,
        billing_cycle_days: null,
        activated_at: now,
        trial_end: null,
        trial_used: true,
        expires_at: null,
        monthly_rate_usd: 0,
        updated_at: now,
      }

      const existing = await db.collection('users').findOne({ email })
      let userId
      if (existing) {
        userId = existing.id
        await db.collection('users').updateOne(
          { email },
          {
            $set: {
              password_hash,
              name: existing.name || 'Bakhrom Batyrov (Owner)',
              role: 'owner',
              entitlement: 'founder',
              subscription: lifetimeSub,
              updated_at: now,
            },
          },
        )
      } else {
        userId = uuidv4()
        await db.collection('users').insertOne({
          id: userId,
          email,
          name: 'Bakhrom Batyrov (Owner)',
          password_hash,
          role: 'owner',
          entitlement: 'founder',
          subscription: lifetimeSub,
          cabinet: { favorites: [], recent_searches: [], profile: {} },
          created_at: now,
          updated_at: now,
        })
      }

      return withCORS(NextResponse.json({
        ok: true,
        action: existing ? 'updated' : 'created',
        user: { id: userId, email, role: 'owner', subscription: { plan: 'lifetime', status: 'active' } },
        message: `Owner account ${existing ? 'reset' : 'created'}. Sign in at /login with email "${email}".`,
      }))
    }

    // ============ Email + Password Auth ============
    // Alternative to Google — users can register/login with a password.
    // The session cookie is the same `sf_session`, sessions collection
    // still stores {session_token, user_id, created_at}, so downstream
    // getSessionUser() works transparently for both auth methods.

    const setSessionCookie = async (userId) => {
      const token = uuidv4() + '-' + crypto.randomBytes(24).toString('hex')
      const cookieStore = await cookies()
      cookieStore.set('sf_session', token, {
        httpOnly: true, secure: true, sameSite: 'none', path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days for password login
      })
      await db.collection('sessions').insertOne({
        session_token: token, user_id: userId, auth_method: 'password', created_at: new Date(),
      })
      return token
    }

    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email    = String(body.email    || '').trim().toLowerCase()
      const password = String(body.password || '')
      const name     = String(body.name     || '').trim().slice(0, 120) || email.split('@')[0]
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 }))
      }
      if (password.length < 8) {
        return withCORS(NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 }))
      }
      const users = db.collection('users')
      const existing = await users.findOne({ email })

      // Already fully registered + verified → block, tell them to sign in
      if (existing?.password_hash && existing?.email_verified === true) {
        return withCORS(NextResponse.json({ error: 'Account already exists — sign in instead' }, { status: 409 }))
      }

      const password_hash = await bcrypt.hash(password, 10)
      const now = new Date()
      let userDoc
      if (existing) {
        // Two paths hit this branch:
        //   a) Google user adding a password — keep their email_verified (from grandfather)
        //   b) Prior signup where user never verified — overwrite password + require re-verification
        const wasVerified = existing.email_verified === true
        await users.updateOne(
          { id: existing.id },
          { $set: {
              password_hash,
              name: existing.name || name,
              last_login: now,
              email_verified: wasVerified,  // preserve if true, otherwise keep false
            } },
        )
        userDoc = { ...existing, password_hash, name: existing.name || name, last_login: now, email_verified: wasVerified }
      } else {
        userDoc = {
          id: uuidv4(),
          email, name, password_hash,
          picture: null,
          cabinet: { favorites: [], recent_searches: [], profile: {} },
          created_at: now,
          last_login: now,
          auth_method: 'password',
          email_verified: false,
          email_verified_at: null,
        }
        await users.insertOne(userDoc)
      }

      // If somehow already verified (Google user setting password), issue session immediately
      if (userDoc.email_verified === true) {
        await setSessionCookie(userDoc.id)
        const { _id, password_hash: _p, ...clean } = userDoc
        return withCORS(NextResponse.json({ user: clean, ok: true, verified: true }))
      }

      // Otherwise: generate + send OTP, DO NOT create a session yet
      const code = crypto.randomInt(100000, 1000000).toString()
      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      const otpExpires = new Date(now.getTime() + 10 * 60 * 1000) // 10 min
      await db.collection('email_verifications').updateOne(
        { email },
        { $set: {
            email,
            user_id: userDoc.id,
            code_hash: codeHash,
            attempts: 0,
            last_sent_at: now,
            expires_at: otpExpires,
            purpose: 'signup',
          } },
        { upsert: true },
      )

      const mailRes = await sendVerificationEmail({ to: email, code, name: userDoc.name })
      if (!mailRes.ok) {
        // Log but don't leak the code — return a generic error
        console.error('[send-otp] failed for', email, ':', mailRes.error)
        return withCORS(NextResponse.json({ error: 'Could not send verification email. Please try again.' }, { status: 502 }))
      }

      // PostHog server event (fire-and-forget)
      captureServerEvent({ distinctId: userDoc.id, event: 'otp_sent', properties: { purpose: 'signup', email_domain: email.split('@')[1] } }).catch(() => {})

      // Dev-only test hook — if NODE_ENV != production AND the request explicitly
      // passes { _test: true }, return the plaintext code so the automated
      // testing agent can complete the happy path without needing to read email.
      const dbg = (process.env.NODE_ENV !== 'production' && body?._test === true) ? { _debug_code: code } : {}

      return withCORS(NextResponse.json({
        ok: true,
        verified: false,
        needs_verification: true,
        email,
        message: 'We sent a 6-digit code to your email. It expires in 10 minutes.',
        ...dbg,
      }))
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email    = String(body.email    || '').trim().toLowerCase()
      const password = String(body.password || '')
      if (!email || !password) {
        return withCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      }
      const user = await db.collection('users').findOne({ email })
      if (!user || !user.password_hash) {
        return withCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      }
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) {
        return withCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      }
      // Block unverified users — direct them to /verify-email
      if (user.email_verified === false) {
        return withCORS(NextResponse.json({
          error: 'Please verify your email first',
          needs_verification: true,
          email,
        }, { status: 403 }))
      }
      await db.collection('users').updateOne({ id: user.id }, { $set: { last_login: new Date() } })
      await setSessionCookie(user.id)
      const { _id, password_hash, ...clean } = user
      return withCORS(NextResponse.json({ user: clean, ok: true }))
    }

    // ============ Email OTP: send + verify ============
    // /auth/send-otp — user asks for a fresh code (from /verify-email "Resend" button)
    if (route === '/auth/send-otp' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Invalid email' }, { status: 400 }))
      }
      const users = db.collection('users')
      const user = await users.findOne({ email })
      // For privacy, always return ok=true even if the email isn't registered — otherwise
      // this endpoint becomes an email enumeration oracle. Only actually send if the user
      // exists AND is not already verified.
      if (!user || user.email_verified === true) {
        return withCORS(NextResponse.json({ ok: true, sent: false }))
      }
      const now = new Date()
      const evCol = db.collection('email_verifications')
      const prev = await evCol.findOne({ email })
      if (prev?.last_sent_at) {
        const secs = (now.getTime() - new Date(prev.last_sent_at).getTime()) / 1000
        if (secs < 60) {
          return withCORS(NextResponse.json({
            error: `Please wait ${Math.ceil(60 - secs)}s before requesting a new code.`,
            retry_in_seconds: Math.ceil(60 - secs),
          }, { status: 429 }))
        }
      }
      const code = crypto.randomInt(100000, 1000000).toString()
      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      const expires = new Date(now.getTime() + 10 * 60 * 1000)
      await evCol.updateOne(
        { email },
        { $set: { email, user_id: user.id, code_hash: codeHash, attempts: 0, last_sent_at: now, expires_at: expires, purpose: 'signup' } },
        { upsert: true },
      )
      const mailRes = await sendVerificationEmail({ to: email, code, name: user.name })
      if (!mailRes.ok) {
        return withCORS(NextResponse.json({ error: 'Could not send verification email. Please try again.' }, { status: 502 }))
      }
      captureServerEvent({ distinctId: user.id, event: 'otp_resent', properties: { purpose: 'signup' } }).catch(() => {})
      const dbg = (process.env.NODE_ENV !== 'production' && body?._test === true) ? { _debug_code: code } : {}
      return withCORS(NextResponse.json({ ok: true, sent: true, ...dbg }))
    }

    // /auth/verify-otp — user submits their 6-digit code
    if (route === '/auth/verify-otp' && method === 'POST') {      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      const code  = String(body.code  || '').trim()
      if (!/^\d{6}$/.test(code)) {
        return withCORS(NextResponse.json({ error: 'Enter the 6-digit code' }, { status: 400 }))
      }
      const evCol = db.collection('email_verifications')
      const record = await evCol.findOne({ email })
      if (!record) {
        return withCORS(NextResponse.json({ error: 'Code expired or invalid. Please request a new one.' }, { status: 400 }))
      }
      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        await evCol.deleteOne({ email }).catch(() => {})
        return withCORS(NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 }))
      }
      if ((record.attempts || 0) >= 5) {
        await evCol.deleteOne({ email }).catch(() => {})
        captureServerEvent({ distinctId: record.user_id || email, event: 'otp_locked', properties: { purpose: record.purpose || 'signup' } }).catch(() => {})
        return withCORS(NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 403 }))
      }
      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      if (codeHash !== record.code_hash) {
        await evCol.updateOne({ email }, { $inc: { attempts: 1 } })
        captureServerEvent({ distinctId: record.user_id || email, event: 'otp_failed', properties: { purpose: record.purpose || 'signup', attempt: (record.attempts || 0) + 1 } }).catch(() => {})
        return withCORS(NextResponse.json({ error: 'Invalid verification code' }, { status: 400 }))
      }
      // Success! Mark user verified, drop record, set session cookie
      const users = db.collection('users')
      await users.updateOne(
        { id: record.user_id },
        { $set: { email_verified: true, email_verified_at: new Date(), email_verified_source: 'otp' } },
      )
      await evCol.deleteOne({ email }).catch(() => {})
      await setSessionCookie(record.user_id)
      const user = await users.findOne({ id: record.user_id })
      captureServerEvent({ distinctId: record.user_id, event: 'otp_verified', properties: { purpose: record.purpose || 'signup' } }).catch(() => {})
      captureServerEvent({ distinctId: record.user_id, event: 'signup_verified', properties: { method: 'email_otp' } }).catch(() => {})
      const { _id, password_hash, ...clean } = user || {}
      return withCORS(NextResponse.json({ ok: true, user: clean }))
    }

    // ============ Password reset flow ============
    // /auth/forgot-password — user asks for reset link
    if (route === '/auth/forgot-password' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 }))
      }
      // Always return a generic ok response — never reveal whether the email exists.
      const GENERIC_OK = { ok: true, message: "If an account with that email exists, we've sent a reset link." }
      const users = db.collection('users')
      const user  = await users.findOne({ email })
      if (!user || !user.password_hash) {
        // No account, or Google-only user (they should use "Continue with Google" instead)
        return withCORS(NextResponse.json(GENERIC_OK))
      }

      const now  = new Date()
      const prCol = db.collection('password_resets')

      // Rate-limit: 1 request per 60 seconds per email
      const recent = await prCol.findOne({ email, created_at: { $gt: new Date(now.getTime() - 60 * 1000) } })
      if (recent) {
        // Still return the generic message so we don't leak that user exists via rate-limit response
        return withCORS(NextResponse.json(GENERIC_OK))
      }

      // Cryptographically-strong URL-safe token (32 bytes → 43 chars base64url)
      const token     = crypto.randomBytes(32).toString('base64url')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 60 min

      await prCol.insertOne({
        email,
        user_id: user.id,
        token_hash: tokenHash,
        created_at: now,
        expires_at: expiresAt,
        used: false,
        request_ip: request.headers.get('x-forwarded-for') || null,
      })

      const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'
      const resetUrl = `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

      const mailRes = await sendPasswordResetEmail({ to: email, resetUrl, name: user.name })
      if (!mailRes.ok) {
        console.error('[forgot-password] mail failed for', email, ':', mailRes.error)
        // Still return generic — user retries or contacts support
      } else {
        captureServerEvent({ distinctId: user.id, event: 'password_reset_requested', properties: { email_domain: email.split('@')[1] } }).catch(() => {})
      }

      // Dev-only: expose token so testing agent can complete the flow
      const dbg = (process.env.NODE_ENV !== 'production' && body?._test === true) ? { _debug_token: token, _debug_url: resetUrl } : {}
      return withCORS(NextResponse.json({ ...GENERIC_OK, ...dbg }))
    }

    // /auth/reset-password — user submits new password with the token
    if (route === '/auth/reset-password' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const token       = String(body.token       || '').trim()
      const email       = String(body.email       || '').trim().toLowerCase()
      const newPassword = String(body.new_password || body.password || '')

      if (!token || !email) {
        return withCORS(NextResponse.json({ error: 'Invalid reset link' }, { status: 400 }))
      }
      if (newPassword.length < 8) {
        return withCORS(NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 }))
      }
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const prCol = db.collection('password_resets')
      const record = await prCol.findOne({ token_hash: tokenHash, email })
      if (!record) {
        return withCORS(NextResponse.json({ error: 'This reset link is invalid or expired. Please request a new one.' }, { status: 400 }))
      }
      if (record.used) {
        return withCORS(NextResponse.json({ error: 'This reset link has already been used. Please request a new one.' }, { status: 400 }))
      }
      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        await prCol.deleteOne({ _id: record._id }).catch(() => {})
        return withCORS(NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 }))
      }

      const password_hash = await bcrypt.hash(newPassword, 10)
      const users = db.collection('users')
      // Also mark email_verified true — if the user got this email, they own the inbox.
      await users.updateOne(
        { id: record.user_id },
        { $set: {
            password_hash,
            email_verified: true,
            email_verified_at: new Date(),
            email_verified_source: record.email_verified_source || 'password_reset',
            last_login: new Date(),
          } },
      )
      // Mark this token used and invalidate all other outstanding reset tokens
      // for this user so old links can't be replayed.
      await prCol.updateOne({ _id: record._id }, { $set: { used: true, used_at: new Date() } }).catch(() => {})
      await prCol.deleteMany({ email, _id: { $ne: record._id } }).catch(() => {})

      // Log the user in immediately for a clean UX
      await setSessionCookie(record.user_id)
      const user = await users.findOne({ id: record.user_id })
      captureServerEvent({ distinctId: record.user_id, event: 'password_reset_completed', properties: {} }).catch(() => {})
      const { _id, password_hash: _ph, ...clean } = user || {}
      return withCORS(NextResponse.json({ ok: true, user: clean }))
    }

    // ============ Emergent Google Auth ============
    // Flow:
    //   1. Frontend redirects to auth.emergentagent.com/?redirect=<callback>
    //   2. Emergent handles Google OAuth
    //   3. Redirects back with #session_id=<sid> (URL fragment)
    //   4. Frontend hits /api/auth/session with X-Session-ID header
    //   5. We exchange with Emergent's data endpoint, upsert user in Mongo,
    //      set HttpOnly cookie
    // ---------------------------------------------

    if (route === '/auth/session' && method === 'POST') {
      // Exchange session_id from Emergent → real user + persistent cookie
      let sid = request.headers.get('x-session-id')
      if (!sid) {
        try { sid = (await request.json())?.session_id } catch { /* ignore */ }
      }
      if (!sid) {
        return withCORS(NextResponse.json({ error: 'Missing session_id' }, { status: 400 }))
      }

      // Try multiple upstream URLs — Emergent has served this endpoint from
      // different subdomains historically; we try each until one succeeds.
      const upstreamCandidates = [
        'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
        'https://auth.emergentagent.com/auth/v1/env/oauth/session-data',
      ]

      let emergentUser = null
      let lastError = ''
      for (const url of upstreamCandidates) {
        try {
          const controller = new AbortController()
          const t = setTimeout(() => controller.abort(), 10000)
          const r = await fetch(url, {
            method: 'GET',
            headers: { 'X-Session-ID': sid, 'Accept': 'application/json' },
            signal: controller.signal,
          })
          clearTimeout(t)
          if (!r.ok) {
            lastError = `${url.split('/')[2]} → ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`
            continue
          }
          emergentUser = await r.json()
          break
        } catch (e) {
          lastError = `${url.split('/')[2]} → ${e.message}`
        }
      }

      if (!emergentUser) {
        return withCORS(NextResponse.json({ error: 'Emergent auth exchange failed', detail: lastError }, { status: 401 }))
      }

      // Normalize the Emergent response — different versions of their API
      // return slightly different shapes. We accept both { email, name,
      // picture, session_token } and { user: { ... }, session_token }.
      const raw = emergentUser
      const emgId    = raw.id    || raw.user_id || raw.user?.id    || raw.email
      const email    = raw.email || raw.user?.email
      const name     = raw.name  || raw.user?.name || (email || '').split('@')[0]
      const picture  = raw.picture || raw.user?.picture || null
      const emgToken = raw.session_token || raw.token || raw.access_token

      if (!email || !emgToken) {
        return withCORS(NextResponse.json({ error: 'Malformed Emergent response', got_keys: Object.keys(raw) }, { status: 502 }))
      }

      // Upsert user + cabinet
      const users = db.collection('users')
      const now = new Date()
      const existing = await users.findOne({ emergent_id: emgId })
      let userDoc
      if (existing) {
        await users.updateOne(
          { emergent_id: emgId },
          { $set: { email, name, picture, last_login: now } },
        )
        userDoc = { ...existing, email, name, picture, last_login: now }
      } else {
        userDoc = {
          id: uuidv4(),
          emergent_id: emgId,
          email, name, picture,
          cabinet: { favorites: [], recent_searches: [], profile: {} },
          created_at: now,
          last_login: now,
        }
        await users.insertOne(userDoc)
      }

      // Set HttpOnly session cookie (7 days)
      const cookieStore = await cookies()
      cookieStore.set('sf_session', emgToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      await db.collection('sessions').updateOne(
        { session_token: emgToken },
        { $set: { session_token: emgToken, user_id: userDoc.id, created_at: now } },
        { upsert: true },
      )
      const { _id, ...cleanUser } = userDoc
      return withCORS(NextResponse.json({ user: cleanUser, ok: true }))
    }

    // (getSessionUser was hoisted above near the top of handleRoute so
    //  earlier routes can use it — no duplicate definition here.)

    if (route === '/auth/me' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ user: null }, { status: 200 }))
      const sub = user.subscription || null
      // Users get full access during trial ('trialing') AND when active until expiry.
      const isActive = sub && (sub.status === 'active' || sub.status === 'trialing') && (
        sub.plan === 'lifetime' || !sub.expires_at || new Date(sub.expires_at) > new Date()
      )
      return withCORS(NextResponse.json({
        user: { ...user, subscription_active: !!isActive }
      }))
    }

    // ---- Subscription APIs ----
    // Activation is currently in "manual-activation" mode: the frontend
    // simulates payment success and calls this to mark the user's subscription
    // active. When Stripe/LemonSqueezy is wired, this remains the internal
    // handler and the webhook simply calls it with a verified signature.
    if (route === '/subscription/activate' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const plan = (body?.plan || '').toLowerCase()

      // -----------------------------------------------------------------
      // REGIONAL / PPP PRICING — server-verified. The client can pass a
      // region_tier hint (from the /api/pricing/region call), but we
      // re-detect from headers to prevent spoofing bigger discounts.
      // -----------------------------------------------------------------
      const { tierForCountry, detectCountryFromHeaders, applyRegionalDiscount } = await import('@/lib/regional-pricing')
      const headerCountry = detectCountryFromHeaders(request.headers)
      // Fallback preference: header > user profile country > client hint > 'A'
      const clientHint = String(body?.country_code || '').toUpperCase().slice(0, 2)
      const profileCountry = String(user?.cabinet?.profile?.nationality || '').slice(0, 2).toUpperCase()
      const detected = headerCountry || profileCountry || clientHint || null
      const tier = tierForCountry(detected)
      // Plan catalogue: price = amount charged in the billing cycle, days = cycle length,
      // monthly_rate = effective $/mo shown to user. trial_days = 7-day free trial (except lifetime).
      // 2026 pricing (3 tiers — length-based):
      //   monthly  = $14.99 / 30d   (7-day trial)
      //   annual   = $89    / 365d  (7-day trial, save 51%)
      //   lifetime = $249   forever (no trial — one-time)
      const PLAN_CATALOGUE = {
        monthly:     { price: 14.99, days: 30,   monthly_rate: 14.99, trial_days: 7 },
        annual:      { price: 89,    days: 365,  monthly_rate: 7.42,  trial_days: 7 },
        lifetime:    { price: 249,   days: null, monthly_rate: 0,     trial_days: 0 },
        // Legacy plan keys (kept for backward compatibility with old tests / URLs / active subs).
        quarterly:   { price: 29,    days: 90,   monthly_rate: 9.67,  trial_days: 7 },
        half_yearly: { price: 49,    days: 180,  monthly_rate: 8.17,  trial_days: 7 },
        vip:         { price: 69,    days: 30,   monthly_rate: 69,    trial_days: 0 },
        pro:         { price: 9,     days: 30,   monthly_rate: 9,     trial_days: 0 },
        elite:       { price: 24,    days: 30,   monthly_rate: 24,    trial_days: 0 },
      }
      const cfg = PLAN_CATALOGUE[plan]
      if (!cfg) {
        return withCORS(NextResponse.json({ error: 'invalid plan' }, { status: 400 }))
      }
      const now = new Date()
      // Trial handling:
      //  - If cfg.trial_days > 0 and this is the user's FIRST activation → start in "trialing" status,
      //    trial_end = now + trial_days, first charge date = trial_end, expires_at = trial_end + billing_days
      //  - If lifetime (days=null) → status = active, no expiry
      //  - Otherwise (legacy, no trial) → status = active, expires_at = now + days
      const hasHadTrialBefore = !!(user.subscription && user.subscription.trial_used)
      const trialEligible = cfg.trial_days > 0 && !hasHadTrialBefore
      let status = 'active'
      let trialEnd = null
      let firstChargeAt = now
      let expiresAt = cfg.days == null ? null : new Date(now.getTime() + cfg.days * 24 * 60 * 60 * 1000)

      if (trialEligible) {
        status = 'trialing'
        trialEnd = new Date(now.getTime() + cfg.trial_days * 24 * 60 * 60 * 1000)
        firstChargeAt = trialEnd
        // User has full access during trial and full billing cycle after
        expiresAt = new Date(trialEnd.getTime() + cfg.days * 24 * 60 * 60 * 1000)
      }

      const subscription = {
        plan,
        status,                                // 'trialing' | 'active'
        activated_at: now,
        trial_end: trialEnd,
        trial_used: trialEligible ? true : hasHadTrialBefore,
        first_charge_at: firstChargeAt,
        expires_at: expiresAt,
        price_usd: applyRegionalDiscount(cfg.price, tier.key),  // discounted charge
        base_price_usd: cfg.price,                              // undiscounted reference
        monthly_rate_usd: applyRegionalDiscount(cfg.monthly_rate, tier.key),
        base_monthly_rate_usd: cfg.monthly_rate,
        region_tier: tier.key,                                  // 'A' | 'B' | 'C'
        region_country: tier.country,                           // ISO code or null
        region_discount_pct: Math.round(tier.discount * 100),
        billing_cycle_days: cfg.days,
        trial_days: cfg.trial_days,
        payment_method: body?.payment_method_id ? 'card_captured' : 'pending_gateway',
        payment_reference: body?.payment_reference || null,
      }
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { subscription, updated_at: now } }
      )
      await db.collection('subscription_events').insertOne({
        id: uuidv4(), user_id: user.id,
        event: trialEligible ? 'trial_started' : 'activated',
        plan, price_usd: cfg.price, trial_days: cfg.trial_days,
        created_at: now,
      }).catch(() => {})
      return withCORS(NextResponse.json({ ok: true, subscription }))
    }

    // -----------------------------------------------------------------------
    // Regional / PPP pricing detection — returns discount tier + adjusted prices
    // -----------------------------------------------------------------------
    if (route === '/pricing/region' && method === 'GET') {
      const { tierForCountry, detectCountryFromHeaders, applyRegionalDiscount, REGION_TIERS } = await import('@/lib/regional-pricing')
      const { SUBSCRIPTION_PLANS } = await import('@/lib/pricing-plans')
      const url = new URL(request.url)
      const override = String(url.searchParams.get('country') || '').toUpperCase().slice(0, 2)
      const headerCountry = detectCountryFromHeaders(request.headers)
      const detected = override || headerCountry || null
      const tier = tierForCountry(detected)
      const adjustedPlans = SUBSCRIPTION_PLANS.map(p => ({
        key: p.key,
        base_total: p.total_charge,
        base_monthly: p.display_price,
        adjusted_total: applyRegionalDiscount(p.total_charge, tier.key),
        adjusted_monthly: applyRegionalDiscount(p.display_price, tier.key),
      }))
      return withCORS(NextResponse.json({
        detected_country: detected,
        detected_from: override ? 'query' : (headerCountry ? 'header' : 'none'),
        tier: tier.key,
        discount_pct: Math.round(tier.discount * 100),
        label: tier.label,
        note: tier.note,
        plans: adjustedPlans,
      }))
    }

    if (route === '/subscription/status' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ subscription: null, active: false }))
      const sub = user.subscription || null
      // Trialing users get full access until trial_end, then active until expires_at.
      const isActive = sub && (sub.status === 'active' || sub.status === 'trialing') && (
        sub.plan === 'lifetime' || !sub.expires_at || new Date(sub.expires_at) > new Date()
      )
      return withCORS(NextResponse.json({ subscription: sub, active: !!isActive }))
    }

    // ============================================================================
    // Checkout — creates a hosted checkout URL for the given plan.
    // Supports two processors selectable via PAYMENT_PROCESSOR env
    // ('paddle' default, 'lemonsqueezy' fallback). Only active when
    // NEXT_PUBLIC_PAYMENT_MODE=live and required keys are set — otherwise the
    // FounderReservationModal preorder flow is used on the frontend.
    // ============================================================================
    if (route === '/checkout/create-session' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))

      const processor = (process.env.PAYMENT_PROCESSOR || 'paddle').toLowerCase()
      const body = await request.json().catch(() => ({}))
      const planKey = String(body.plan || '').toLowerCase()
      const customPriceCents = Number.isFinite(body.custom_price_cents)
        ? Math.max(100, Math.round(body.custom_price_cents))
        : null

      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')

      // -------- Paddle Billing (default) --------
      if (processor === 'paddle') {
        const PADDLE_KEY = process.env.PADDLE_API_KEY
        if (!PADDLE_KEY) {
          return withCORS(NextResponse.json({
            error: 'Payments not yet configured',
            detail: 'PADDLE_API_KEY not set. Site is still in preorder mode.',
          }, { status: 503 }))
        }
        const PRICES = {
          monthly:     process.env.PADDLE_PRICE_MONTHLY,
          annual:      process.env.PADDLE_PRICE_ANNUAL,
          lifetime:    process.env.PADDLE_PRICE_LIFETIME,
          // legacy — kept in case old checkout links exist
          quarterly:   process.env.PADDLE_PRICE_QUARTERLY,
          half_yearly: process.env.PADDLE_PRICE_HALF_YEARLY,
        }
        const priceId = PRICES[planKey]
        if (!priceId) return withCORS(NextResponse.json({ error: 'invalid plan' }, { status: 400 }))

        const paddleEnv = (process.env.PADDLE_ENV || 'production').toLowerCase()
        const paddleBase = paddleEnv === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com'

        // Build the transaction payload. We include custom_data so the webhook
        // can reconcile back to our user. When Paddle receives a transaction
        // without a customer_id it creates it as "draft" — the frontend then
        // needs Paddle.js to open the overlay. To keep things simple and get
        // a checkout URL right away, we set customer.email so Paddle creates
        // (or reuses) the customer inline.
        //
        // NOTE on checkout.url:
        //   Paddle requires the redirect domain to be approved on the account.
        //   In sandbox, no domain is auto-approved. So we ONLY include
        //   checkout.url when it's explicitly set via PADDLE_CHECKOUT_REDIRECT
        //   env — otherwise Paddle falls back to the Default Payment Link
        //   configured in Checkout Settings. Once you request approval for
        //   scholarshipfit.com (Checkout → Request website approval), set
        //   PADDLE_CHECKOUT_REDIRECT=https://scholarshipfit.com/dashboard?activated=1
        const redirectOverride = process.env.PADDLE_CHECKOUT_REDIRECT
        const payload = {
          items: [{ price_id: String(priceId), quantity: 1 }],
          customer: { email: user.email },
          custom_data: {
            user_id:  user.id,
            plan_key: planKey,
            base_price: String(body.base_price ?? ''),
            region_country: String(body.region_country || ''),
            discount_pct: String(body.discount_pct || 0),
          },
          ...(redirectOverride ? { checkout: { url: redirectOverride } } : {}),
        }
        // Regional PPP price override (Paddle allows unit_price override per item)
        if (customPriceCents) {
          payload.items[0].price_override = {
            unit_price: { amount: String(customPriceCents), currency_code: 'USD' },
          }
        }

        try {
          const pRes = await fetch(`${paddleBase}/transactions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PADDLE_KEY}`,
              'Content-Type':  'application/json',
              'Paddle-Version': '1',
            },
            body: JSON.stringify(payload),
          })
          const pJson = await pRes.json().catch(() => ({}))
          if (!pRes.ok) {
            return withCORS(NextResponse.json({
              error: 'Paddle checkout failed',
              status: pRes.status,
              detail: pJson?.error || pJson,
            }, { status: 502 }))
          }
          const url = pJson?.data?.checkout?.url
          if (!url) {
            return withCORS(NextResponse.json({ error: 'Paddle did not return a checkout URL', paddle: pJson }, { status: 502 }))
          }
          await db.collection('checkout_intents').insertOne({
            id: uuidv4(),
            user_id: user.id, user_email: user.email,
            processor: 'paddle',
            plan_key: planKey, price_id: String(priceId),
            custom_price_cents: customPriceCents,
            paddle_transaction_id: pJson.data.id,
            created_at: new Date(),
          }).catch(() => {})
          return withCORS(NextResponse.json({ ok: true, url, transaction_id: pJson.data.id, processor: 'paddle' }))
        } catch (e) {
          return withCORS(NextResponse.json({ error: 'Paddle request failed', detail: String(e?.message || e) }, { status: 502 }))
        }
      }

      // -------- LemonSqueezy (fallback) --------
      const LS_KEY   = process.env.LEMONSQUEEZY_API_KEY
      const LS_STORE = process.env.LEMONSQUEEZY_STORE_ID
      if (!LS_KEY || !LS_STORE) {
        return withCORS(NextResponse.json({
          error: 'Payments not yet configured',
          detail: 'LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID not set. Site is still in preorder mode.',
        }, { status: 503 }))
      }

      const VARIANTS = {
        monthly:     process.env.LS_VARIANT_MONTHLY,
        annual:      process.env.LS_VARIANT_ANNUAL,
        lifetime:    process.env.LS_VARIANT_LIFETIME,
        // legacy — kept for backward compat
        quarterly:   process.env.LS_VARIANT_QUARTERLY,
        half_yearly: process.env.LS_VARIANT_HALF_YEARLY,
      }
      const variantId = VARIANTS[planKey]
      if (!variantId) return withCORS(NextResponse.json({ error: 'invalid plan' }, { status: 400 }))

      const lsPayload = {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id, plan_key: planKey,
                base_price: String(body.base_price ?? ''),
                region_country: String(body.region_country || ''),
                discount_pct: String(body.discount_pct || ''),
              },
            },
            product_options: {
              redirect_url:  `${baseUrl}/dashboard?activated=1`,
              receipt_button_text: 'Go to my Command Center',
              receipt_thank_you_note: 'Thanks for joining ScholarshipFit — your Command Center is ready.',
            },
            checkout_options: { embed: false, media: false, logo: true, dark: true },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: String(LS_STORE) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }
      if (customPriceCents) lsPayload.data.attributes.custom_price = customPriceCents

      try {
        const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
          method: 'POST',
          headers: {
            'Accept':        'application/vnd.api+json',
            'Content-Type':  'application/vnd.api+json',
            'Authorization': `Bearer ${LS_KEY}`,
          },
          body: JSON.stringify(lsPayload),
        })
        const lsJson = await lsRes.json().catch(() => ({}))
        if (!lsRes.ok) {
          return withCORS(NextResponse.json({
            error: 'LemonSqueezy checkout failed', status: lsRes.status, detail: lsJson?.errors || lsJson,
          }, { status: 502 }))
        }
        const url = lsJson?.data?.attributes?.url
        if (!url) return withCORS(NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 }))
        await db.collection('checkout_intents').insertOne({
          id: uuidv4(),
          user_id: user.id, user_email: user.email,
          processor: 'lemonsqueezy',
          plan_key: planKey, variant_id: String(variantId),
          custom_price_cents: customPriceCents,
          ls_checkout_id: lsJson.data.id,
          created_at: new Date(),
        }).catch(() => {})
        return withCORS(NextResponse.json({ ok: true, url, checkout_id: lsJson.data.id, processor: 'lemonsqueezy' }))
      } catch (e) {
        return withCORS(NextResponse.json({ error: 'LemonSqueezy request failed', detail: String(e?.message || e) }, { status: 502 }))
      }
    }

    if (route === '/subscription/cancel' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      if (!user.subscription) return withCORS(NextResponse.json({ ok: true }))
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { 'subscription.status': 'cancelled', 'subscription.cancelled_at': new Date() } }
      )
      return withCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const cookieStore = await cookies()
      const token = cookieStore.get('sf_session')?.value
      if (token) await db.collection('sessions').deleteOne({ session_token: token }).catch(() => {})
      cookieStore.delete('sf_session')
      return withCORS(NextResponse.json({ ok: true }))
    }

    // ---- Cabinet APIs (per-user, requires auth) ----
    if (route === '/cabinet' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      return withCORS(NextResponse.json({ cabinet: user.cabinet || { favorites: [], recent_searches: [], profile: {} } }))
    }

    if (route === '/cabinet/favorite' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const { scholarship_id } = await request.json().catch(() => ({}))
      if (!scholarship_id) return withCORS(NextResponse.json({ error: 'scholarship_id required' }, { status: 400 }))
      const favs = (user.cabinet?.favorites || [])
      const idx = favs.indexOf(scholarship_id)
      const isAdding = idx === -1
      if (isAdding) favs.push(scholarship_id); else favs.splice(idx, 1)
      await db.collection('users').updateOne({ id: user.id }, { $set: { 'cabinet.favorites': favs, updated_at: new Date() } })

      // Mirror into saved_scholarships collection so the reminder cron has
      // rich per-save data (deadline_date, reminders_sent, etc.)
      const ssCol = db.collection('saved_scholarships')
      if (isAdding) {
        const sch = await db.collection('scholarships').findOne({ id: scholarship_id })
        if (sch) {
          await ssCol.updateOne(
            { user_id: user.id, scholarship_id },
            { $setOnInsert: {
                id: uuidv4(),
                user_id: user.id,
                scholarship_id,
                scholarship_slug: sch.slug || null,
                scholarship_name: sch.scholarship_name || 'Scholarship',
                scholarship_provider: sch.university_name || '',
                scholarship_url: sch.application_link || sch.source_url || '',
                deadline_date: null,
                reminders_enabled: true,
                reminders_sent: { '30': null, '14': null, '7': null, '1': null },
                created_at: new Date(),
              },
              $set: { updated_at: new Date() },
            },
            { upsert: true },
          )
        }
      } else {
        await ssCol.deleteOne({ user_id: user.id, scholarship_id })
      }
      return withCORS(NextResponse.json({ ok: true, favorites: favs, added: isAdding }))
    }

    // /cabinet/saves — list saved scholarships with full reminder data
    if (route === '/cabinet/saves' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const saves = await db.collection('saved_scholarships')
        .find({ user_id: user.id })
        .sort({ deadline_date: 1, created_at: -1 })
        .project({ _id: 0 })
        .toArray()
      return withCORS(NextResponse.json({ saves, reminders_pref: user.reminders_pref || 'on' }))
    }

    // /cabinet/set-deadline — user sets or updates the deadline for a saved scholarship
    if (route === '/cabinet/set-deadline' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const { scholarship_id, deadline_date } = await request.json().catch(() => ({}))
      if (!scholarship_id) return withCORS(NextResponse.json({ error: 'scholarship_id required' }, { status: 400 }))
      let parsedDate = null
      if (deadline_date) {
        const d = new Date(deadline_date)
        if (Number.isNaN(d.getTime())) return withCORS(NextResponse.json({ error: 'Invalid date' }, { status: 400 }))
        if (d.getTime() < Date.now()) return withCORS(NextResponse.json({ error: 'Deadline must be in the future' }, { status: 400 }))
        parsedDate = d
      }
      const res = await db.collection('saved_scholarships').updateOne(
        { user_id: user.id, scholarship_id },
        { $set: {
            deadline_date: parsedDate,
            // Reset any previously-sent reminders when the deadline changes
            reminders_sent: { '30': null, '14': null, '7': null, '1': null },
            updated_at: new Date(),
          } },
      )
      if (res.matchedCount === 0) return withCORS(NextResponse.json({ error: 'You have not saved this scholarship yet.' }, { status: 404 }))
      return withCORS(NextResponse.json({ ok: true, deadline_date: parsedDate }))
    }

    // /cabinet/toggle-reminders — per-save on/off toggle
    if (route === '/cabinet/toggle-reminders' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const { scholarship_id, enabled } = await request.json().catch(() => ({}))
      if (!scholarship_id) return withCORS(NextResponse.json({ error: 'scholarship_id required' }, { status: 400 }))
      await db.collection('saved_scholarships').updateOne(
        { user_id: user.id, scholarship_id },
        { $set: { reminders_enabled: !!enabled, updated_at: new Date() } },
      )
      return withCORS(NextResponse.json({ ok: true, reminders_enabled: !!enabled }))
    }

    // /user/reminders-pref — global on/off for the current user
    if (route === '/user/reminders-pref' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const { pref } = await request.json().catch(() => ({}))
      const clean = ['on', 'off'].includes(pref) ? pref : 'on'
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { reminders_pref: clean, updated_at: new Date() } },
      )
      return withCORS(NextResponse.json({ ok: true, reminders_pref: clean }))
    }

    // ============ Testimonials submission ============
    // Public endpoint — anyone can submit their success story. Goes into
    // a moderation queue; only manually-verified entries end up in the
    // /lib/testimonials.js source file (curated by the founder).
    if (route === '/testimonials/submit' && method === 'POST') {
      const b = await request.json().catch(() => ({}))
      const name  = String(b.name || '').trim().slice(0, 120)
      const email = String(b.email || '').trim().toLowerCase()
      const ln    = String(b.linkedin_url || '').trim()
      const quote = String(b.quote || '').trim().slice(0, 2000)
      const scholarship = String(b.scholarship || '').trim().slice(0, 200)

      if (!name || !email || !ln || !quote || !scholarship) {
        return withCORS(NextResponse.json({ error: 'name, email, linkedin_url, scholarship and quote are required' }, { status: 400 }))
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Invalid email' }, { status: 400 }))
      }
      if (!/^https?:\/\/(www\.)?linkedin\.com\//i.test(ln)) {
        return withCORS(NextResponse.json({ error: 'LinkedIn URL must be a linkedin.com profile' }, { status: 400 }))
      }

      // Basic rate-limit: max 3 submissions per email per 24h (prevents spam)
      const recent = await db.collection('testimonial_submissions').countDocuments({
        email,
        created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
      if (recent >= 3) {
        return withCORS(NextResponse.json({ error: 'Too many submissions — please try again tomorrow.' }, { status: 429 }))
      }

      await db.collection('testimonial_submissions').insertOne({
        id: uuidv4(),
        name, email, linkedin_url: ln,
        country:     String(b.country || '').trim().slice(0, 80),
        university:  String(b.university || '').trim().slice(0, 200),
        scholarship,
        year:        Number(b.year) || null,
        quote,
        permission_granted: b.permission === true,
        status: 'pending',
        submitted_from_ip: request.headers.get('x-forwarded-for') || null,
        created_at: new Date(),
      })

      captureServerEvent({
        distinctId: email,
        event: 'testimonial_submitted',
        properties: { scholarship, country: b.country || '' },
      }).catch(() => {})

      return withCORS(NextResponse.json({ ok: true, message: 'Submission received. We will verify and reach out.' }))
    }

    // Admin view of pending submissions
    if (route === '/admin/testimonials' && method === 'GET') {
      if (!adminOK()) return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const status = new URL(request.url).searchParams.get('status') || 'pending'
      const subs = await db.collection('testimonial_submissions')
        .find({ status })
        .sort({ created_at: -1 })
        .project({ _id: 0 })
        .limit(100)
        .toArray()
      return withCORS(NextResponse.json({ submissions: subs }))
    }

    // ============ Application Tracker (Kanban) ============
    const TRACKER_STATUSES = ['saved', 'preparing', 'submitted', 'waiting', 'result']

    // ============ Founder urgency (public, no auth) ============
    // Powers the countdown timer + spots-remaining bar on paywall/pricing.
    // Cached at Edge would be ideal, but 30s server memoization is enough.
    if (route === '/urgency' && method === 'GET') {
      let realCount = 0
      try {
        realCount = await db.collection('preorders').countDocuments({})
      } catch (_) { /* ignore */ }
      const schedule = campaignSchedule()
      const spots    = displaySpots(realCount)
      // Never expose real_count to clients (only inflation-safe display value)
      const { real_count: _rc, ...safeSpots } = spots
      return withCORS(NextResponse.json({
        countdown: {
          end_iso: schedule.end_iso,
          is_over: schedule.is_over,
          seconds_left: schedule.seconds_left,
          days: schedule.days, hours: schedule.hours, mins: schedule.mins, secs: schedule.secs,
        },
        spots: safeSpots,
        server_time: new Date().toISOString(),
      }))
    }

    if (route === '/applications' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const apps = await db.collection('applications')
        .find({ user_id: user.id })
        .sort({ status: 1, display_order: 1, created_at: -1 })
        .project({ _id: 0 })
        .toArray()
      return withCORS(NextResponse.json({ applications: apps }))
    }

    // Auto-import: create tracker rows for every saved scholarship that isn't
    // already in the tracker. Called once from the UI when the board is empty.
    if (route === '/applications/import-saves' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const saves = await db.collection('saved_scholarships').find({ user_id: user.id }).toArray()
      const existing = await db.collection('applications')
        .find({ user_id: user.id, scholarship_id: { $in: saves.map(s => s.scholarship_id) } })
        .project({ scholarship_id: 1 })
        .toArray()
      const existingSet = new Set(existing.map(e => e.scholarship_id))
      const toCreate = saves.filter(s => !existingSet.has(s.scholarship_id))
      const now = new Date()
      const docs = toCreate.map((s, idx) => ({
        id: uuidv4(),
        user_id: user.id,
        scholarship_id: s.scholarship_id,
        scholarship_slug: s.scholarship_slug || null,
        scholarship_name: s.scholarship_name || 'Untitled scholarship',
        scholarship_provider: s.scholarship_provider || '',
        scholarship_url: s.scholarship_url || '',
        deadline_date: s.deadline_date || null,
        status: 'saved',
        result: null,
        notes: '',
        submitted_date: null,
        result_date: null,
        display_order: idx,
        created_at: now,
        updated_at: now,
      }))
      if (docs.length) await db.collection('applications').insertMany(docs)
      return withCORS(NextResponse.json({ ok: true, imported: docs.length }))
    }

    if (route === '/applications/create' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const b = await request.json().catch(() => ({}))
      const status = TRACKER_STATUSES.includes(b.status) ? b.status : 'saved'
      const name   = String(b.scholarship_name || '').trim().slice(0, 300)
      if (!name) return withCORS(NextResponse.json({ error: 'scholarship_name required' }, { status: 400 }))

      // Compute display_order = max + 1 within the column
      const last = await db.collection('applications')
        .find({ user_id: user.id, status })
        .sort({ display_order: -1 })
        .limit(1).toArray()
      const nextOrder = (last[0]?.display_order || 0) + 1

      const doc = {
        id: uuidv4(),
        user_id: user.id,
        scholarship_id:       b.scholarship_id || null,
        scholarship_slug:     b.scholarship_slug || null,
        scholarship_name:     name,
        scholarship_provider: String(b.scholarship_provider || '').slice(0, 200),
        scholarship_url:      String(b.scholarship_url || '').slice(0, 500),
        deadline_date:        b.deadline_date ? new Date(b.deadline_date) : null,
        status,
        result:               null,
        notes:                String(b.notes || '').slice(0, 4000),
        submitted_date:       null,
        result_date:          null,
        display_order:        nextOrder,
        created_at:           new Date(),
        updated_at:           new Date(),
      }
      await db.collection('applications').insertOne(doc)
      const { _id, ...clean } = doc
      return withCORS(NextResponse.json({ ok: true, application: clean }))
    }

    if (route.startsWith('/applications/') && (method === 'PATCH' || method === 'PUT')) {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const id = route.split('/')[2]
      if (!id) return withCORS(NextResponse.json({ error: 'id required' }, { status: 400 }))
      const b = await request.json().catch(() => ({}))
      const update = { updated_at: new Date() }
      if (b.status !== undefined) {
        if (!TRACKER_STATUSES.includes(b.status)) return withCORS(NextResponse.json({ error: 'Invalid status' }, { status: 400 }))
        update.status = b.status
        // When moving to submitted, auto-stamp submitted_date if not set
        if (b.status === 'submitted') update.submitted_date = update.submitted_date || new Date()
        if (b.status === 'result')    update.result_date    = update.result_date || new Date()
      }
      if (b.result !== undefined) {
        const allowed = [null, 'accepted', 'rejected', 'waitlisted', 'withdrawn']
        if (!allowed.includes(b.result)) return withCORS(NextResponse.json({ error: 'Invalid result' }, { status: 400 }))
        update.result = b.result
      }
      if (b.notes !== undefined)          update.notes = String(b.notes).slice(0, 4000)
      if (b.deadline_date !== undefined)  update.deadline_date = b.deadline_date ? new Date(b.deadline_date) : null
      if (b.submitted_date !== undefined) update.submitted_date = b.submitted_date ? new Date(b.submitted_date) : null
      if (b.result_date !== undefined)    update.result_date = b.result_date ? new Date(b.result_date) : null
      if (b.display_order !== undefined)  update.display_order = Number(b.display_order) || 0

      const res = await db.collection('applications').updateOne(
        { id, user_id: user.id },
        { $set: update },
      )
      if (res.matchedCount === 0) return withCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const app = await db.collection('applications').findOne({ id, user_id: user.id }, { projection: { _id: 0 } })
      return withCORS(NextResponse.json({ ok: true, application: app }))
    }

    if (route.startsWith('/applications/') && method === 'DELETE') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const id = route.split('/')[2]
      if (!id) return withCORS(NextResponse.json({ error: 'id required' }, { status: 400 }))
      await db.collection('applications').deleteOne({ id, user_id: user.id })
      return withCORS(NextResponse.json({ ok: true }))
    }

    // /unsubscribe/:token — one-click unsubscribe from all deadline reminders
    if (route.startsWith('/unsubscribe/') && method === 'GET') {
      const token = route.split('/')[2] || ''
      const rec = await db.collection('unsubscribe_tokens').findOne({ token })
      if (!rec) {
        return new NextResponse(
          `<!doctype html><html><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;text-align:center;"><h2>Link invalid or expired</h2><p style="color:#888">If you'd like to turn off reminders, <a style="color:#D4AF37" href="/dashboard">sign in and use your settings</a>.</p></body></html>`,
          { status: 400, headers: { 'Content-Type': 'text/html' } },
        )
      }
      await db.collection('users').updateOne(
        { id: rec.user_id },
        { $set: { reminders_pref: 'off', updated_at: new Date() } },
      )
      return new NextResponse(
        `<!doctype html><html><body style="font-family:-apple-system,sans-serif;background:#0a0a0a;color:#fff;padding:60px 20px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#D4AF37;">ScholarshipFit<span style="color:#fff">.com</span></div>
          <h1 style="margin-top:24px;font-size:26px;">You're unsubscribed</h1>
          <p style="color:rgba(255,255,255,0.65);max-width:480px;margin:16px auto;line-height:1.5;">We won't send you any more deadline reminder emails. You can turn them back on any time from your <a style="color:#D4AF37" href="/dashboard">dashboard settings</a>.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } },
      )
    }

    if (route === '/cabinet/search' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const searches = [{ ...body, ts: Date.now() }, ...(user.cabinet?.recent_searches || []).filter(s => JSON.stringify({country:s.country,level:s.level,field:s.field}) !== JSON.stringify({country:body.country,level:body.level,field:body.field}))].slice(0, 8)
      await db.collection('users').updateOne({ id: user.id }, { $set: { 'cabinet.recent_searches': searches, updated_at: new Date() } })
      return withCORS(NextResponse.json({ ok: true, recent_searches: searches }))
    }

    if (route === '/cabinet/profile' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const merged = { ...(user.cabinet?.profile || {}), ...body }
      await db.collection('users').updateOne({ id: user.id }, { $set: { 'cabinet.profile': merged, updated_at: new Date() } })
      return withCORS(NextResponse.json({ ok: true, profile: merged }))
    }

    if (route === '/cabinet/documents' && method === 'POST') {
      // Save an already-extracted document (transcript or essay) to the user's cabinet.
      // Body: { type: 'transcript' | 'essay', filename, text, chars? }
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const type = String(body.type || '').toLowerCase()
      if (!['transcript', 'essay'].includes(type)) {
        return withCORS(NextResponse.json({ error: 'type must be "transcript" or "essay"' }, { status: 400 }))
      }
      const text = String(body.text || '').trim()
      if (text.length < 20) {
        return withCORS(NextResponse.json({ error: 'text is too short' }, { status: 400 }))
      }
      const CAP = 60000
      const truncated = text.length > CAP
      const finalText = truncated ? text.slice(0, CAP) : text
      const doc = {
        filename: String(body.filename || 'Uploaded document').slice(0, 200),
        text: finalText,
        chars: finalText.length,
        truncated,
        uploaded_at: new Date(),
      }
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { [`cabinet.documents.${type}`]: doc, updated_at: new Date() } },
      )
      return withCORS(NextResponse.json({ ok: true, type, document: doc }))
    }

    if (route === '/cabinet/documents' && method === 'DELETE') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const url = new URL(request.url)
      const type = String(url.searchParams.get('type') || '').toLowerCase()
      if (!['transcript', 'essay'].includes(type)) {
        return withCORS(NextResponse.json({ error: 'type query param must be "transcript" or "essay"' }, { status: 400 }))
      }
      await db.collection('users').updateOne(
        { id: user.id },
        { $unset: { [`cabinet.documents.${type}`]: '' }, $set: { updated_at: new Date() } },
      )
      return withCORS(NextResponse.json({ ok: true, type, removed: true }))
    }

    // ============ APPLICATION TRACKER ============
    // Kanban of a user's scholarship applications with status transitions.
    // Stored under users.cabinet.applications = [{ id, scholarship_id, ...meta, status, notes, timestamps }].
    const VALID_STATUSES = ['shortlisted', 'in_progress', 'submitted', 'won', 'rejected']

    if (route === '/cabinet/applications' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const apps = (user.cabinet?.applications || []).slice().sort(
        (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at),
      )
      return withCORS(NextResponse.json({ applications: apps }))
    }

    if (route === '/cabinet/applications' && method === 'POST') {
      // Create OR update — upsert by scholarship_id so "Track" from a scholarship
      // card is idempotent (won't create duplicates).
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const scholarshipId = String(body.scholarship_id || '').trim()
      if (!scholarshipId) return withCORS(NextResponse.json({ error: 'scholarship_id required' }, { status: 400 }))
      const status = String(body.status || 'shortlisted').toLowerCase()
      if (!VALID_STATUSES.includes(status)) {
        return withCORS(NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 }))
      }
      const now = new Date()
      const existing = (user.cabinet?.applications || []).find((a) => a.scholarship_id === scholarshipId)
      const app = {
        id: existing?.id || uuidv4(),
        scholarship_id: scholarshipId,
        scholarship_name: String(body.scholarship_name || existing?.scholarship_name || 'Scholarship'),
        university_name: String(body.university_name || existing?.university_name || ''),
        country: String(body.country || existing?.country || ''),
        source_url: String(body.source_url || existing?.source_url || ''),
        funding_summary: String(body.funding_summary || existing?.funding_summary || ''),
        deadline_note: String(body.deadline_note || existing?.deadline_note || ''),
        status,
        notes: typeof body.notes === 'string' ? body.notes : (existing?.notes || ''),
        submitted_at: body.submitted_at ? new Date(body.submitted_at) : existing?.submitted_at || (status === 'submitted' ? now : null),
        decision_at: body.decision_at ? new Date(body.decision_at) : existing?.decision_at || (['won', 'rejected'].includes(status) ? now : null),
        created_at: existing?.created_at || now,
        updated_at: now,
      }
      if (existing) {
        await db.collection('users').updateOne(
          { id: user.id, 'cabinet.applications.id': existing.id },
          { $set: { 'cabinet.applications.$': app, updated_at: now } },
        )
      } else {
        await db.collection('users').updateOne(
          { id: user.id },
          { $push: { 'cabinet.applications': app }, $set: { updated_at: now } },
        )
      }
      return withCORS(NextResponse.json({ ok: true, application: app, created: !existing }))
    }

    if (route === '/cabinet/applications' && method === 'DELETE') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const url = new URL(request.url)
      const id = String(url.searchParams.get('id') || '').trim()
      if (!id) return withCORS(NextResponse.json({ error: 'id query param required' }, { status: 400 }))
      await db.collection('users').updateOne(
        { id: user.id },
        { $pull: { 'cabinet.applications': { id } }, $set: { updated_at: new Date() } },
      )
      return withCORS(NextResponse.json({ ok: true, removed: true, id }))
    }

    if (route === '/cabinet/sync' && method === 'POST') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const cur = user.cabinet || { favorites: [], recent_searches: [], profile: {} }
      const mergedFavs = Array.from(new Set([...(cur.favorites || []), ...(body.favorites || [])]))
      const mergedSearches = [
        ...(body.recent_searches || []),
        ...(cur.recent_searches || [])
      ].slice(0, 8)
      const mergedProfile = { ...(cur.profile || {}), ...(body.profile || {}) }
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: {
          'cabinet.favorites': mergedFavs,
          'cabinet.recent_searches': mergedSearches,
          'cabinet.profile': mergedProfile,
          updated_at: new Date(),
        } },
      )
      return withCORS(NextResponse.json({ ok: true, cabinet: { favorites: mergedFavs, recent_searches: mergedSearches, profile: mergedProfile } }))
    }

    // ------- Waitlist -------
    if (route === '/waitlist' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Valid email required' }, { status: 400 }))
      }
      const doc = {
        id: uuidv4(),
        email,
        source: String(body.source || 'unknown').slice(0, 60),
        notes: String(body.notes || '').slice(0, 500),
        ip: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null,
        user_agent: (request.headers.get('user-agent') || '').slice(0, 200),
        created_at: new Date(),
      }
      // Idempotent: same email + source is a no-op (bump updated_at)
      await db.collection('waitlist').updateOne(
        { email, source: doc.source },
        { $setOnInsert: doc, $set: { updated_at: new Date() } },
        { upsert: true },
      )
      return withCORS(NextResponse.json({ ok: true, message: "You're on the list — we'll be in touch." }))
    }
    if (route === '/waitlist' && method === 'GET') {
      if (!adminOK()) return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const items = await db.collection('waitlist').find({}).sort({ created_at: -1 }).limit(500).toArray()
      return withCORS(NextResponse.json({ items: items.map(({ _id, ...i }) => i) }))
    }

    // ------- Contact -------
    if (route === '/contact' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const name    = String(body.name || '').trim().slice(0, 120)
      const email   = String(body.email || '').trim().toLowerCase()
      const subject = String(body.subject || '').trim().slice(0, 200)
      const message = String(body.message || '').trim().slice(0, 4000)
      if (!name || !email || !message) {
        return withCORS(NextResponse.json({ error: 'name, email and message are required' }, { status: 400 }))
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return withCORS(NextResponse.json({ error: 'Valid email required' }, { status: 400 }))
      }
      const doc = {
        id: uuidv4(),
        name, email, subject, message,
        status: 'new',
        ip: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null,
        user_agent: (request.headers.get('user-agent') || '').slice(0, 200),
        created_at: new Date(),
      }
      await db.collection('contacts').insertOne(doc)
      return withCORS(NextResponse.json({ ok: true, message: "Thanks — we'll get back to you within 24h." }))
    }
    if (route === '/contact' && method === 'GET') {
      if (!adminOK()) return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const items = await db.collection('contacts').find({}).sort({ created_at: -1 }).limit(500).toArray()
      return withCORS(NextResponse.json({ items: items.map(({ _id, ...i }) => i) }))
    }

    // ------- Admin -------
    if (route === '/admin/stats' && method === 'GET') {
      if (!adminOK()) return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const [s, p, m, a, w, c, cache, po] = await Promise.all([
        db.collection('scholarships').countDocuments({}),
        db.collection('profiles').countDocuments({}),
        db.collection('match_runs').countDocuments({}),
        db.collection('advisor_messages').countDocuments({}),
        db.collection('waitlist').countDocuments({}),
        db.collection('contacts').countDocuments({}),
        db.collection('match_cache').countDocuments({}),
        db.collection('preorders').countDocuments({}),
      ])
      // Scraper breakdown (per source + last run timestamp)
      const scraperBreakdown = await db.collection('scholarships').aggregate([
        { $group: { _id: '$scraper_source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray()
      const lastRun = await db.collection('scraper_runs').find({}).sort({ started_at: -1 }).limit(1).toArray()
      return withCORS(NextResponse.json({
        scholarships: s, profiles: p, match_runs: m, advisor_messages: a,
        waitlist: w, contacts: c, match_cache: cache, preorders: po,
        scholarship_sources: scraperBreakdown.map(x => ({ source: x._id || 'seed', count: x.count })),
        last_scrape: lastRun[0] ? {
          started_at: lastRun[0].started_at,
          duration_ms: lastRun[0].duration_ms,
          per_source: lastRun[0].per_source,
          total_after: lastRun[0].total_scholarships_after,
        } : null,
      }))
    }

    // Scraper run history (last 10 runs)
    if (route === '/admin/scraper-runs' && method === 'GET') {
      if (!adminOK()) return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const runs = await db.collection('scraper_runs').find({}).sort({ started_at: -1 }).limit(10).toArray()
      return withCORS(NextResponse.json({ runs: runs.map(({ _id, ...r }) => r) }))
    }

    if (route === '/admin/logs' && method === 'GET') {
      if (!adminOK()) return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const runs = await db.collection('match_runs').find({}).sort({ created_at: -1 }).limit(20).toArray()
      const msgs = await db.collection('advisor_messages').find({}).sort({ created_at: -1 }).limit(30).toArray()
      return withCORS(NextResponse.json({
        match_runs: runs.map(({ _id, ...r }) => r),
        advisor_messages: msgs.map(({ _id, ...m }) => m),
      }))
    }

    return withCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return withCORS(NextResponse.json({ error: 'Internal server error', detail: String(error?.message || error) }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
