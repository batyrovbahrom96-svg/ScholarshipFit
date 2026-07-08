import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { SEED_SCHOLARSHIPS } from '@/lib/seed-scholarships'

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
  try { return JSON.parse(str) } catch {}
  // Try to extract JSON block
  const m = str.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch {} }
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

      const now = new Date()
      await db.collection('advisor_messages').insertMany([
        { id: uuidv4(), session_id: sessionId, role: 'user', content: userMsg, created_at: now },
        { id: uuidv4(), session_id: sessionId, role: 'assistant', content: reply, created_at: new Date(now.getTime() + 1) },
      ])

      return withCORS(NextResponse.json({ session_id: sessionId, reply }))
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

    // ============ APPLICATION READINESS SCORE ============
    // The killer differentiator. Given a profile + scholarship, Claude rates
    // the applicant's competitiveness on a 0-100 scale and tells them exactly
    // what to strengthen. Cached in `readiness_cache` (7-day TTL).
    if (route === '/readiness' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const profile = body.profile
      const scholarshipId = body.scholarship_id
      const forceRefresh = !!body.force_refresh
      if (!profile || !scholarshipId) {
        return withCORS(NextResponse.json({ error: 'profile and scholarship_id required' }, { status: 400 }))
      }

      const sch = await db.collection('scholarships').findOne({ id: scholarshipId })
      if (!sch) return withCORS(NextResponse.json({ error: 'scholarship not found' }, { status: 404 }))

      // Cache key = profile fingerprint + scholarship id
      const keyFields = {
        nationality: profile.nationality,
        degree_level: profile.degree_level,
        intended_major: profile.intended_major,
        gpa: profile.gpa, gpa_scale: profile.gpa_scale,
        ielts: profile.ielts, toefl: profile.toefl,
        sat: profile.sat, act: profile.act, gre: profile.gre,
        achievements: profile.achievements || '',
        scholarship_id: scholarshipId,
      }
      const cacheKey = crypto.createHash('sha256').update(JSON.stringify(keyFields)).digest('hex')
      const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

      if (!forceRefresh) {
        const cached = await db.collection('readiness_cache').findOne({ cache_key: cacheKey })
        if (cached && (Date.now() - new Date(cached.created_at).getTime()) < CACHE_TTL_MS) {
          return withCORS(NextResponse.json({ readiness: cached.result, cached: true }))
        }
      }

      const system = `You are a scholarship admissions expert. Given a student profile and a single scholarship record, honestly assess the student's competitiveness on a 0-100 scale and provide a concrete, prioritized action plan. RULES:
- Use ONLY the provided profile data and scholarship record; do not invent facts.
- If a scholarship criterion isn't stated in the record, do not assume it — note it as "unclear from source".
- Be honest, even blunt. Do not inflate scores.
- Score buckets: 80-100 Strong · 60-79 Competitive · 40-59 Reach · 0-39 Long-shot
- Each gap must include impact_points (0-30) = how many points the score would rise if that gap were closed.
- Return STRICT JSON — no prose, no markdown fences.`

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

Respond with STRICT JSON in this schema:
{
  "score": 0-100 integer,
  "bucket": "Strong" | "Competitive" | "Reach" | "Long-shot",
  "headline": "one honest sentence explaining the score",
  "eligibility_status": "Eligible" | "Likely eligible" | "Ineligible" | "Unclear from source",
  "eligibility_reason": "short explanation",
  "strengths": [ { "label": "short", "detail": "sentence" } ],  // 2-4 items
  "gaps": [ { "label": "short", "detail": "sentence", "impact_points": 5-25 } ],  // 2-4 items, sorted highest impact first
  "actions": [ { "step": "concrete action", "impact_points": 5-25, "effort": "Low" | "Medium" | "High" } ],  // 3-5 items, sorted by ROI
  "waste_risk": "Low" | "Medium" | "High"  // effort-vs-fit — should they even bother?
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
      if (!['pro', 'elite'].includes(tier)) {
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

    // Get current session (from cookie)
    const getSessionUser = async () => {
      const cookieStore = await cookies()
      const token = cookieStore.get('sf_session')?.value
      if (!token) return null
      const s = await db.collection('sessions').findOne({ session_token: token })
      if (!s) return null
      const u = await db.collection('users').findOne({ id: s.user_id })
      if (!u) return null
      const { _id, ...clean } = u
      return clean
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = await getSessionUser()
      if (!user) return withCORS(NextResponse.json({ user: null }, { status: 200 }))
      return withCORS(NextResponse.json({ user }))
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
      if (idx === -1) favs.push(scholarship_id); else favs.splice(idx, 1)
      await db.collection('users').updateOne({ id: user.id }, { $set: { 'cabinet.favorites': favs, updated_at: new Date() } })
      return withCORS(NextResponse.json({ ok: true, favorites: favs, added: idx === -1 }))
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

    if (route === '/cabinet/sync' && method === 'POST') {
      // One-time migration of localStorage cabinet into DB after first sign-in
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
      return withCORS(NextResponse.json({ scholarships: s, profiles: p, match_runs: m, advisor_messages: a, waitlist: w, contacts: c, match_cache: cache, preorders: po }))
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
