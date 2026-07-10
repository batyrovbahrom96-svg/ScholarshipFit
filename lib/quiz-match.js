// Deterministic quiz-match engine for ScholarshipFit.
//
// Given quiz answers + the full scholarship DB, this returns a ranked list of
// REAL matches with a transparent fit score, "why matched" reasons, and gaps.
// NO AI, NO HALLUCINATION — pure rule-based scoring over the actual DB records.
//
// The score is out of 100 and combines:
//   - Base score:               50
//   - Degree level match:       HARD FILTER (skip if mismatch)
//   - Nationality eligibility:  HARD FILTER + up to +10 for exact match
//   - Field of study:           +18 exact / +9 wildcard / -8 mismatch (kept)
//   - Preferred country:        +12 exact / +6 multi-country / 0 other
//   - GPA threshold:            +8 meets / 0 unknown / -4 below (kept as gap)
//   - English test threshold:   +8 meets / 0 unknown / -4 below (kept as gap)
//   - Funding preference:       +14 fully funded when user wants FF / +6 partial ok
//   - Data quality bonus:       up to +6 (proportional to data_quality_score)
//
// Anything <= 20 after adjustments is dropped. Final list is sorted descending.

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const norm = (s) => String(s || '').toLowerCase().trim()

// Rough grouping of countries into the "developing / OECD / Commonwealth / EU"
// buckets that scholarship eligibility copy uses.
const DEVELOPING_COUNTRIES = new Set([
  'india', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'bhutan', 'myanmar', 'cambodia',
  'laos', 'vietnam', 'philippines', 'indonesia', 'timor-leste',
  'kenya', 'uganda', 'tanzania', 'rwanda', 'ethiopia', 'nigeria', 'ghana', 'senegal',
  'south africa', 'zambia', 'zimbabwe', 'malawi', 'mozambique', 'cameroon', 'ivory coast',
  'egypt', 'morocco', 'tunisia', 'algeria', 'sudan', 'somalia',
  'brazil', 'colombia', 'peru', 'ecuador', 'bolivia', 'paraguay', 'venezuela', 'mexico',
  'guatemala', 'honduras', 'nicaragua', 'el salvador', 'dominican republic', 'haiti',
  'ukraine', 'moldova', 'georgia', 'armenia', 'kyrgyzstan', 'tajikistan', 'uzbekistan',
  'turkmenistan', 'azerbaijan', 'kazakhstan',
  'iran', 'iraq', 'afghanistan', 'syria', 'palestine', 'yemen', 'jordan', 'lebanon',
  'mongolia', 'papua new guinea', 'fiji', 'samoa',
])

const COMMONWEALTH = new Set([
  'india', 'pakistan', 'bangladesh', 'sri lanka', 'malaysia', 'singapore', 'brunei',
  'nigeria', 'ghana', 'kenya', 'uganda', 'tanzania', 'rwanda', 'south africa', 'namibia',
  'botswana', 'zambia', 'zimbabwe', 'malawi', 'lesotho', 'eswatini', 'mozambique', 'cameroon',
  'united kingdom', 'canada', 'australia', 'new zealand', 'ireland',
  'jamaica', 'bahamas', 'trinidad and tobago', 'barbados', 'belize', 'guyana',
  'fiji', 'samoa', 'tonga', 'vanuatu', 'papua new guinea', 'solomon islands',
  'cyprus', 'malta',
])

const EU_EEA = new Set([
  'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic', 'denmark',
  'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'ireland', 'italy',
  'latvia', 'lithuania', 'luxembourg', 'malta', 'netherlands', 'poland', 'portugal',
  'romania', 'slovakia', 'slovenia', 'spain', 'sweden',
  'iceland', 'liechtenstein', 'norway', 'switzerland',
])

const ASEAN = new Set([
  'brunei', 'cambodia', 'indonesia', 'laos', 'malaysia', 'myanmar',
  'philippines', 'singapore', 'thailand', 'vietnam',
])

