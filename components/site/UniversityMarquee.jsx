'use client'

// 15 elite universities from around the world — decorative heraldic crests
// (not official trademarks). Scrolling marquee for the hero trust section.

const CRESTS = [
  { name: 'Oxford',     line1: 'UNIVERSITY OF', line2: 'OXFORD',     caption: 'Oxford',     variant: 'navy',    icon: 'crown' },
  { name: 'Cambridge',  line1: 'UNIVERSITY OF', line2: 'CAMBRIDGE',  caption: 'Cambridge',  variant: 'red',     icon: 'cross' },
  { name: 'Harvard',    line1: 'HARVARD',       line2: 'UNIVERSITY', caption: 'Harvard',    variant: 'crimson', icon: 'veritas' },
  { name: 'Yale',       line1: '',              line2: 'Yale',       caption: 'Yale',       variant: 'yale',    serifName: true, icon: 'book' },
  { name: 'Princeton',  line1: 'PRINCETON',     line2: 'UNIVERSITY', caption: 'Princeton',  variant: 'orange',  icon: 'tower' },
  { name: 'Stanford',   line1: 'STANFORD',      line2: 'UNIVERSITY', caption: 'Stanford',   variant: 'cardinal',icon: 'tree' },
  { name: 'MIT',        line1: 'MASSACHUSETTS', line2: 'INSTITUTE',  caption: 'MIT',        variant: 'mit',     icon: 'gears' },
  { name: 'Columbia',   line1: 'COLUMBIA',      line2: 'UNIVERSITY', caption: 'Columbia',   variant: 'columbia',icon: 'crown' },
  { name: 'Penn',       line1: 'UNIVERSITY OF', line2: 'PENNSYLVANIA', caption: 'Penn',     variant: 'penn',    icon: 'book' },
  { name: 'Brown',      line1: 'BROWN',         line2: 'UNIVERSITY', caption: 'Brown',      variant: 'brown',   icon: 'sun' },
  { name: 'Dartmouth',  line1: 'DARTMOUTH',     line2: 'COLLEGE',    caption: 'Dartmouth',  variant: 'dart',    icon: 'tree' },
  { name: 'Cornell',    line1: 'CORNELL',       line2: 'UNIVERSITY', caption: 'Cornell',    variant: 'cornell', icon: 'chevron' },
  { name: 'Imperial',   line1: 'IMPERIAL',      line2: 'COLLEGE LONDON', caption: 'Imperial', variant: 'imperial',icon: 'crown' },
  { name: 'ETH Zurich', line1: 'EIDGENÖSSISCHE', line2: 'TECHNISCHE',caption: 'ETH Zurich', variant: 'eth',     icon: 'chevron' },
  { name: 'NUS',        line1: 'NATIONAL UNIVERSITY OF', line2: 'SINGAPORE', caption: 'NUS', variant: 'nus',    icon: 'sun' },
]

const PALETTE = {
  navy:     ['#0F1B4C', '#1E2E7C'],
  red:      ['#5A0F1A', '#8B1A2B'],
  crimson:  ['#7A0019', '#A50034'],
  yale:     ['#0F4C81', '#1A6BB5'],
  orange:   ['#3E1F0A', '#7A3E10'],
  cardinal: ['#5C0016', '#8C1515'],
  mit:      ['#0F1B26', '#243447'],
  columbia: ['#0F4A8A', '#1D71C1'],
  penn:     ['#12172E', '#1F2560'],
  brown:    ['#3B1F0F', '#6B3E1E'],
  dart:     ['#0F3B26', '#1E6B47'],
  cornell:  ['#5C0016', '#B31B1B'],
  imperial: ['#0F1220', '#1E2340'],
  eth:      ['#0F2340', '#215C9E'],
  nus:      ['#0F2340', '#F58020'],
}

