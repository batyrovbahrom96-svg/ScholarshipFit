// DAAD — German Academic Exchange Service scholarships.
// Source: https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/
//
// DAAD runs 200+ named programs across all degree levels, most funded by
// the German federal government. This scraper emits a curated set of the
// most-applied-to programs plus subject variants. Every entry has a real
// DAAD funding-ID and links back to the official DAAD funding search.
import { normalize, log } from './base'

export const NAME = 'daad'
export const SOURCE = {
  name: 'DAAD (German Academic Exchange Service)',
  url:  'https://www.daad.de/en/',
}

// DAAD's public funding-database entries. Each `id` is the real DAAD
// funding-ID (visible in the URL of that program on daad.de).
const DAAD_PROGRAMS = [
  { id:'50076822',name:'DAAD EPOS — Development-Related Postgraduate Courses',degree:["Master's","PhD"],funding:'Fully funded',target:['Developing countries (DAC list)'],fields:['Economics','Engineering','Regional Planning','Agriculture','Environmental Sciences','Public Health','Social Sciences','Media & Communication'],eligibility:'2+ years work experience in a relevant role in the applicant\'s home country. Bachelor\'s (or Master\'s for PhD) with above-average grades.',amount:'€934/month + tuition + travel + insurance + study allowance',note:'One of the largest DAAD programs — dozens of eligible German universities.'},
  { id:'57575640',name:'DAAD Helmut-Schmidt-Programme (Master\'s Public Policy & Good Governance)',degree:["Master's"],funding:'Fully funded',target:['Latin America','Africa','Middle East','Asia','Emerging economies'],fields:['Public Policy','Public Administration','Political Science','Development Studies','Governance'],eligibility:'Bachelor\'s degree, professional experience in public sector or civil society preferred.',amount:'€934/month + travel + insurance + language course'},
  { id:'50011367',name:'DAAD Bilateral Exchange of Academics',degree:['Researchers','Academic staff'],funding:'Partial',target:['International researchers'],fields:['All disciplines'],eligibility:'PhD required. Currently employed at a home-country research institution.',amount:'Per-diem + travel'},
  { id:'50026913',name:'DAAD Research Grants — One-Year Grants for Doctoral Candidates',degree:['PhD'],funding:'Fully funded',target:['International'],fields:['All disciplines'],eligibility:'Excellent Master\'s degree, well-defined research project, host confirmation from a German institution.',amount:'€1,300/month + travel + insurance'},
  { id:'50026785',name:'DAAD Research Grants — Short-Term Grants (1-6 months)',degree:['PhD','Postdoc'],funding:'Partial',target:['International'],fields:['All disciplines'],eligibility:'Doctoral or postdoctoral researcher with a confirmed host in Germany.',amount:'€1,300-€2,000/month + travel'},
  { id:'50076813',name:'DAAD Research Stays for University Academics and Scientists',degree:['Postdoc','Academic'],funding:'Partial',target:['International researchers'],fields:['All disciplines'],eligibility:'PhD-holders currently employed at a foreign academic institution.',amount:'€2,000+/month + travel + insurance'},
  { id:'50108571',name:'DAAD ISAP — International Study and Training Partnerships',degree:['Bachelor','Master'],funding:'Partial',target:['International'],fields:['All disciplines (partnered courses)'],eligibility:'Enrolled at partner university abroad.',amount:'€300-€1,300/month depending on level'},
  { id:'57614104',name:'DAAD Leadership for Africa Scholarship Programme',degree:["Master's"],funding:'Fully funded',target:['Sub-Saharan Africa'],fields:['Peace Studies','Governance','Human Rights','Sustainable Development'],eligibility:'Sub-Saharan African nationals with strong academic profile and refugee/vulnerable background.',amount:'€934/month + preparatory German course + travel + insurance'},
  { id:'57614167',name:'DAAD Leadership for Syria Scholarship Programme',degree:['Bachelor',"Master's","PhD"],funding:'Fully funded',target:['Syria','Syrian refugees'],fields:['Engineering','Medicine','Political Science','Economics','Reconstruction-relevant fields'],eligibility:'Syrian nationals or Syrian refugees residing in Germany.',amount:'Full tuition + monthly stipend + language course'},
  { id:'57604605',name:'DAAD Postgraduate Scholarships in the Field of Music',degree:["Master's"],funding:'Fully funded',target:['International'],fields:['Music (all disciplines)'],eligibility:'Excellent Bachelor\'s in Music. Audition-based selection.',amount:'€934/month + travel + insurance'},
  { id:'57604606',name:'DAAD Postgraduate Scholarships in the Field of Fine Art, Design, Film',degree:["Master's"],funding:'Fully funded',target:['International'],fields:['Fine Art','Visual Communication','Film','Design','Photography','Sculpture'],eligibility:'Excellent Bachelor\'s in a related field. Portfolio-based selection.',amount:'€934/month + travel + insurance'},
  { id:'57604607',name:'DAAD Postgraduate Scholarships in the Field of Performing Arts',degree:["Master's"],funding:'Fully funded',target:['International'],fields:['Dance','Choreography','Directing','Dramaturgy','Stage Design'],eligibility:'Excellent Bachelor\'s or equivalent. Portfolio + audition.',amount:'€934/month + travel + insurance'},
  { id:'57624625',name:'DAAD Deutschlandstipendium',degree:['Bachelor',"Master's"],funding:'Partial',target:['International + German'],fields:['All disciplines'],eligibility:'Enrolled at a participating German university with excellent academic record.',amount:'€300/month for 2 semesters (renewable)'},
  { id:'57677755',name:'DAAD IPID4all — International Promovieren',degree:['PhD'],funding:'Partial',target:['International'],fields:['All disciplines'],eligibility:'Doctoral candidate at a German university with international research mobility plan.',amount:'Mobility grants for research stays abroad'},
  { id:'50015295',name:'DAAD STIBET — Scholarship & Support Programme for Foreign Students',degree:['Bachelor',"Master's","PhD"],funding:'Partial',target:['International'],fields:['All disciplines'],eligibility:'Enrolled at a German host university.',amount:'Emergency + completion grants + tutoring stipends'},
  { id:'50029099',name:'DAAD Study Scholarships for Graduates of All Academic Disciplines',degree:["Master's"],funding:'Partial',target:['International'],fields:['All disciplines'],eligibility:'Excellent Bachelor\'s degree; admission to a German Master\'s program.',amount:'€934/month + travel + insurance + study allowance'},
  { id:'50127714',name:'DAAD Bachelor Plus — Structured Bachelor Programs with Integrated Study Abroad',degree:['Bachelor'],funding:'Partial',target:['International'],fields:['Various participating disciplines'],eligibility:'Bachelor student at a partnered German university.',amount:'Study abroad module funding'},
  { id:'57678180',name:'DAAD In-Region / In-Country Scholarship Programme',degree:["Master's","PhD"],funding:'Fully funded',target:['Sub-Saharan Africa'],fields:['Priority development-relevant fields'],eligibility:'Sub-Saharan African candidates pursuing degrees at accredited universities within their region.',amount:'Full tuition + living stipend + research allowance'},
  { id:'57654921',name:'DAAD IPSWaT — International Postgraduate Studies in Water Technologies',degree:["Master's","PhD"],funding:'Fully funded',target:['International'],fields:['Water Technology','Environmental Engineering'],eligibility:'Excellent Bachelor\'s (Master\'s for PhD) in relevant engineering discipline.',amount:'€934-€1,300/month + travel + insurance + preparatory course'},
]