const AFRICA = new Set([
  ...['algeria','angola','benin','botswana','burkina faso','burundi','cabo verde','cameroon','central african republic','chad','comoros','congo','democratic republic of the congo','djibouti','egypt','equatorial guinea','eritrea','eswatini','ethiopia','gabon','gambia','ghana','guinea','guinea-bissau','ivory coast','kenya','lesotho','liberia','libya','madagascar','malawi','mali','mauritania','mauritius','morocco','mozambique','namibia','niger','nigeria','rwanda','sao tome and principe','senegal','seychelles','sierra leone','somalia','south africa','south sudan','sudan','tanzania','togo','tunisia','uganda','zambia','zimbabwe'],
])

function normalizeCountry(c) {
  const n = norm(c)
  // Common aliases
  if (['usa', 'us', 'u.s.', 'u.s.a.', 'america'].includes(n)) return 'united states'
  if (['uk', 'britain', 'great britain', 'england'].includes(n)) return 'united kingdom'
  if (['türkiye', 'turkey'].includes(n)) return 'türkiye'
  if (n === 'south korea' || n === 'korea, south' || n === 'republic of korea') return 'south korea'
  if (n === 'czechia') return 'czech republic'
  return n
}

// -----------------------------------------------------------------------------
// Field-of-study synonyms / groupings
// -----------------------------------------------------------------------------
// Each quiz field option maps to a canonical set of keywords. A scholarship's
// major_fields is matched if any of its entries contains any keyword (case-
// insensitive substring).

const FIELD_MAP = {
  'engineering-cs': ['engineer', 'computer', 'informatic', 'software', 'ai', 'artificial intelligence', 'machine learning', 'data science', 'robot', 'mechatronic', 'electronic', 'electrical', 'civil', 'mechanical', 'aerospace', 'chemical eng', 'materials'],
  'natural-sciences': ['physics', 'chemistry', 'biology', 'life scien', 'natural scien', 'earth', 'geoscience', 'environment', 'astronomy', 'mathematic', 'statistic'],
  'medicine-health': ['medicine', 'medical', 'health', 'public health', 'nursing', 'pharma', 'dental', 'biomedic', 'clinical', 'neuroscience'],
  'business-economics': ['business', 'management', 'finance', 'economic', 'mba', 'accounting', 'marketing', 'entrepreneur'],
  'law-policy': ['law', 'legal', 'policy', 'public administr', 'international relations', 'political scien', 'governance', 'public affair', 'diplomac'],
  'humanities-arts': ['humanit', 'literature', 'history', 'philosoph', 'linguistic', 'language', 'art', 'design', 'music', 'architecture', 'film'],
  'social-sciences': ['social scien', 'sociology', 'anthropology', 'psychology', 'education', 'gender', 'development studies', 'peace', 'conflict'],
  'agriculture-env': ['agricult', 'food secur', 'forestry', 'veterinar', 'sustainab', 'climate', 'ecolog', 'water'],
  'all': [],
}

function fieldMatchScore(userField, majorFields = []) {
  if (!userField || userField === 'all') return { score: 9, wildcard: true }
  const keywords = FIELD_MAP[userField] || []
  const majors = majorFields.map(norm)
  const isWildcard = majors.some(m => m.includes('all disciplines') || m.includes('all fields') || m.includes('any field'))
  if (isWildcard) return { score: 9, wildcard: true }
  const hit = majors.some(m => keywords.some(k => m.includes(k)))
  if (hit) return { score: 18, wildcard: false }
  return { score: -8, wildcard: false }
}

// -----------------------------------------------------------------------------
// Nationality eligibility (soft-and-hard combined)
// -----------------------------------------------------------------------------
// Returns { eligible: bool, bonus: 0..10, reason: string }

