'use client'
import { useEffect, useRef, useState } from 'react'

// Real university logos via a 3-tier fallback strategy:
//   1) Local static PNGs (/public/logos/{key}.png) — highest quality, no external calls
//   2) /api/logo server proxy (chain: Clearbit -> icon.horse -> DDG -> Google Favicon)
//   3) Decorative heraldic SVG crest (guaranteed non-broken tile)

const UNIS = [
  { name: 'Harvard',    caption: 'Harvard',   line1: 'HARVARD',       line2: 'UNIVERSITY',    variant: 'crimson', domain: 'harvard.edu',   logo: 'harvard' },
  { name: 'Yale',       caption: 'Yale',      line1: '',              line2: 'Yale',          variant: 'yale', serifName: true, domain: 'yale.edu',   logo: 'yale' },
  { name: 'Princeton',  caption: 'Princeton', line1: 'PRINCETON',     line2: 'UNIVERSITY',    variant: 'orange',  domain: 'princeton.edu', logo: 'princeton' },
  { name: 'Columbia',   caption: 'Columbia',  line1: 'COLUMBIA',      line2: 'UNIVERSITY',    variant: 'columbia', domain: 'columbia.edu', logo: 'columbia' },
  { name: 'Penn',       caption: 'Penn',      line1: 'UNIVERSITY OF', line2: 'PENNSYLVANIA',  variant: 'penn',    domain: 'upenn.edu',     logo: 'upenn' },
  { name: 'Brown',      caption: 'Brown',     line1: 'BROWN',         line2: 'UNIVERSITY',    variant: 'brown',   domain: 'brown.edu',     logo: 'brown' },
  { name: 'Dartmouth',  caption: 'Dartmouth', line1: 'DARTMOUTH',     line2: 'COLLEGE',       variant: 'dart',    domain: 'dartmouth.edu', logo: 'dartmouth' },
  { name: 'Cornell',    caption: 'Cornell',   line1: 'CORNELL',       line2: 'UNIVERSITY',    variant: 'cornell', domain: 'cornell.edu',   logo: 'cornell' },
  { name: 'Stanford',   caption: 'Stanford',  line1: 'STANFORD',      line2: 'UNIVERSITY',    variant: 'cardinal',domain: 'stanford.edu',  logo: 'stanford' },
  { name: 'MIT',        caption: 'MIT',       line1: 'MASSACHUSETTS INSTITUTE', line2: 'OF TECHNOLOGY', variant: 'mit', domain: 'mit.edu', logo: 'mit' },
  { name: 'Oxford',     caption: 'Oxford',    line1: 'UNIVERSITY OF', line2: 'OXFORD',        variant: 'navy',    domain: 'ox.ac.uk',      logo: 'oxford' },
  { name: 'Cambridge',  caption: 'Cambridge', line1: 'UNIVERSITY OF', line2: 'CAMBRIDGE',     variant: 'red',     domain: 'cam.ac.uk',     logo: 'cambridge' },
  { name: 'Imperial',   caption: 'Imperial',  line1: 'IMPERIAL COLLEGE', line2: 'LONDON',     variant: 'imperial',domain: 'imperial.ac.uk',logo: 'imperial' },
  { name: 'ETH Zürich', caption: 'ETH Zürich', line1: 'EIDGENÖSSISCHE',  line2: 'TECHNISCHE HOCHSCHULE', variant: 'eth', domain: 'ethz.ch', logo: 'ethz' },
  { name: 'NUS',        caption: 'NUS Singapore', line1: 'NATIONAL UNIVERSITY OF', line2: 'SINGAPORE', variant: 'nus', domain: 'nus.edu.sg', logo: 'nus' },
]

// Local static high-quality logos live under /public/logos/{key}.png
// If a local asset ever fails, we fall back to the multi-provider server proxy
// (/api/logo) which chains Clearbit -> icon.horse -> DuckDuckGo -> Google Favicon.
const staticLogoUrl = (key) => `/logos/${key}.png`
const proxyUrl = (domain) => `/api/logo?domain=${encodeURIComponent(domain)}&sz=256`

const PALETTE = {
  navy: ['#0F1B4C', '#1E2E7C'], red: ['#5A0F1A', '#8B1A2B'], crimson: ['#7A0019', '#A50034'],
  yale: ['#0F4C81', '#1A6BB5'], orange: ['#3E1F0A', '#7A3E10'], cardinal: ['#5C0016', '#8C1515'],
  mit: ['#0F1B26', '#243447'], columbia: ['#0F4A8A', '#1D71C1'], penn: ['#12172E', '#1F2560'],
  brown: ['#3B1F0F', '#6B3E1E'], dart: ['#0F3B26', '#1E6B47'], cornell: ['#5C0016', '#B31B1B'],
  imperial: ['#0F1220', '#1E2340'], eth: ['#0F2340', '#215C9E'], nus: ['#0F2340', '#F58020'],
}