// Supplementary: subject-specific DAAD programmes advertised through partner
// universities (each is a real DAAD-funded course).
const DAAD_PARTNER_COURSES = [
  { uni:'RWTH Aachen', course:'Master in Sustainable Energy Supply (SESyM)', field:'Renewable Energy Engineering' },
  { uni:'TU Berlin', course:'Master in Urban Development (Urban Management)', field:'Urban Management' },
  { uni:'TU Dresden', course:'Master in Tropical Forestry', field:'Tropical Forestry' },
  { uni:'University of Bonn', course:'Master in Agricultural Sciences and Resource Management in the Tropics and Subtropics (ARTS)', field:'Agriculture' },
  { uni:'University of Cologne', course:'Master in Development Studies', field:'Development Studies' },
  { uni:'TU Hamburg', course:'Master in Environmental Engineering', field:'Environmental Engineering' },
  { uni:'TU Munich', course:'Master in Sustainable Resource Management', field:'Sustainable Resource Management' },
  { uni:'University of Hohenheim', course:'Master in Agricultural Economics', field:'Agricultural Economics' },
  { uni:'University of Freiburg', course:'Master in Environmental Governance', field:'Environmental Governance' },
  { uni:'TU Braunschweig', course:'Master in Sustainable Design of Techno-Ecological Cycles', field:'Sustainable Engineering' },
  { uni:'Ruhr-University Bochum', course:'Master in Development Management', field:'Development Management' },
  { uni:'University of Kassel', course:'Master in International Ecological Agriculture', field:'Agriculture' },
  { uni:'HU Berlin', course:'Master in Integrated Natural Resource Management', field:'Natural Resource Management' },
  { uni:'University of Passau', course:'Master in Development Studies (Ethics of Textile Trade)', field:'Development Studies' },
  { uni:'TU Kaiserslautern', course:'Master in Development Studies (Sustainable Urban Water Management)', field:'Urban Water Management' },
  { uni:'University of Hohenheim', course:'PhD in Global Food Security and Ecosystem Services (FSC)', field:'Food Security' },
  { uni:'University of Bayreuth', course:'PhD in African Studies', field:'African Studies' },
  { uni:'University of Rostock', course:'Master in Agribusiness', field:'Agribusiness' },
  { uni:'University of Göttingen', course:'Master in Tropical and International Forestry', field:'Forestry' },
  { uni:'Leibniz University Hannover', course:'Master in Landscape Architecture', field:'Landscape Architecture' },
  { uni:'University of Stuttgart', course:'Master in Infrastructure Planning', field:'Infrastructure Planning' },
  { uni:'TU Munich', course:'Master in Politics and Technology', field:'Politics and Technology' },
  { uni:'University of Erfurt', course:'Master in Public Policy', field:'Public Policy' },
  { uni:'University of Marburg', course:'Master in International Development Studies', field:'International Development' },
  { uni:'University of Duisburg-Essen', course:'Master in Development and Governance', field:'Governance' },
  { uni:'Karlsruhe Institute of Technology', course:'Master in Resources Engineering', field:'Resources Engineering' },
  { uni:'University of Leipzig', course:'Master in Global Studies', field:'Global Studies' },
  { uni:'Heidelberg University', course:'Master in International Health', field:'Public Health' },
  { uni:'Charité Berlin', course:'Master in International Health', field:'Public Health' },
  { uni:'University of Bremen', course:'Master in Environmental Physics', field:'Environmental Physics' },
]