function nationalityEligibility(userCountry, eligibleNats = []) {
  const uc = normalizeCountry(userCountry)
  if (!uc) return { eligible: true, bonus: 0, reason: 'Nationality unknown; assumed eligible' }
  const nats = eligibleNats.map(norm).join(' | ')

  // Wildcard-open scholarships
  if (/international|global|any nationality|all nationalities|world|multiple/i.test(nats)) {
    return { eligible: true, bonus: 6, reason: 'Open to international applicants' }
  }

  // Explicit country name in the list → best match
  if (nats.includes(uc)) {
    return { eligible: true, bonus: 10, reason: `Explicitly lists ${userCountry}` }
  }

  // Group memberships
  if (/developing|dac|low-income|middle-income|lmic|transition country/i.test(nats)) {
    if (DEVELOPING_COUNTRIES.has(uc)) {
      return { eligible: true, bonus: 8, reason: 'Eligible as developing / LMIC country citizen' }
    }
    return { eligible: false, bonus: 0, reason: 'Restricted to developing / LMIC countries' }
  }
  if (/commonwealth/i.test(nats)) {
    if (COMMONWEALTH.has(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as Commonwealth citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to Commonwealth citizens' }
  }
  if (/eu\/eea|eu\b|european union|eea|schengen/i.test(nats) && !/non-eu/i.test(nats)) {
    if (EU_EEA.has(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as EU/EEA citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to EU/EEA citizens' }
  }
  if (/non-eu|non-eea/i.test(nats)) {
    if (!EU_EEA.has(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as non-EU/EEA citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to non-EU/EEA citizens' }
  }
  if (/asean/i.test(nats)) {
    if (ASEAN.has(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as ASEAN citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to ASEAN citizens' }
  }
  if (/african|africa/i.test(nats)) {
    if (AFRICA.has(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as African citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to African citizens' }
  }
  if (/muslim|islamic/i.test(nats)) {
    // Can't verify religion — pass-through with a soft note
    return { eligible: true, bonus: 0, reason: 'Requires Muslim community membership (self-declared)' }
  }
  if (/refugee|displaced|stateless/i.test(nats)) {
    return { eligible: true, bonus: 0, reason: 'Requires refugee / displaced / stateless status' }
  }
  if (/ibero-american|ibero american|latin america/i.test(nats)) {
    const latam = ['argentina','bolivia','brazil','chile','colombia','ecuador','paraguay','peru','uruguay','venezuela','mexico','cuba','dominican republic','guatemala','honduras','nicaragua','el salvador','panama','costa rica','spain','portugal']
    if (latam.includes(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as Ibero-American citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to Ibero-American countries' }
  }

  // Country-scoped programs (e.g. "Chile", "India (women)", "Nigerian citizens")
  // If our user's country appears anywhere in the eligible list, allow.
  if (nats.includes(uc)) return { eligible: true, bonus: 10, reason: `Restricted to ${userCountry} nationals` }

  // MENA
  if (/mena|middle east|north africa/i.test(nats)) {
    const mena = ['algeria','egypt','iraq','jordan','kuwait','lebanon','libya','morocco','palestine','qatar','saudi arabia','syria','tunisia','united arab emirates','yemen','oman','bahrain','iran','israel']
    if (mena.includes(uc)) return { eligible: true, bonus: 8, reason: 'Eligible as MENA citizen' }
    return { eligible: false, bonus: 0, reason: 'Restricted to MENA citizens' }
  }

  // Fallback: if the eligibility text does NOT explicitly list user's country
  // and none of the group rules match, treat as ineligible.
  return { eligible: false, bonus: 0, reason: `Not open to ${userCountry} nationals` }
}

// -----------------------------------------------------------------------------
// Degree level match (STRICT filter)
// -----------------------------------------------------------------------------
// User picks from: 'high_school' | 'bachelor' | 'master' | 'phd' | 'postdoc' | 'mba' | 'other'

function degreeLevelMatch(userLevel, degreeLevels = []) {
  const dl = degreeLevels.map(norm)
  if (dl.length === 0) return false
  if (dl.some(l => l.includes('all levels'))) return true
  switch (userLevel) {
    case 'high_school':
      // High-school → looking for Bachelor programs & pre-uni bridges
      return dl.some(l => l.includes('bachelor') || l.includes('undergrad') || l.includes('pre-') || l.includes('foundation'))
    case 'bachelor':
      return dl.some(l => l.includes('bachelor') || l.includes('undergrad'))
    case 'master':
      return dl.some(l => l.includes('master') || l.includes('msc') || l.includes('ma ') || l.includes('graduate certificate') || l.includes('postgraduate') || l.includes('graduate diploma'))
    case 'phd':
      return dl.some(l => l.includes('phd') || l.includes('doctor') || l.includes('research'))
    case 'postdoc':
      return dl.some(l => l.includes('postdoc') || l.includes('fellowship') || l.includes('research'))
    case 'mba':
      return dl.some(l => l.includes('mba') || l.includes('master'))
    case 'other':
      return dl.some(l => l.includes('short') || l.includes('certificate') || l.includes('training') || l.includes('non-degree') || l.includes('exchange'))
    default:
      return true
  }
}

// -----------------------------------------------------------------------------
// Country-of-study preference
// -----------------------------------------------------------------------------

function preferredCountryScore(preferredCountries, scholarshipCountry) {
  const sc = normalizeCountry(scholarshipCountry)
  const prefs = (preferredCountries || []).map(normalizeCountry)
  if (prefs.length === 0 || prefs.includes('any')) return { score: 0, reason: null }
  if (sc === 'multiple' || sc.includes('multiple')) return { score: 6, reason: 'Multi-country programme' }
  if (prefs.includes(sc)) return { score: 12, reason: `Located in preferred country: ${scholarshipCountry}` }
  return { score: -3, reason: null }
}

// -----------------------------------------------------------------------------
// GPA + English-test thresholds
// -----------------------------------------------------------------------------

function gpaScore(userGpa, minGpa) {
  if (userGpa == null || userGpa === '') return { score: 0, gap: null }
  const u = Number(userGpa)
  if (Number.isNaN(u)) return { score: 0, gap: null }
  if (minGpa == null) return { score: 4, gap: null } // no threshold known → small bonus
  if (u >= minGpa) return { score: 8, gap: null }
  return { score: -4, gap: `Below listed GPA threshold (min ${minGpa}, yours ${u})` }
}

function englishScore(user, min, kind = 'IELTS') {
  if (user == null || user === '') return { score: 0, gap: null }
  const u = Number(user)
  if (Number.isNaN(u)) return { score: 0, gap: null }
  if (min == null) return { score: 4, gap: null }
  if (u >= min) return { score: 8, gap: null }
  return { score: -4, gap: `Below listed ${kind} threshold (min ${min}, yours ${u})` }
}

// -----------------------------------------------------------------------------
// Funding preference
// -----------------------------------------------------------------------------

function fundingScore(pref, ft = '', summary = '') {
  const ftn = norm(ft)
  const isFull = /fully? funded|full funding|full tuition|full scholarship/i.test(ft + ' ' + summary) || ftn === 'fully funded'
  if (pref === 'full_only') {
    if (isFull) return { score: 14, reason: 'Fully funded scholarship (matches your preference)' }
    return { score: -8, reason: null, hardDrop: false }
  }
  if (pref === 'partial_ok') {
    if (isFull) return { score: 10, reason: 'Fully funded scholarship' }
    return { score: 6, reason: 'Partial funding acceptable per your preference' }
  }
  // 'any'
  if (isFull) return { score: 6, reason: 'Fully funded' }
  return { score: 0, reason: null }
}

// -----------------------------------------------------------------------------
// Main matcher
// -----------------------------------------------------------------------------

export function matchScholarships(answers, scholarships) {
  const {
    education_level, field, nationality, preferred_countries = [],
    gpa, gpa_scale, ielts, toefl, funding_pref,
  } = answers

  // Normalise GPA to 4.0 scale if user gave 10.0 or 100
  let normGpa = gpa == null || gpa === '' ? null : Number(gpa)
  if (normGpa != null && !Number.isNaN(normGpa)) {
    if (gpa_scale === '10' || normGpa > 4.5 && normGpa <= 10) normGpa = (normGpa / 10) * 4
    else if (gpa_scale === '100' || normGpa > 10) normGpa = (normGpa / 100) * 4
  }

  const results = []

  for (const s of scholarships) {
    if (s.public_status === 'hidden') continue

    // ------ Hard filters ------
    if (education_level && !degreeLevelMatch(education_level, s.degree_levels)) continue
    const natCheck = nationalityEligibility(nationality, s.eligible_nationalities)
    if (!natCheck.eligible) continue

    // ------ Score components ------
    let score = 50
    const reasons = []
    const gaps = []

    // Field
    const fs = fieldMatchScore(field, s.major_fields)
    score += fs.score
    if (fs.score > 0 && !fs.wildcard) reasons.push(`Field matches: ${(s.major_fields || [])[0] || 'your area'}`)
    else if (fs.wildcard) reasons.push('Accepts all disciplines')
    else gaps.push('Field of study is not the scholarship\u2019s primary focus')

    // Nationality
    score += natCheck.bonus
    reasons.push(natCheck.reason)

    // Country preference
    const cp = preferredCountryScore(preferred_countries, s.country)
    score += cp.score
    if (cp.reason) reasons.push(cp.reason)

    // GPA
    const gs = gpaScore(normGpa, s.min_gpa)
    score += gs.score
    if (gs.gap) gaps.push(gs.gap)
    else if (gs.score > 0 && s.min_gpa != null) reasons.push(`GPA \u2265 ${s.min_gpa} requirement met`)

    // English
    const es = englishScore(ielts, s.min_ielts, 'IELTS')
    score += es.score
    if (es.gap) gaps.push(es.gap)
    else if (es.score > 0 && s.min_ielts != null) reasons.push(`IELTS \u2265 ${s.min_ielts} requirement met`)

    const ts = englishScore(toefl, s.min_toefl, 'TOEFL')
    score += ts.score
    if (ts.gap) gaps.push(ts.gap)
    else if (ts.score > 0 && s.min_toefl != null) reasons.push(`TOEFL \u2265 ${s.min_toefl} requirement met`)

    // Funding
    const fun = fundingScore(funding_pref, s.funding_type, s.funding_summary)
    score += fun.score
    if (fun.reason) reasons.push(fun.reason)

    // Data quality bonus (max +6)
    const dq = Number(s.data_quality_score || 0)
    if (dq > 0) score += Math.min(6, Math.round(dq / 20))

    // Clamp
    score = Math.max(0, Math.min(100, score))

    // Drop if too low or missing required data
    if (score < 25) continue

    results.push({
      scholarship_id: s.id,
      slug: s.slug,
      scholarship_name: s.scholarship_name,
      university_name: s.university_name,
      country: s.country,
      source_url: s.source_url,
      application_link: s.application_link || s.source_url,
      funding_amount: s.funding_amount,
      funding_type: s.funding_type,
      degree_levels: s.degree_levels,
      major_fields: s.major_fields,
      deadline_status: s.deadline_status,
      deadline_note: s.deadline_note,
      trust_level: s.trust_level,
      data_quality_score: s.data_quality_score,
      overall_fit_score: score,
      reasons: reasons.filter(Boolean).slice(0, 5),
      gaps,
    })
  }

  results.sort((a, b) => b.overall_fit_score - a.overall_fit_score)
  return results
}
