// Shared scraper utilities.
//
// Every scraper module must export:
//   NAME:           string  (e.g. 'chevening')
//   SOURCE:         { name, url }
//   run(): Promise<NormalizedScholarship[]>
//
// The orchestrator (./index.js) upserts by dedup_key. Any record whose
// dedup_key already exists in Mongo has its `last_scraped_at` bumped and
// mutable fields refreshed — but its `id`, `slug` and `created_at` stay stable
// so bookmarks and analytics never break.
import crypto from 'crypto'
import * as cheerio from 'cheerio'

const USER_AGENT = 'ScholarshipFitBot/1.0 (+https://scholarshipfit.com; contact hello@scholarshipfit.com)'
export const FETCH_TIMEOUT_MS = 20000

/** Fetch a URL and return { ok, status, text, $ }.
 *  Never throws — returns { ok:false, error } on any failure so the scraper
 *  can gracefully fall back to its embedded catalog.
 */
export async function fetchHtml(url, opts = {}) {
  try {
    const ctrl = new AbortController()
    const timeoutId = setTimeout(() => ctrl.abort(), opts.timeout || FETCH_TIMEOUT_MS)
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(opts.headers || {}),
      },
      signal: ctrl.signal,
      redirect: 'follow',
    })
    clearTimeout(timeoutId)
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` }
    const text = await res.text()
    const $ = cheerio.load(text)
    return { ok: true, status: res.status, text, $ }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

/** Stable dedup key = SHA-1 of provider+title+source_url, lowercased+trimmed. */
export function dedupKey({ provider, title, source_url }) {
  const seed = `${String(provider || '').toLowerCase().trim()}||${String(title || '').toLowerCase().trim()}||${String(source_url || '').toLowerCase().trim()}`
  return crypto.createHash('sha1').update(seed).digest('hex').slice(0, 24)
}

/** Slugify to match existing scholarship schema. Ensures uniqueness of slug
 *  by appending a short hash suffix if the base slug is common (e.g. many
 *  Chevening entries).
 */
export function slugify(str, suffix) {
  const base = String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  if (!suffix) return base
  const suf = crypto.createHash('sha1').update(String(suffix)).digest('hex').slice(0, 6)
  return `${base}-${suf}`
}

/** Normalize a scraper output into a full scholarship document ready for
 *  upsert into the `scholarships` collection.
 *  Matches the shape used by /lib/seed-scholarships.js exactly.
 */
export function normalize(raw) {
  const source_url = raw.source_url || raw.application_link || ''
  const title      = raw.scholarship_name || raw.title || ''
  const provider   = raw.university_name || raw.provider || raw.source_name || ''
  return {
    slug: raw.slug || slugify(title, provider + source_url),
    dedup_key: dedupKey({ provider, title, source_url }),

    // Existing schema fields
    scholarship_name:        title,
    university_name:         provider,
    country:                 raw.country || null,
    city:                    raw.city || null,
    region:                  raw.region || null,
    degree_levels:           raw.degree_levels || [],
    eligible_nationalities:  raw.eligible_nationalities || [],
    major_fields:            raw.major_fields || raw.fields || [],
    funding_type:            raw.funding_type || 'Merit',
    funding_amount:          raw.funding_amount || 'Varies — check official source',
    funding_summary:         raw.funding_summary || raw.description || '',
    full_or_partial:         raw.full_or_partial || null,
    estimated_living_cost_usd: raw.estimated_living_cost_usd || null,
    min_gpa:                 raw.min_gpa || null,
    min_ielts:               raw.min_ielts || null,
    min_toefl:               raw.min_toefl || null,
    required_documents:      raw.required_documents || [],
    eligibility_summary:     raw.eligibility_summary || '',
    deadline_status:         raw.deadline_status || 'Annual cycle',
    deadline_note:           raw.deadline_note || 'Check official source for exact deadline',
    application_link:        raw.application_link || source_url,
    source_url,
    source_type:             raw.source_type || 'Official source',
    trust_level:             raw.trust_level || 'Source-linked',
    data_quality_score:      raw.data_quality_score || 82,

    // Provenance
    scraper_source: raw.scraper_source,        // e.g. 'chevening'
    scraper_source_name: raw.scraper_source_name, // e.g. 'Chevening Scholarships'
    last_scraped_at: new Date(),
  }
}

/** Small helper for scrapers that want to log with a consistent prefix. */
export function log(scraper, ...args) {
  console.log(`[scraper:${scraper}]`, ...args)
}