function FallbackCrest({ variant }) {
  const stops = PALETTE[variant] || ['#111', '#222']
  return (
    <svg viewBox="0 0 60 74" className="h-14 w-11 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`fbg-${variant}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={stops[0]}/><stop offset="1" stopColor={stops[1]}/></linearGradient>
        <linearGradient id={`fgold-${variant}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5D67B"/><stop offset="1" stopColor="#A88526"/></linearGradient>
      </defs>
      <path d="M30 2 L56 8 V38 C56 55 44 68 30 72 C16 68 4 55 4 38 V8 Z" fill={`url(#fbg-${variant})`} stroke={`url(#fgold-${variant})`} strokeWidth="1.6"/>
      <path d="M14 22 L30 14 L46 22 L30 30 Z" fill={`url(#fgold-${variant})`} opacity="0.85"/>
      <rect x="27" y="34" width="6" height="26" rx="1" fill={`url(#fgold-${variant})`} opacity="0.6"/>
      <circle cx="30" cy="32" r="2.2" fill="#F5D67B"/>
    </svg>
  )
}

function CrestTile({ uni }) {
  // 0 = local /logos/{key}.png (fast, no external calls, always same quality)
  // 1 = heraldic SVG crest (guaranteed on-brand, never fetches third-party favicons)
  //
  // NOTE: We deliberately skip third-party favicon proxies (Clearbit / icon.horse /
  // DDG / Google) because some university sites run Drupal (e.g. ox.ac.uk) and
  // return the Drupal CMS teardrop as their favicon — that would render the wrong
  // logo on our site. Better to show a clean branded crest than a wrong logo.
  const [tier, setTier] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef(null)
  const src = staticLogoUrl(uni.logo)
  const showCrest = tier >= 1
  const bumpTier = () => { setLoaded(false); setTier(t => t + 1) }

  // If image was already cached and completed loading before React attached
  // the onLoad handler, verify natural size manually on mount / tier change.
  useEffect(() => {
    const img = imgRef.current
    if (!img || showCrest) return
    if (img.complete) {
      if (img.naturalWidth > 1 && img.naturalHeight > 1) setLoaded(true)
      else bumpTier()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier])

  return (
    <div className="group shrink-0 flex flex-col items-center rounded-2xl border border-white/8 bg-black/40 hover:bg-white/[0.04] hover:border-[#D4AF37]/40 transition p-4 md:p-5 min-w-[240px] md:min-w-[260px]">
      <div className="flex items-center gap-4">
        {showCrest ? (
          <FallbackCrest variant={uni.variant}/>
        ) : (
          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white ring-1 ring-[#D4AF37]/40 flex items-center justify-center p-2">
            {!loaded && <div className="absolute inset-0 animate-pulse bg-white/10"/>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={`${uni.logo}-${tier}`}
              src={src}
              alt={`${uni.name} logo`}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                  bumpTier()
                } else {
                  setLoaded(true)
                }
              }}
              onError={bumpTier}
              className={`h-full w-full object-contain transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        )}
        <div className="min-w-0">
          {uni.serifName ? (
            <>
              <p className="font-serif italic text-2xl text-white leading-tight">{uni.line2}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60 mt-0.5">UNIVERSITY</p>
            </>
          ) : (
            <>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37]/80 leading-tight">{uni.line1}</p>
              <p className="mt-0.5 font-semibold tracking-tight text-white leading-tight text-sm md:text-base">{uni.line2}</p>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-[#D4AF37]">{uni.caption}</p>
    </div>
  )
}

export default function UniversityMarquee({ compact = false }) {
  const doubled = [...UNIS, ...UNIS]
  const reversed = [...UNIS].reverse()
  const doubledReversed = [...reversed, ...reversed]

  if (compact) {
    return (
      <div className="relative fade-x mt-6">
        <div className="flex gap-3 animate-marquee w-max py-2">
          {doubled.map((l, i) => (<CrestTile key={`c-${i}`} uni={l}/>))}
        </div>
      </div>
    )
  }

  return (
    <section className="relative py-8 md:py-10">
      <div className="relative fade-x">
        <div className="flex gap-4 animate-marquee w-max py-3">
          {doubled.map((l, i) => (<CrestTile key={`a-${i}`} uni={l}/>))}
        </div>
      </div>
      <div className="relative fade-x mt-4">
        <div className="flex gap-4 animate-marquee-reverse w-max py-3">
          {doubledReversed.map((l, i) => (<CrestTile key={`b-${i}`} uni={l}/>))}
        </div>
      </div>
    </section>
  )
}
