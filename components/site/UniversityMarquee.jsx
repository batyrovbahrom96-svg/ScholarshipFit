'use client'
import { useState } from 'react'

// Real university logos hosted on Wikimedia Commons.
// Browsers fetch these directly (server-side is blocked by Wikimedia's UA rules,
// but client-side <img> requests work). Every tile has an <onError> fallback
// to a decorative heraldic SVG crest so the marquee never shows a broken image.

const UNIS = [
  { name: 'Harvard',    caption: 'Harvard',   line1: 'HARVARD',       line2: 'UNIVERSITY',    variant: 'crimson', domain: 'harvard.edu' },
  { name: 'Yale',       caption: 'Yale',      line1: '',              line2: 'Yale',          variant: 'yale', serifName: true, domain: 'yale.edu' },
  { name: 'Princeton',  caption: 'Princeton', line1: 'PRINCETON',     line2: 'UNIVERSITY',    variant: 'orange',  domain: 'princeton.edu' },
  { name: 'Columbia',   caption: 'Columbia',  line1: 'COLUMBIA',      line2: 'UNIVERSITY',    variant: 'columbia', domain: 'columbia.edu' },
  { name: 'Penn',       caption: 'Penn',      line1: 'UNIVERSITY OF', line2: 'PENNSYLVANIA',  variant: 'penn',    domain: 'upenn.edu' },
  { name: 'Brown',      caption: 'Brown',     line1: 'BROWN',         line2: 'UNIVERSITY',    variant: 'brown',   domain: 'brown.edu' },
  { name: 'Dartmouth',  caption: 'Dartmouth', line1: 'DARTMOUTH',     line2: 'COLLEGE',       variant: 'dart',    domain: 'dartmouth.edu' },
  { name: 'Cornell',    caption: 'Cornell',   line1: 'CORNELL',       line2: 'UNIVERSITY',    variant: 'cornell', domain: 'cornell.edu' },
  { name: 'Stanford',   caption: 'Stanford',  line1: 'STANFORD',      line2: 'UNIVERSITY',    variant: 'cardinal',domain: 'stanford.edu' },
  { name: 'MIT',        caption: 'MIT',       line1: 'MASSACHUSETTS INSTITUTE', line2: 'OF TECHNOLOGY', variant: 'mit', domain: 'mit.edu' },
  { name: 'Oxford',     caption: 'Oxford',    line1: 'UNIVERSITY OF', line2: 'OXFORD',        variant: 'navy',    domain: 'ox.ac.uk' },
  { name: 'Cambridge',  caption: 'Cambridge', line1: 'UNIVERSITY OF', line2: 'CAMBRIDGE',     variant: 'red',     domain: 'cam.ac.uk' },
  { name: 'Imperial',   caption: 'Imperial',  line1: 'IMPERIAL COLLEGE', line2: 'LONDON',     variant: 'imperial',domain: 'imperial.ac.uk' },
  { name: 'ETH Zürich', caption: 'ETH Zürich', line1: 'EIDGENÖSSISCHE',  line2: 'TECHNISCHE HOCHSCHULE', variant: 'eth', domain: 'ethz.ch' },
  { name: 'NUS',        caption: 'NUS Singapore', line1: 'NATIONAL UNIVERSITY OF', line2: 'SINGAPORE', variant: 'nus', domain: 'nus.edu.sg' },
]

// Google's favicon service — 100% CORS-friendly, returns each university's real
// brand mark hosted on their own .edu / .ac.uk / .ch / .sg domain.
const logoUrl = (domain, size=128) => `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`

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
  // We tried loading real logos from Wikipedia (server-side blocked by their UA rules)
  // and Google's favicon service (loads but returns 16-32px browser icons that render
  // blank at logo size). For 100% reliability + elite aesthetic we render bespoke
  // heraldic SVG crests colored to each university's traditional heraldry.
  return (
    <div className="group shrink-0 flex flex-col items-center rounded-2xl border border-white/8 bg-black/40 hover:bg-white/[0.04] hover:border-[#D4AF37]/40 transition p-4 md:p-5 min-w-[220px] md:min-w-[240px]">
      <div className="flex items-center gap-3">
        <FallbackCrest variant={uni.variant}/>
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
