// The 50 canonical SEO landing-page slugs, organized by search intent.
// Each entry drives a page rendered by /app/scholarships/[slug]/page.js.
//
// Categories:
//   - nationality   "For [X] Students"     high-intent, geography-locked
//   - destination   "In [Country]"         destination-market intent
//   - degree        "For [Degree] Studies" degree-level intent
//   - field         "In [Field]"           subject/field intent
//
// The `filter` function is applied against the scholarships collection
// to build the on-page list. Filters are permissive (case-insensitive
// substring match) so we surface as many relevant records as possible.
//
// Kept in a single file so it's trivial to reorder, add, or A/B-test slugs.

const contains = (arr, needle) => {
  if (!Array.isArray(arr)) return false
  const n = String(needle).toLowerCase()
  return arr.some((x) => String(x || '').toLowerCase().includes(n))
}
const textIncludes = (str, needle) => String(str || '').toLowerCase().includes(String(needle).toLowerCase())

export const SEO_LANDING_PAGES = [
  /* ==================== NATIONALITY (20) ==================== */
  ...[
    { name: 'Nigerian',      code: 'nigerian',      country: 'Nigeria' },
    { name: 'Indian',        code: 'indian',        country: 'India' },
    { name: 'Pakistani',     code: 'pakistani',     country: 'Pakistan' },
    { name: 'Kenyan',        code: 'kenyan',        country: 'Kenya' },
    { name: 'Bangladeshi',   code: 'bangladeshi',   country: 'Bangladesh' },
    { name: 'Egyptian',      code: 'egyptian',      country: 'Egypt' },
    { name: 'Ghanaian',      code: 'ghanaian',      country: 'Ghana' },
    { name: 'South African', code: 'south-african', country: 'South Africa' },
    { name: 'Vietnamese',    code: 'vietnamese',    country: 'Vietnam' },
    { name: 'Filipino',      code: 'filipino',      country: 'Philippines' },
    { name: 'Chinese',       code: 'chinese',       country: 'China' },
    { name: 'Turkish',       code: 'turkish',       country: 'Turkey' },
    { name: 'Mexican',       code: 'mexican',       country: 'Mexico' },
    { name: 'Brazilian',     code: 'brazilian',     country: 'Brazil' },
    { name: 'Colombian',     code: 'colombian',     country: 'Colombia' },
    { name: 'Moroccan',      code: 'moroccan',      country: 'Morocco' },
    { name: 'Ethiopian',     code: 'ethiopian',     country: 'Ethiopia' },
    { name: 'Tanzanian',     code: 'tanzanian',     country: 'Tanzania' },
    { name: 'Ugandan',       code: 'ugandan',       country: 'Uganda' },
    { name: 'Cameroonian',   code: 'cameroonian',   country: 'Cameroon' },
  ].map((n) => ({
    slug:     `for-${n.code}-students`,
    category: 'nationality',
    h1:       `Scholarships for ${n.name} Students (Fully & Partially Funded)`,
    intent:   `Handpicked scholarships open to ${n.name} nationals — sorted by fit, funding, and deadline.`,
    metaTitle: `Scholarships for ${n.name} Students 2026 · ScholarshipFit`,
    metaDescription: `${'The most complete list of fully-funded and partially-funded scholarships open to '}${n.name} students in 2026. Verified sources, deadlines, and eligibility for every listing.`,
    intro: (
      `If you're a ${n.name} student looking to study abroad in 2026, you have more options than you probably realize. `
      + `Below are the source-linked scholarships open to ${n.country} nationals — filtered from our database of 800+ verified programs and ranked so the most competitive, best-funded options appear first. `
      + `Every entry links back to the official provider page — no aggregator middlemen, no dead links.`
    ),
    filter: (s) => contains(s.eligible_nationalities, n.name)
                || contains(s.eligible_nationalities, n.country)
                || contains(s.eligible_nationalities, 'International')
                || contains(s.eligible_nationalities, 'Developing countries')
                || contains(s.eligible_nationalities, 'DAC list'),
    country: n.country,
    seoKeywords: [`scholarships for ${n.name} students`, `${n.country} scholarships 2026`, `fully funded scholarships ${n.country}`],
  })),

  /* ==================== DESTINATION COUNTRY (12) ==================== */
  ...[
    { name: 'the UK',          slug: 'in-uk',          country: 'United Kingdom' },
    { name: 'Germany',         slug: 'in-germany',     country: 'Germany' },
    { name: 'the USA',         slug: 'in-usa',         country: 'United States' },
    { name: 'Canada',          slug: 'in-canada',      country: 'Canada' },
    { name: 'Australia',       slug: 'in-australia',   country: 'Australia' },
    { name: 'France',          slug: 'in-france',      country: 'France' },
    { name: 'the Netherlands', slug: 'in-netherlands', country: 'Netherlands' },
    { name: 'Japan',           slug: 'in-japan',       country: 'Japan' },
    { name: 'Sweden',          slug: 'in-sweden',      country: 'Sweden' },
    { name: 'Italy',           slug: 'in-italy',       country: 'Italy' },
    { name: 'Spain',           slug: 'in-spain',       country: 'Spain' },
    { name: 'Switzerland',     slug: 'in-switzerland', country: 'Switzerland' },
  ].map((d) => ({
    slug:     d.slug,
    category: 'destination',
    h1:       `Scholarships to Study in ${d.name}`,
    intent:   `Every source-linked scholarship funding studies in ${d.country} — fully funded, partial, government-backed, and university-run.`,
    metaTitle: `Scholarships to Study in ${d.name} 2026 · ScholarshipFit`,
    metaDescription: `Fully-funded and partially-funded scholarships available to study in ${d.country} in 2026. Government, university, and foundation programs — all verified and source-linked.`,
    intro: (
      `${d.country} attracts hundreds of thousands of international students each year — but tuition and living costs make funding essential. `
      + `Below are the current scholarships that will pay you to study in ${d.country}, ranging from government-backed fully-funded awards (Chevening for UK, DAAD for Germany, Fulbright for USA, etc.) to university-specific bursaries. `
      + `Ranked so the most-funded, highest-prestige options appear first.`
    ),
    filter: (s) => textIncludes(s.country, d.country)
                || textIncludes(s.country, d.name.replace(/^the\s+/i, ''))
                || textIncludes(s.university_name, d.country),
    country: d.country,
    seoKeywords: [`scholarships in ${d.country}`, `study in ${d.country} 2026`, `fully funded scholarships ${d.country}`],
  })),

  /* ==================== DEGREE (6) ==================== */
  ...[
    { name: "Master's degree",       slug: 'masters',       match: ["Master", "MSc", "MA"] },
    { name: 'PhD',                    slug: 'phd',           match: ["PhD", "Doctoral", "Doctorate"] },
    { name: 'undergraduate',          slug: 'undergraduate', match: ["Bachelor", "Undergraduate"] },
    { name: 'MBA',                    slug: 'mba',           match: ["MBA", "Business Administration"] },
    { name: 'postdoctoral research',  slug: 'postdoc',       match: ["Postdoc", "Postdoctoral", "Research fellow"] },
    { name: 'fully-funded',           slug: 'fully-funded',  match: ["Fully funded", "Full tuition", "Full scholarship"] },
  ].map((d) => ({
    slug:     d.slug,
    category: 'degree',
    h1:       `${d.name.charAt(0).toUpperCase() + d.name.slice(1)} Scholarships (2026)`,
    intent:   `Curated ${d.name} scholarships from our verified database — ranked by fit and funding.`,
    metaTitle: `${d.name.charAt(0).toUpperCase() + d.name.slice(1)} Scholarships 2026 · ScholarshipFit`,
    metaDescription: `The best ${d.name} scholarships available in 2026 for international students. Fully funded and partial awards, all with verified sources.`,
    intro: (
      `Finding the right ${d.name} scholarship is often the deciding factor between studying abroad and putting the dream on hold. `
      + `This page lists every ${d.name} scholarship in our database — from government-backed fully-funded programs to university merit awards. `
      + `Ranked so the most-generous, most-prestigious options are at the top.`
    ),
    filter: (s) => d.match.some((m) => contains(s.degree_levels, m) || textIncludes(s.scholarship_name, m) || textIncludes(s.funding_type, m) || textIncludes(s.full_or_partial, m)),
    country: null,
    seoKeywords: [`${d.name} scholarships`, `${d.name} scholarships 2026`, `fully funded ${d.name}`],
  })),

  /* ==================== FIELD (12) ==================== */
  ...[
    { name: 'engineering',       slug: 'engineering',      match: ['Engineering'] },
    { name: 'computer science',  slug: 'computer-science', match: ['Computer Science', 'Computing', 'Software'] },
    { name: 'medicine',          slug: 'medicine',         match: ['Medicine', 'Medical'] },
    { name: 'business',          slug: 'business',         match: ['Business', 'Management', 'MBA'] },
    { name: 'law',               slug: 'law',              match: ['Law', 'Legal'] },
    { name: 'arts & humanities', slug: 'arts-humanities',  match: ['Art', 'Humanities', 'Music', 'Fine Art', 'Design', 'Film'] },
    { name: 'natural sciences',  slug: 'natural-sciences', match: ['Physics', 'Chemistry', 'Biology', 'Sciences'] },
    { name: 'social sciences',   slug: 'social-sciences',  match: ['Social Science', 'Sociology', 'Political', 'Anthropology'] },
    { name: 'economics',         slug: 'economics',        match: ['Economics'] },
    { name: 'public health',     slug: 'public-health',    match: ['Public Health', 'Health'] },
    { name: 'education',         slug: 'education',        match: ['Education', 'Pedagogy'] },
    { name: 'agriculture',       slug: 'agriculture',      match: ['Agriculture', 'Agricultural'] },
  ].map((f) => ({
    slug:     f.slug,
    category: 'field',
    h1:       `Scholarships for ${f.name.charAt(0).toUpperCase() + f.name.slice(1)} Students`,
    intent:   `Every scholarship in our database open to ${f.name} students — from undergraduate to PhD.`,
    metaTitle: `${f.name.charAt(0).toUpperCase() + f.name.slice(1)} Scholarships 2026 · ScholarshipFit`,
    metaDescription: `Fully-funded and partial scholarships for ${f.name} students in 2026. Verified sources, real deadlines, ranked by fit.`,
    intro: (
      `If you're studying ${f.name}, you're in one of the best-funded fields globally. `
      + `Below are the current scholarships in our database that accept ${f.name} students, ranked so the most-generous options appear first. `
      + `Every listing links back to the official provider page.`
    ),
    filter: (s) => f.match.some((m) => contains(s.major_fields, m) || textIncludes(s.scholarship_name, m)),
    country: null,
    seoKeywords: [`${f.name} scholarships`, `${f.name} scholarships 2026`, `international scholarships ${f.name}`],
  })),
]

/** Look up a landing page config by slug. */
export function getLandingPage(slug) {
  return SEO_LANDING_PAGES.find((p) => p.slug === slug)
}

/** Related pages within the same category (excluding self) — for footer/CTA. */
export function getRelatedPages(slug, limit = 6) {
  const self = getLandingPage(slug)
  if (!self) return []
  return SEO_LANDING_PAGES.filter((p) => p.category === self.category && p.slug !== slug).slice(0, limit)
}

/** All slugs — used by generateStaticParams. */
export function allSlugs() {
  return SEO_LANDING_PAGES.map((p) => p.slug)
}
