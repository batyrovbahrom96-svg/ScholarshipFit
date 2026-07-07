'use client'

// Ivy League + globally recognized prestige institutions.
// We render each as an elegant typographic wordmark for 100% reliability
// (external logo hosts are inconsistent). The result reads as an editorial
// prestige row — closer to premium SaaS "Featured in" strips than clip-art logos.

const LOGOS = [
  { name: 'Harvard',   founded: '1636', tag: 'Cambridge, MA', family: 'serif' },
  { name: 'Yale',      founded: '1701', tag: 'New Haven, CT', family: 'serif', italic: true },
  { name: 'Princeton', founded: '1746', tag: 'Princeton, NJ', family: 'serif' },
  { name: 'Columbia',  founded: '1754', tag: 'New York, NY',  family: 'serif' },
  { name: 'UPenn',     founded: '1740', tag: 'Philadelphia',   family: 'serif' },
  { name: 'Brown',     founded: '1764', tag: 'Providence, RI', family: 'serif' },
  { name: 'Dartmouth', founded: '1769', tag: 'Hanover, NH',    family: 'serif' },
  { name: 'Cornell',   founded: '1865', tag: 'Ithaca, NY',     family: 'serif' },
  { name: 'Stanford',  founded: '1885', tag: 'Stanford, CA',   family: 'sans',  weight: 'font-semibold' },
  { name: 'MIT',       founded: '1861', tag: 'Cambridge, MA',  family: 'sans',  weight: 'font-bold', tracking: 'tracking-[0.15em]' },
  { name: 'Oxford',    founded: '1096', tag: 'United Kingdom', family: 'serif' },
  { name: 'Cambridge', founded: '1209', tag: 'United Kingdom', family: 'serif' },
]

function LogoTile({ logo }) {
  const family = logo.family === 'serif' ? 'font-serif' : 'font-sans'
  const italic = logo.italic ? 'italic' : ''
  const weight = logo.weight || 'font-medium'
  const tracking = logo.tracking || 'tracking-tight'
  return (
    <div className="group relative shrink-0 h-28 md:h-32 w-52 md:w-60 flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition">
      {/* Wordmark */}
      <div className={`${family} ${italic} ${weight} ${tracking} text-white/85 group-hover:text-white transition text-2xl md:text-[28px] leading-none`}>
        {logo.name}
      </div>
      <div className="mt-1.5 h-px w-6 bg-white/20 group-hover:bg-cyan-400/60 transition"/>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-white/40 group-hover:text-white/60 transition">
        {logo.founded} · {logo.tag}
      </div>
    </div>
  )
}

export default function UniversityMarquee() {
  const doubled = [...LOGOS, ...LOGOS]
  const reversed = [...LOGOS].reverse()
  const doubledReversed = [...reversed, ...reversed]
  return (
    <section className="relative py-14 md:py-20">
      <div className="text-center mb-8 px-4">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300 font-medium">Trusted signal</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Accepted at top universities worldwide
        </h2>
        <p className="mt-2 text-sm text-white/50 max-w-xl mx-auto">
          Students who use ScholarshipFit apply to institutions like these. We are not affiliated with or endorsed by any university listed — names shown for illustrative purposes.
        </p>
      </div>

      {/* Row 1 — left to right */}
      <div className="relative fade-x">
        <div className="flex gap-4 animate-marquee w-max py-3">
          {doubled.map((l, i) => (<LogoTile key={`a-${i}`} logo={l}/>))}
        </div>
      </div>

      {/* Row 2 — right to left */}
      <div className="relative fade-x mt-4">
        <div className="flex gap-4 animate-marquee-reverse w-max py-3">
          {doubledReversed.map((l, i) => (<LogoTile key={`b-${i}`} logo={l}/>))}
        </div>
      </div>
    </section>
  )
}
