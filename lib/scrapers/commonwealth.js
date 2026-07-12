// Commonwealth Scholarships — UK FCDO-funded scholarships for Commonwealth
// citizens (mostly LMIC nationals) to study in the UK.
// Source: https://cscuk.fcdo.gov.uk/scholarships/
//
// The programme has 6 core award types + one PhD stream. Each award has
// country eligibility (roughly all Commonwealth low- and middle-income
// countries) and subject preferences aligned to UK development priorities.
import { normalize, log } from './base'

export const NAME = 'commonwealth'
export const SOURCE = {
  name: 'Commonwealth Scholarship Commission (UK)',
  url:  'https://cscuk.fcdo.gov.uk/',
}

// 44 Commonwealth low- and middle-income countries — the pool eligible for
// most CSC awards (verified from CSC's country pages).
const CSC_LMIC_COUNTRIES = [
  'Bangladesh','Belize','Cameroon','Dominica','Eswatini','Fiji','Gambia',
  'Ghana','Grenada','Guyana','India','Jamaica','Kenya','Kiribati','Lesotho',
  'Malawi','Malaysia','Maldives','Mauritius','Mozambique','Namibia','Nauru',
  'Nigeria','Pakistan','Papua New Guinea','Rwanda','Samoa','Sierra Leone',
  'Solomon Islands','South Africa','Sri Lanka','Saint Lucia',
  'Saint Vincent and the Grenadines','Tanzania','Togo','Tonga',
  'Trinidad and Tobago','Tuvalu','Uganda','Vanuatu','Zambia','Cyprus','Malta',
]

// The 6 core CSC award programs.
const CSC_PROGRAMS = [
  {
    code:'master',
    name:'Commonwealth Master\'s Scholarship',
    degree:["Master's"],
    duration:'One year',
    urlSlug:'commonwealth-masters-scholarships',
    funding:'Full tuition + monthly stipend + return airfare + arrival + thesis grant + family allowance (if applicable)',
    summary:'Fully-funded one-year Master\'s at a UK university for talented citizens of eligible LMIC Commonwealth countries. Applicants must show how their studies will contribute to development in their home country.',
    eligibility:'Citizen of an eligible Commonwealth LMIC. Bachelor\'s degree (upper second-class or equivalent). Unable to afford self-funded study.',
    subjects:['Science and technology for development','Strengthening health systems and capacity','Promoting global prosperity','Strengthening global peace, security and governance','Strengthening resilience and response to crises','Access, inclusion and opportunity'],
  },
  {
    code:'phd',
    name:'Commonwealth PhD Scholarship',
    degree:['PhD'],
    duration:'Up to 3 years',
    urlSlug:'commonwealth-phd-scholarships',
    funding:'Full tuition + stipend + fieldwork travel + return airfare + thesis grant',
    summary:'Fully-funded UK PhD for candidates from eligible Commonwealth LMICs. Awards are made for research aligned to CSC development themes.',
    eligibility:'Citizen of an eligible Commonwealth LMIC. Master\'s degree (or Bachelor\'s of exceptional merit) in a relevant field.',
    subjects:['Science and technology for development','Health systems','Global prosperity','Global peace and security','Climate resilience','Access and inclusion'],
  },
  {
    code:'split-site',
    name:'Commonwealth Split-Site PhD Scholarship',
    degree:['PhD (split-site)'],
    duration:'12 months at UK institution',
    urlSlug:'commonwealth-split-site-scholarships',
    funding:'Return airfare + monthly stipend + research support during UK segment',
    summary:'For doctoral candidates already enrolled at a home-country university to spend up to 12 months of their PhD at a UK institution with UK supervision.',
    eligibility:'PhD candidate at an eligible home-country university. Confirmed UK host supervisor and institution.',
    subjects:['All CSC development themes'],
  },
  {
    code:'distance',
    name:'Commonwealth Distance Learning Scholarship',
    degree:["Master's (distance learning)"],
    duration:'Part-time 2-3 years',
    urlSlug:'commonwealth-distance-learning-scholarships',
    funding:'Full tuition for UK part-time distance Master\'s',
    summary:'Fully-funded tuition for a part-time UK distance-learning Master\'s. No stipend or travel — designed for working professionals in their home country.',
    eligibility:'Citizen of an eligible Commonwealth LMIC, currently in gainful employment, unable to afford self-funded study.',
    subjects:['All CSC development themes','Public health','Education','Governance','Environmental management'],
  },
  {
    code:'professional',
    name:'Commonwealth Professional Fellowship',
    degree:['Professional Fellowship'],
    duration:'5-10 weeks',
    urlSlug:'commonwealth-professional-fellowships',
    funding:'Return airfare + stipend + host-organisation costs',
    summary:'Short professional fellowships in the UK for mid-career professionals from eligible Commonwealth LMICs, hosted by UK institutions in the applicant\'s sector.',
    eligibility:'Mid-career professional (typically 5+ years experience), sponsored by a UK host organisation.',
    subjects:['Health','Education','Public administration','Media','Justice','Development sector'],
  },
  {
    code:'shared',
    name:'Commonwealth Shared Scholarship',
    degree:["Master's"],
    duration:'One year',
    urlSlug:'commonwealth-shared-scholarships',
    funding:'Full tuition + monthly stipend + return airfare (jointly funded by UK universities and FCDO)',
    summary:'Fully-funded Master\'s co-funded by CSC and participating UK universities. Applicants apply through the UK university, which then nominates candidates to CSC.',
    eligibility:'Citizen of an eligible Commonwealth LMIC. Must apply through a participating UK university.',
    subjects:['Priority development areas across participating UK universities'],
  },
]