function CrestSVG({ variant, icon }) {
  const stops = PALETTE[variant] || ['#111', '#222']
  return (
    <svg viewBox="0 0 60 74" className="h-14 w-11 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`bg-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stops[0]}/>
          <stop offset="1" stopColor={stops[1]}/>
        </linearGradient>
        <linearGradient id={`gold-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5D67B"/>
          <stop offset="1" stopColor="#A88526"/>
        </linearGradient>
      </defs>
      {/* Shield */}
      <path d="M30 2 L56 8 V38 C56 55 44 68 30 72 C16 68 4 55 4 38 V8 Z"
            fill={`url(#bg-${variant})`} stroke={`url(#gold-${variant})`} strokeWidth="1.6"/>
      {/* Inner decorative element based on icon type */}
      {icon === 'crown' && (
        <>
          <path d="M14 22 L20 30 L26 22 L30 30 L34 22 L40 30 L46 22 L48 32 L12 32 Z" fill={`url(#gold-${variant})`} opacity="0.9"/>
          <rect x="26" y="38" width="8" height="20" rx="1" fill={`url(#gold-${variant})`} opacity="0.5"/>
        </>
      )}
      {icon === 'cross' && (
        <>
          <rect x="27" y="16" width="6" height="42" fill={`url(#gold-${variant})`} opacity="0.9"/>
          <rect x="14" y="30" width="32" height="6" fill={`url(#gold-${variant})`} opacity="0.9"/>
        </>
      )}
      {icon === 'veritas' && (
        <>
          <circle cx="20" cy="26" r="4" fill={`url(#gold-${variant})`}/>
          <circle cx="30" cy="20" r="4" fill={`url(#gold-${variant})`}/>
          <circle cx="40" cy="26" r="4" fill={`url(#gold-${variant})`}/>
          <path d="M18 40 L42 40 L38 58 L22 58 Z" fill={`url(#gold-${variant})`} opacity="0.7"/>
        </>
      )}
      {icon === 'book' && (
        <>
          <path d="M12 24 L30 20 L48 24 V48 L30 44 L12 48 Z" fill={`url(#gold-${variant})`} opacity="0.9"/>
          <line x1="30" y1="20" x2="30" y2="44" stroke={stops[0]} strokeWidth="1.5"/>
        </>
      )}
      {icon === 'tower' && (
        <>
          <rect x="20" y="20" width="20" height="34" fill={`url(#gold-${variant})`} opacity="0.85"/>
          <rect x="24" y="14" width="12" height="8" fill={`url(#gold-${variant})`}/>
          <rect x="27" y="30" width="6" height="10" fill={stops[0]}/>
          <rect x="16" y="52" width="28" height="6" fill={`url(#gold-${variant})`}/>
        </>
      )}
      {icon === 'tree' && (
        <>
          <circle cx="30" cy="26" r="10" fill={`url(#gold-${variant})`} opacity="0.85"/>
          <circle cx="22" cy="34" r="7" fill={`url(#gold-${variant})`} opacity="0.7"/>
          <circle cx="38" cy="34" r="7" fill={`url(#gold-${variant})`} opacity="0.7"/>
          <rect x="27" y="38" width="6" height="18" fill={`url(#gold-${variant})`} opacity="0.9"/>
        </>
      )}
      {icon === 'gears' && (
        <>
          <circle cx="30" cy="32" r="14" fill="none" stroke={`url(#gold-${variant})`} strokeWidth="2"/>
          <circle cx="30" cy="32" r="6" fill={`url(#gold-${variant})`}/>
          <rect x="28" y="12" width="4" height="10" fill={`url(#gold-${variant})`}/>
          <rect x="28" y="42" width="4" height="10" fill={`url(#gold-${variant})`}/>
          <rect x="12" y="30" width="10" height="4" fill={`url(#gold-${variant})`}/>
          <rect x="38" y="30" width="10" height="4" fill={`url(#gold-${variant})`}/>
        </>
      )}
      {icon === 'sun' && (
        <>
          <circle cx="30" cy="30" r="9" fill={`url(#gold-${variant})`}/>
          {[0,45,90,135,180,225,270,315].map(a => (
            <rect key={a} x="29" y="12" width="2" height="8" fill={`url(#gold-${variant})`} transform={`rotate(${a} 30 30)`}/>
          ))}
          <path d="M18 50 L42 50 L38 62 L22 62 Z" fill={`url(#gold-${variant})`} opacity="0.7"/>
        </>
      )}
      {icon === 'chevron' && (
        <>
          <path d="M14 26 L30 18 L46 26 L30 34 Z" fill={`url(#gold-${variant})`}/>
          <path d="M14 40 L30 32 L46 40 L30 48 Z" fill={`url(#gold-${variant})`} opacity="0.7"/>
          <path d="M14 54 L30 46 L46 54 L30 62 Z" fill={`url(#gold-${variant})`} opacity="0.5"/>
        </>
      )}
    </svg>
  )
}

function CrestTile({ crest }) {
  return (
    <div className="group shrink-0 flex flex-col items-center rounded-2xl border border-white/8 bg-black/40 hover:bg-white/[0.04] hover:border-[#D4AF37]/40 transition p-4 md:p-5 min-w-[220px] md:min-w-[240px]">
      <div className="flex items-center gap-3">
        <CrestSVG variant={crest.variant} icon={crest.icon}/>
        <div className="min-w-0">
          {crest.serifName ? (
            <>
              <p className="font-serif italic text-2xl text-white leading-tight">{crest.line2}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60 mt-0.5">UNIVERSITY</p>
            </>
          ) : (
            <>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37]/80 leading-tight">{crest.line1}</p>
              <p className="mt-0.5 font-semibold tracking-tight text-white leading-tight text-sm md:text-base">{crest.line2}</p>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-[#D4AF37]">{crest.caption}</p>
    </div>
  )
}

export default function UniversityMarquee({ compact = false }) {
  const doubled = [...CRESTS, ...CRESTS]
  const reversed = [...CRESTS].reverse()
  const doubledReversed = [...reversed, ...reversed]

  if (compact) {
    return (
      <div className="relative fade-x mt-6">
        <div className="flex gap-3 animate-marquee w-max py-2">
          {doubled.map((l, i) => (<CrestTile key={`c-${i}`} crest={l}/>))}
        </div>
      </div>
    )
  }

  return (
    <section className="relative py-8 md:py-10">
      <div className="relative fade-x">
        <div className="flex gap-4 animate-marquee w-max py-3">
          {doubled.map((l, i) => (<CrestTile key={`a-${i}`} crest={l}/>))}
        </div>
      </div>
      <div className="relative fade-x mt-4">
        <div className="flex gap-4 animate-marquee-reverse w-max py-3">
          {doubledReversed.map((l, i) => (<CrestTile key={`b-${i}`} crest={l}/>))}
        </div>
      </div>
    </section>
  )
}
