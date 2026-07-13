'use client'

import { useEffect, useState } from 'react'
import AutoScroll from 'embla-carousel-auto-scroll'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { ShieldCheck, Sparkles } from 'lucide-react'

/*
  ================================================================
  ScholarshipProvidersMarquee — auto-scrolling logo strip.
  ----------------------------------------------------------------
  Companion to <UniversityMarquee /> — where UM shows the schools
  users can study at, this shows the OFFICIAL SCHOLARSHIP PROVIDERS
  our database is sourced from. Every provider listed here has
  at least one live scholarship in our /api/scholarships collection.

  Honest framing: NOT "trusted by" (we have no partnership deals).
  Framing: "Scholarships sourced directly from these providers."

  Logos strategy (mirrors UniversityMarquee's 3-tier fallback):
    1. Local static /public/logos/{key}.png (best quality, if present)
    2. /api/uni-logo/{key}?domain={domain} server proxy
    3. Elegant text-only badge fallback (never broken)
  ================================================================
*/

const PROVIDERS = [
  { name: 'Chevening',            key: 'chevening',       domain: 'chevening.org',              blurb: 'UK Foreign Office' },
  { name: 'DAAD',                 key: 'daad',            domain: 'daad.de',                    blurb: 'Germany · Ministry-funded' },
  { name: 'Fulbright',            key: 'fulbright',       domain: 'fulbrightonline.org',        blurb: 'US State Dept' },
  { name: 'Erasmus+',             key: 'erasmus',         domain: 'ec.europa.eu',               blurb: 'European Commission' },
  { name: 'Commonwealth',         key: 'commonwealth',    domain: 'cscuk.fcdo.gov.uk',          blurb: 'UK FCDO' },
  { name: 'MEXT',                 key: 'mext',            domain: 'studyinjapan.go.jp',         blurb: 'Japan · Ministry' },
  { name: 'Rhodes Trust',         key: 'rhodes',          domain: 'rhodeshouse.ox.ac.uk',       blurb: 'Oxford, UK' },
  { name: 'Gates Cambridge',      key: 'gates-cambridge', domain: 'gatescambridge.org',         blurb: 'Cambridge, UK' },
  { name: 'Schwarzman',           key: 'schwarzman',      domain: 'schwarzmanscholars.org',     blurb: 'Tsinghua · Beijing' },
  { name: 'Knight-Hennessy',      key: 'knight-hennessy', domain: 'knight-hennessy.stanford.edu', blurb: 'Stanford' },
  { name: 'Clarendon Fund',       key: 'clarendon',       domain: 'ox.ac.uk',                   blurb: 'Oxford, UK' },
  { name: 'Marshall',             key: 'marshall',        domain: 'marshallscholarship.org',    blurb: 'UK Government' },
  { name: 'Vanier CGS',           key: 'vanier',          domain: 'vanier.gc.ca',               blurb: 'Canada' },
  { name: 'Australia Awards',     key: 'australia-awards',domain: 'australiaawards.gov.au',     blurb: 'Australia' },
]

/* ---------- Individual logo cell with graceful fallback ---------- */
function ProviderLogo({ p }) {
  const [broken, setBroken] = useState(false)
  const src = `/api/uni-logo/${encodeURIComponent(p.key)}?domain=${encodeURIComponent(p.domain)}`
  return (
    <div
      className="group relative flex h-16 min-w-[180px] items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-5 transition-all hover:border-[#D4AF37]/30 hover:bg-white/[0.04]"
      title={`${p.name} · ${p.blurb}`}
    >
      {!broken ? (
        <img
          src={src}
          alt={`${p.name} logo`}
          onError={() => setBroken(true)}
          loading="lazy"
          className="h-8 w-auto max-w-[70px] object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
        />
      ) : (
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-amber-800/10 ring-1 ring-[#D4AF37]/30">
          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
        </div>
      )}
      <div className="text-left">
        <div className="text-[13px] font-semibold text-white/85 group-hover:text-white transition-colors">
          {p.name}
        </div>
        <div className="text-[10px] text-white/40 truncate">{p.blurb}</div>
      </div>
    </div>
  )
}

/* ---------- Section ---------- */
export default function ScholarshipProvidersMarquee() {
  // Once mounted, tell Embla to start autoplay after a beat so the carousel
  // has stable dimensions and doesn't jitter on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="relative border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#E7C766]">
            <Sparkles className="h-3 w-3" />
            Officially sourced
          </div>
          <h2 className="mt-4 text-2xl md:text-4xl font-semibold tracking-tight text-white leading-tight">
            Scholarships sourced directly from{' '}
            <span className="bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">
              official providers.
            </span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-white/55 leading-relaxed">
            Every scholarship in our database comes with a direct link to the
            official issuing body — not scraped from aggregators, not paraphrased,
            not invented. Here are just a few of the 300+ providers we track.
          </p>
        </div>

        {/* Marquee */}
        <div className="mt-10 md:mt-12">
          <div className="relative mx-auto">
            <Carousel
              opts={{ loop: true, align: 'start', dragFree: true }}
              plugins={mounted ? [AutoScroll({ playOnInit: true, speed: 0.7, stopOnInteraction: false, stopOnMouseEnter: true })] : []}
              className="w-full"
            >
              <CarouselContent className="ml-0 py-2">
                {PROVIDERS.map((p) => (
                  <CarouselItem
                    key={p.key}
                    className="basis-auto pl-3 md:pl-4"
                  >
                    <ProviderLogo p={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-[#05070A] to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-[#05070A] to-transparent"></div>
          </div>
        </div>

        {/* Honest disclosure */}
        <p className="mt-8 text-center text-[11px] text-white/35 max-w-2xl mx-auto leading-relaxed">
          ScholarshipFit is <span className="text-white/60">not affiliated with, endorsed by, or partnered with</span> any of the
          scholarship providers shown above. Logos are used for identification only.
          We simply organize their publicly-available scholarships and link back to their official application pages.
        </p>
      </div>
    </section>
  )
}
