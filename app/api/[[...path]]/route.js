import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { SEED_SCHOLARSHIPS } from '@/lib/seed-scholarships'

export const runtime = 'nodejs'
export const maxDuration = 120

// ---------- Mongo ----------
let client, db
async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'scholarshipfit')
  }
  return db
}

async function ensureSeed(db) {
  const col = db.collection('scholarships')
  const count = await col.countDocuments({})
  if (count === 0) {
    const docs = SEED_SCHOLARSHIPS.map(s => ({
      id: uuidv4(),
      public_status: 'public',
      verification_status: s.trust_level || 'Source-linked',
      last_checked: new Date(),
      created_at: new Date(),
      ...s,
    }))
    await col.insertMany(docs)
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

    // Health
    if ((route === '/' || route === '/root') && method === 'GET') {
      return withCORS(NextResponse.json({ ok: true, service: 'ScholarshipFit API' }))
    }

    // ------- Logo Proxy -------
    // Fetches real university logos server-side (browser CORS-safe) via Google's
    // favicon service which returns 256px PNGs for any domain.
    if (route === '/logo' && method === 'GET') {
      const url = new URL(request.url)
      const domain = url.searchParams.get('domain')
      if (!domain || !/^[a-z0-9.-]+$/i.test(domain)) {
        return withCORS(NextResponse.json({ error: 'bad domain' }, { status: 400 }))
      }
      const size = url.searchParams.get('sz') || '256'
      const src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
      try {
        const r = await fetch(src, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } })
        if (!r.ok) throw new Error(`upstream ${r.status}`)
        const buf = Buffer.from(await r.arrayBuffer())
        const res = new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': r.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        })
        return withCORS(res)
      } catch (e) {
        return withCORS(NextResponse.json({ error: 'fetch failed', detail: String(e.message) }, { status: 502 }))
      }
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
      if (!profile) {
        return withCORS(NextResponse.json({ error: 'profile required' }, { status: 400 }))
      }

      const scholarships = await db.collection('scholarships')
        .find({ public_status: { $ne: 'hidden' } })
        .limit(200).toArray()

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
        result: parsed,
      }
      await db.collection('match_runs').insertOne(run)
      const { _id, ...cleanRun } = run
      return withCORS(NextResponse.json({ run: cleanRun }))
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

    // ------- Admin -------
    if (route === '/admin/stats' && method === 'GET') {
      const [s, p, m, a] = await Promise.all([
        db.collection('scholarships').countDocuments({}),
        db.collection('profiles').countDocuments({}),
        db.collection('match_runs').countDocuments({}),
        db.collection('advisor_messages').countDocuments({}),
      ])
      return withCORS(NextResponse.json({ scholarships: s, profiles: p, match_runs: m, advisor_messages: a }))
    }

    if (route === '/admin/logs' && method === 'GET') {
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
