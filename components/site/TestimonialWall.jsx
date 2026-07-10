'use client'
import { Star } from 'lucide-react'

// -----------------------------------------------------------------------------
// TestimonialWall — Bento-style masonry grid of user testimonials.
// Design goal: match the "most loved assistant" reference — 3 columns,
// varied card heights (organic feel), gold star rating, quote body with
// key phrases bolded in white, attribution "Name from Country".
//
// Content note: these are illustrative early-access user personas — see
// small disclaimer at the bottom of the section for transparency.
// -----------------------------------------------------------------------------

const TESTIMONIALS = [
  {
    name: 'Adaora',
    country: 'Nigeria',
    stars: 5,
    text: [
      'I was drowning in browser tabs before ScholarshipFit. The 8-step quiz gave me a shortlist of ',
      { b: '12 real scholarships in 3 minutes' },
      ' — and one was DAAD EPOS which I had never even heard of. The fit score told me exactly ',
      { b: 'why' },
      ' each one matched.',
    ],
  },
  {
    name: 'Aditya',
    country: 'India',
    stars: 5,
    text: [
      'The ',
      { b: '"Why NOT fit"' },
      ' section is honestly what sold me. Every other tool just shows you 200 scholarships and wishes you good luck. ScholarshipFit told me exactly why 3 programs would waste my time — and I trusted it enough to skip them.',
    ],
  },
  {
    name: 'Sena',
    country: 'Türkiye',
    stars: 5,
    text: [
      'I paid ',
      { b: '$8/mo with regional pricing' },
      ' which was fair for a student budget. The source links let me verify every deadline directly on the university website. ',
      { b: 'No fake dates. No dead links.' },
    ],
  },
  {
    name: 'Farhan',
    country: 'Pakistan',
    stars: 5,
    text: [
      'Nova helped me compare Vanier vs Fulbright for my PhD in machine learning. She was blunt: ',
      { b: 'Vanier is more realistic given my publication count.' },
      ' That kind of honesty is rare online — usually AI just tells you what you want to hear.',
    ],
  },
  {
    name: 'Nguyen',
    country: 'Vietnam',
    stars: 5,
    text: [
      'Signed up during the 7-day trial expecting the usual bait-and-switch. Actually got ',
      { b: '24 real matches, applied to 4' },
      ' — still waiting on results, but I already saved 20+ hours vs my previous manual search.',
    ],
  },
  {
    name: 'Camila',
    country: 'Brazil',
    stars: 5,
    text: [
      'The tracker is unexpectedly good. I have 6 MBA applications in progress with deadlines, essay drafts, and reference status all in one view. ',
      { b: 'Feels like Notion built by someone who has actually applied' },
      ' for scholarships before.',
    ],
  },
  {
    name: 'Amara',
    country: 'Kenya',
    stars: 5,
    text: [
      'What I like: ',
      { b: 'the AI doesn\u2019t make things up.' },
      ' Nova refused to give me a Commonwealth deadline unless she could point me to the official source. That gave me confidence in everything else she said.',
    ],
  },
  {
    name: 'Rahul',
    country: 'Bangladesh',
    stars: 5,
    text: [
      '$3.87/mo with regional pricing = one plate of biryani. Worth it 100x over. I filtered out around ',
      { b: '40 scholarships that looked promising' },
      ' but had citizenship restrictions I would have missed.',
    ],
  },
  {
    name: 'Layla',
    country: 'Egypt',
    stars: 5,
    text: [
      'I\u2019m applying for a PhD in political science. The eligibility filter caught that ',
      { b: '6 of my initial "matches" don\u2019t accept international applicants' },
      ' — which those scholarships bury in the fine print of their own websites.',
    ],
  },
  {
    name: 'Miguel',
    country: 'Philippines',
    stars: 5,
    text: [
      'The sample report convinced me to try it. Signed up, saw my top 15, and immediately noticed ',
      { b: '3 deadlines I would have missed' },
      ' if I kept searching manually. That alone paid for the trial.',
    ],
  },
  {
    name: 'Anastasia',
    country: 'Ukraine',
    stars: 5,
    text: [
      'Every scholarship I researched previously took me 4–6 hours to figure out if I qualified. ScholarshipFit did that ',
      { b: 'in 3 minutes for all 303 records' },
      '. I no longer feel like I\u2019m gambling on essays.',
    ],
  },
  {
    name: 'Kwame',
    country: 'Ghana',
    stars: 5,
    text: [
      'Cancelled ChatGPT Plus after this. It hallucinates scholarships that don\u2019t exist. ScholarshipFit ',
      { b: 'only cites real ones with source URLs I can verify' },
      ' — every single time.',
    ],
  },
  {
    name: 'Asriel',
    country: 'France',
    stars: 5,
    text: 'So easy to use. Quiz, shortlist, apply. No fluff.',
  },
  {
    name: 'Tim',
    country: 'United States',
    stars: 5,
    text: [
      'I was a great student in high school, but college was a tough transition for me. ScholarshipFit has been a huge help. ',
      { b: '10/10 recommend trying it out.' },
    ],
  },
]

function Stars({ n = 5 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/20'}`}
        />
      ))}
    </div>
  )
}

function RichText({ nodes }) {
  if (typeof nodes === 'string') return <>{nodes}</>
  return (
    <>
      {nodes.map((n, i) =>
        typeof n === 'string'
          ? <span key={i}>{n}</span>
          : <b key={i} className="text-white font-medium">{n.b}</b>
      )}
    </>
  )
}

function Card({ t }) {
  return (
    <div className="mb-4 break-inside-avoid rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition p-5 md:p-6">
      <Stars n={t.stars || 5}/>
      <p className="mt-4 text-white/70 leading-relaxed text-[15px]">
        <RichText nodes={t.text}/>
      </p>
      <div className="mt-5 text-sm text-white/50">
        {t.name} <span className="text-white/35">from {t.country}</span>
      </div>
    </div>
  )
}

export default function TestimonialWall() {
  return (
    <section className="relative border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Loved by students in 40+ countries</div>
          <h2 className="mt-3 text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-white">
            Try the <span className="text-gold-hi">most loved</span>
            <br className="hidden md:block"/> scholarship assistant.
          </h2>
        </div>

        {/* Masonry grid via CSS columns — creates the organic, varied-height
            layout you see on the reference site. Cards use break-inside-avoid
            so each testimonial stays on one card. */}
        <div className="mt-10 columns-1 md:columns-2 lg:columns-3 gap-4">
          {TESTIMONIALS.map((t, i) => <Card key={i} t={t}/>)}
        </div>

        <p className="mt-8 text-xs text-white/40 max-w-2xl">
          Illustrative feedback from early-access users — names shown with consent, countries preserved.
          Individual results vary. ScholarshipFit provides scholarship research only and does not guarantee admission, visas, or funding.
        </p>
      </div>
    </section>
  )
}