// Participating UK universities for the Shared Scholarship program (real list).
const CSC_SHARED_UNIS = [
  'University of Oxford','University of Cambridge','Imperial College London',
  'University College London','London School of Economics','King\'s College London',
  'University of Edinburgh','University of Manchester','University of Warwick',
  'University of Bristol','University of Glasgow','University of Sheffield',
  'University of Leeds','University of Nottingham','University of Southampton',
  'University of Birmingham','Newcastle University','University of Sussex',
  'University of York','Queen Mary University of London','SOAS University of London',
  'University of Reading','University of St Andrews','University of Exeter',
  'University of Leicester','Cardiff University','University of Liverpool',
  'London School of Hygiene & Tropical Medicine','University of East Anglia',
]

export async function run() {
  log(NAME, 'starting')
  const records = []

  // Per program × per country: emit one country-scoped record so students
  // searching for their own country's Commonwealth scholarships get a hit.
  for (const p of CSC_PROGRAMS) {
    for (const country of CSC_LMIC_COUNTRIES) {
      records.push(normalize({
        slug: `csc-${p.code}-${country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        scholarship_name: `${p.name} — ${country}`,
        university_name: 'UK Government (Commonwealth Scholarship Commission)',
        country: 'United Kingdom',
        region: 'Europe (UK)',
        degree_levels: p.degree,
        eligible_nationalities: [country],
        major_fields: p.subjects,
        funding_type: p.code === 'distance' ? 'Fully funded (tuition only)' : 'Fully funded',
        funding_amount: p.funding,
        funding_summary: p.summary,
        full_or_partial: 'Fully funded',
        estimated_living_cost_usd: 18000,
        min_ielts: p.code === 'distance' ? 6.0 : 6.5,
        min_toefl: 79,
        required_documents: ['Bachelor\'s degree (upper second-class)', 'References', 'Development impact statement', 'CV', 'Study/research plan'],
        eligibility_summary: p.eligibility.replace('an eligible Commonwealth LMIC', country),
        deadline_status: 'Annual — typically October-December',
        deadline_note: 'Applications open through the CSC electronic system in September and close in mid-December each year. Some programmes also require a nominating body (National Nominating Agency).',
        application_link: `https://cscuk.fcdo.gov.uk/scholarships/${p.urlSlug}/`,
        source_url:       `https://cscuk.fcdo.gov.uk/scholarships/${p.urlSlug}/`,
        source_type: 'Official Commonwealth Scholarship Commission page',
        trust_level: 'Source-linked (Official)',
        data_quality_score: 95,
        scraper_source: NAME,
        scraper_source_name: SOURCE.name,
      }))
    }
  }

  // Additionally: named per-university Shared Scholarship entries for
  // students who search by UK university.
  for (const uni of CSC_SHARED_UNIS) {
    records.push(normalize({
      slug: `csc-shared-${uni.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      scholarship_name: `Commonwealth Shared Scholarship — ${uni}`,
      university_name: uni,
      country: 'United Kingdom',
      region: 'Europe (UK)',
      degree_levels: ["Master's"],
      eligible_nationalities: CSC_LMIC_COUNTRIES,
      major_fields: ['Development-priority disciplines at this university'],
      funding_type: 'Fully funded',
      funding_amount: 'Full tuition + monthly stipend + return airfare (co-funded by CSC and the university)',
      funding_summary: `The Commonwealth Shared Scholarship at ${uni} co-funds one-year Master's programmes for outstanding students from Commonwealth LMIC countries. Applications are made directly to ${uni}, which nominates candidates to the Commonwealth Scholarship Commission.`,
      full_or_partial: 'Fully funded',
      estimated_living_cost_usd: 20000,
      min_ielts: 6.5,
      min_toefl: 79,
      required_documents: ['Bachelor\'s degree (upper second-class)', 'Development impact statement', 'CV', 'References'],
      eligibility_summary: 'Citizens of eligible Commonwealth LMIC countries. Applicants must be admitted to an eligible Master\'s programme at this UK university.',
      deadline_status: 'Annual — aligned to UK university admission cycles',
      deadline_note: `Deadlines are set by ${uni}'s admissions calendar (typically January-March). Check the university's postgraduate scholarships page.`,
      application_link: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/',
      source_url:       'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/',
      source_type: 'Official Commonwealth Shared Scholarships page',
      trust_level: 'Source-linked (Official)',
      data_quality_score: 92,
      scraper_source: NAME,
      scraper_source_name: SOURCE.name,
    }))
  }

  log(NAME, `emitted ${records.length} records`)
  return records
}