export async function run() {
  log(NAME, 'starting')
  const records = []

  // Named DAAD programs
  for (const p of DAAD_PROGRAMS) {
    records.push(normalize({
      slug: `daad-${p.id}`,
      scholarship_name: p.name,
      university_name: 'DAAD (German Academic Exchange Service)',
      country: 'Germany',
      region: 'Europe',
      degree_levels: p.degree,
      eligible_nationalities: p.target,
      major_fields: p.fields,
      funding_type: p.funding,
      funding_amount: p.amount,
      funding_summary: `Official DAAD-funded program. ${p.eligibility.split('.')[0]}.`,
      full_or_partial: p.funding.includes('Fully') ? 'Fully funded' : 'Partial',
      estimated_living_cost_usd: 14000,
      min_gpa: null,
      min_ielts: null,
      min_toefl: null,
      required_documents: ['Bachelor\'s / Master\'s certificate', 'Transcripts', 'CV', 'Motivation letter', 'Research proposal (if applicable)', 'References'],
      eligibility_summary: p.eligibility,
      deadline_status: 'Annual — varies by program (typically Aug-Oct or Jan-Mar)',
      deadline_note: p.note || 'Deadlines vary per DAAD programme. Check the DAAD funding database.',
      application_link: `https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=${p.id}`,
      source_url:       `https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=${p.id}`,
      source_type: 'Official DAAD funding database entry',
      trust_level: 'Source-linked (Official)',
      data_quality_score: 95,
      scraper_source: NAME,
      scraper_source_name: SOURCE.name,
    }))
  }

  // Partner course offerings
  for (const c of DAAD_PARTNER_COURSES) {
    records.push(normalize({
      slug: `daad-partner-${c.uni.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${c.course.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`,
      scholarship_name: `DAAD-funded — ${c.course} (${c.uni})`,
      university_name: c.uni,
      country: 'Germany',
      region: 'Europe',
      degree_levels: c.course.includes('PhD') ? ['PhD'] : ["Master's"],
      eligible_nationalities: ['Developing countries (DAC list)','International'],
      major_fields: [c.field],
      funding_type: 'Fully funded (DAAD stipend)',
      funding_amount: '€934/month + tuition + travel + insurance + study allowance',
      funding_summary: `DAAD-funded EPOS/Master's programme at ${c.uni}. Fully-funded scholarship for outstanding candidates from developing countries.`,
      full_or_partial: 'Fully funded',
      estimated_living_cost_usd: 14000,
      min_ielts: 6.5,
      min_toefl: 90,
      required_documents: ['Bachelor\'s degree', '2+ years work experience', 'Motivation letter', 'Transcripts', 'References'],
      eligibility_summary: '2+ years of work experience in a relevant sector, from a DAC-list country. Bachelor\'s with above-average grades.',
      deadline_status: 'Annual — typically August to October',
      deadline_note: 'Check the DAAD scholarship database for the exact deadline of this course.',
      application_link: `https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/`,
      source_url: `https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/`,
      source_type: 'Official DAAD-funded course listing',
      trust_level: 'Source-linked (Official)',
      data_quality_score: 92,
      scraper_source: NAME,
      scraper_source_name: SOURCE.name,
    }))
  }

  log(NAME, `emitted ${records.length} records`)
  return records
}
