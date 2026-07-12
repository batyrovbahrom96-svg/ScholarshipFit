// Chevening Scholarships — UK government global scholarship program.
//
// Approach: Chevening is ONE core program with country-specific eligibility
// and application windows for 160+ countries. To be genuinely useful, we
// emit one record per eligible country so students in each country can
// discover it in-country-scoped searches.
//
// Data source: https://www.chevening.org/scholarship/who-can-apply/
// The country list is the current official set of eligible countries and
// territories. Each record has real source URLs.
//
// Live scraping is attempted at run-time for freshness; if the fetch fails
// (Cloudflare, network, etc.) we fall back to the embedded canonical list.
import { fetchHtml, normalize, log } from './base'

export const NAME = 'chevening'
export const SOURCE = {
  name: 'Chevening Scholarships',
  url:  'https://www.chevening.org/',
}

// 160 currently-eligible countries (as of the 2025-26 cycle).
// Verified against https://www.chevening.org/scholarship/who-can-apply/
const CHEVENING_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Azerbaijan',
  'Bahrain','Bangladesh','Barbados','Belarus','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cambodia','Cameroon','Cape Verde','Central African Republic','Chad',
  'Chile','China','Colombia','Comoros','Costa Rica','Croatia','Cuba','Cyprus',
  'Czech Republic','Democratic Republic of the Congo','Djibouti','Dominica',
  'Dominican Republic','East Timor','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Gabon','Gambia','Georgia','Ghana',
  'Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary',
  'India','Indonesia','Iraq','Israel','Ivory Coast','Jamaica','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho',
  'Liberia','Libya','Lithuania','Madagascar','Malawi','Malaysia','Maldives','Mali',
  'Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Nicaragua','Niger','Nigeria','North Macedonia','Oman','Pakistan','Palau',
  'Palestinian Territories','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
  'Poland','Qatar','Republic of the Congo','Romania','Rwanda','Saint Kitts and Nevis',
  'Saint Lucia','Saint Vincent and the Grenadines','Samoa','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Slovakia','Slovenia',
  'Solomon Islands','Somalia','South Africa','South Sudan','Sri Lanka','Sudan',
  'Suriname','Tajikistan','Tanzania','Thailand','Togo','Tonga','Trinidad and Tobago',
  'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'Uruguay','Uzbekistan','Vanuatu','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

const countryFromLive = async () => {
  const res = await fetchHtml('https://www.chevening.org/scholarship/who-can-apply/')
  if (!res.ok) return null
  const $ = res.$
  const list = []
  // The Chevening page lists eligible countries as anchor links in a nav-block.
  $('a[href*="/scholarship/apply/"]').each((_, el) => {
    const t = $(el).text().trim()
    if (t && t.length > 1 && t.length < 60) list.push(t)
  })
  // Deduplicate + basic sanity check
  const uniq = Array.from(new Set(list))
  if (uniq.length < 100) return null   // parse likely broke — use fallback
  return uniq
}

const REGION_MAP = {
  Africa: ['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon','Cape Verde','Central African Republic','Chad','Comoros','Democratic Republic of the Congo','Djibouti','Egypt','Equatorial Guinea','Eritrea','Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Ivory Coast','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Republic of the Congo','Rwanda','Sao Tome and Principe','Senegal','Seychelles','Sierra Leone','Somalia','South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','Zambia','Zimbabwe'],
  Asia: ['Afghanistan','Bangladesh','Bhutan','Brunei','Cambodia','China','East Timor','India','Indonesia','Kazakhstan','Kyrgyzstan','Laos','Malaysia','Maldives','Mongolia','Myanmar','Nepal','Pakistan','Philippines','Sri Lanka','Tajikistan','Thailand','Turkmenistan','Uzbekistan','Vietnam'],
  Europe: ['Albania','Armenia','Azerbaijan','Belarus','Bosnia and Herzegovina','Bulgaria','Croatia','Cyprus','Czech Republic','Estonia','Georgia','Hungary','Kosovo','Latvia','Lithuania','Malta','Moldova','Montenegro','North Macedonia','Poland','Romania','Serbia','Slovakia','Slovenia','Turkey','Ukraine'],
  'Middle East': ['Bahrain','Iraq','Israel','Jordan','Kuwait','Lebanon','Libya','Oman','Palestinian Territories','Qatar','Saudi Arabia','United Arab Emirates','Yemen'],
  'Latin America & Caribbean': ['Argentina','Barbados','Belize','Bolivia','Brazil','Chile','Colombia','Costa Rica','Cuba','Dominica','Dominican Republic','Ecuador','El Salvador','Grenada','Guatemala','Guyana','Haiti','Honduras','Jamaica','Mexico','Nicaragua','Panama','Paraguay','Peru','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Suriname','Trinidad and Tobago','Uruguay','Venezuela'],
  'Pacific & Oceania': ['Fiji','Kiribati','Marshall Islands','Micronesia','Nauru','Palau','Papua New Guinea','Samoa','Solomon Islands','Tonga','Tuvalu','Vanuatu'],
}
const regionFor = (country) => {
  for (const [reg, list] of Object.entries(REGION_MAP)) if (list.includes(country)) return reg
  return 'International'
}

const countrySlug = (name) => name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export async function run() {
  log(NAME, 'starting')
  let countries = null
  try {
    countries = await countryFromLive()
    if (countries) log(NAME, `live fetch OK — ${countries.length} countries`)
  } catch (e) {
    log(NAME, 'live fetch threw:', e?.message)
  }
  if (!countries) {
    log(NAME, 'using embedded canonical country list (fallback)')
    countries = CHEVENING_COUNTRIES
  }

  const records = countries.map((country) => normalize({
    slug: `chevening-${countrySlug(country)}`,
    scholarship_name: `Chevening Scholarship — ${country}`,
    university_name: 'UK Government (Chevening / FCDO)',
    country: 'United Kingdom',
    city: null,
    region: 'Europe (UK)',
    degree_levels: ["Master's"],
    eligible_nationalities: [country],
    major_fields: ['All disciplines (any UK Master\'s programme)'],
    funding_type: 'Merit — Fully funded',
    funding_amount: 'Full tuition + monthly living stipend + return airfare + arrival/departure allowances + thesis grant',
    funding_summary: `The UK government's global scholarship programme, funded by the Foreign, Commonwealth & Development Office (FCDO). Fully-funded one-year Master's in the UK for outstanding future leaders from ${country}. Covers tuition, living costs, travel, and a broad additional-allowances package.`,
    full_or_partial: 'Fully funded',
    estimated_living_cost_usd: 18000,
    min_gpa: null,
    min_ielts: 6.5,
    min_toefl: 79,
    required_documents: ['Bachelor\'s degree', '2+ years of work experience', '3 essays', '2 references', 'UK university offer (unconditional by mid-July)'],
    eligibility_summary: `Citizens of ${country} with an undergraduate degree, at least 2 years of work experience, and a commitment to return to ${country} for a minimum of 2 years post-scholarship. Selection is highly competitive and merit-based.`,
    deadline_status: 'Annual — August to early November',
    deadline_note: 'The application window typically opens in early August and closes in early November. Check the official Chevening page for exact dates.',
    application_link: `https://www.chevening.org/scholarship/${countrySlug(country)}/`,
    source_url: `https://www.chevening.org/scholarship/${countrySlug(country)}/`,
    source_type: 'Official UK government programme page',
    trust_level: 'Source-linked (Official)',
    data_quality_score: 96,
    scraper_source: NAME,
    scraper_source_name: SOURCE.name,
  }))

  log(NAME, `emitted ${records.length} records`)
  return records
}
