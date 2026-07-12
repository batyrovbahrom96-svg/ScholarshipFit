'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { store } from '@/lib/client-store'
import {
  ArrowRight, ArrowUpRight, GraduationCap, Globe2, Award, ShieldCheck,
  BadgeCheck, Zap, User2, ExternalLink, MousePointer2, ChevronDown, Sparkles,
  Clock, X as XIcon, Check as CheckIcon,
} from 'lucide-react'
import UniversityMarquee from '@/components/site/UniversityMarquee'
import Hero3DObjects from '@/components/site/Hero3DObjects'
import HeroSearch from '@/components/site/HeroSearch'
import BottomCTA from '@/components/site/BottomCTA'
import PricingPreview from '@/components/site/PricingPreview'
import TestimonialWall from '@/components/site/TestimonialWall'
import OutcomesPreview from '@/components/site/OutcomesPreview'
import FounderVideo from '@/components/site/FounderVideo'
import ProofStats from '@/components/site/ProofStats'
import ProductDemoPreview from '@/components/site/ProductDemoPreview'

/* ============ decorative info card (floating around hero) ============ */
function OrnamentCard({ icon, title, subtitle, className='', style }) {
  return (
    <div className={`animate-float rounded-2xl border border-[#D4AF37]/25 bg-black/60 backdrop-blur-sm px-4 py-3.5 text-center ring-gold-soft ${className}`} style={style}>
      <div className="mx-auto h-9 w-9 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-b from-white/[0.05] to-white/[0.01] flex items-center justify-center">
        {icon}
      </div>
      <p className="mt-2 text-[11px] leading-tight text-white/85 max-w-[110px] mx-auto">{title}<br/><span className="text-white/85">{subtitle}</span></p>
    </div>
  )
}

/* ============ university crest tile ============ */
const CRESTS = [
  { name: 'Oxford',    line1: 'UNIVERSITY OF', line2: 'OXFORD',    accent: 'navy' },
  { name: 'Cambridge', line1: 'UNIVERSITY OF', line2: 'CAMBRIDGE', accent: 'red' },
  { name: 'Harvard',   line1: 'HARVARD',       line2: 'UNIVERSITY',accent: 'crimson' },
  { name: 'Yale',      line1: '',              line2: 'Yale',      accent: 'yale', serifName: true },
  { name: 'Princeton', line1: 'PRINCETON',     line2: 'UNIVERSITY',accent: 'orange' },
]

function CrestSVG({ variant }) {
  // Simple shield with subtle gold accent — decorative, not official trademarks
  const stops = {
    navy: ['#0F1B4C', '#1E2E7C'],
    red: ['#5A0F1A', '#8B1A2B'],
    crimson: ['#7A0019', '#A50034'],
    yale: ['#0F4C81', '#1A6BB5'],
    orange: ['#3E1F0A', '#7A3E10'],
  }[variant] || ['#111', '#222']
  return (
    <svg viewBox="0 0 60 72" className="h-14 w-11 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stops[0]}/>
          <stop offset="1" stopColor={stops[1]}/>
        </linearGradient>
        <linearGradient id={`gold-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5D67B"/>
          <stop offset="1" stopColor="#A88526"/>
        </linearGradient>
      </defs>
      {/* Shield */}
      <path d="M30 2 L56 8 V38 C56 54 44 66 30 70 C16 66 4 54 4 38 V8 Z"
            fill={`url(#g-${variant})`} stroke={`url(#gold-${variant})`} strokeWidth="1.5"/>
      {/* Inner chevron / cross detail */}
      <path d="M12 22 L30 14 L48 22 L30 30 Z" fill={`url(#gold-${variant})`} opacity="0.85"/>
      <rect x="27" y="34" width="6" height="26" rx="1" fill={`url(#gold-${variant})`} opacity="0.6"/>
      <circle cx="30" cy="32" r="2.2" fill="#F5D67B"/>
    </svg>
  )
}

function CrestTile({ crest }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#D4AF37]/30 transition p-4 md:p-5 min-w-[190px]">
      <CrestSVG variant={crest.accent}/>
      <div className="min-w-0">
        {crest.serifName ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">&nbsp;</p>
            <p className="font-serif italic text-xl text-white leading-tight">{crest.line2}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-0.5">UNIVERSITY</p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80">{crest.line1}</p>
            <p className="font-semibold tracking-tight text-white leading-tight">{crest.line2}</p>
          </>
        )}
      </div>
    </div>
  )
}

/* =========================================================================== */

function Home() {
  const router = useRouter()
  const [scholars, setScholars] = useState([])
  useEffect(() => { fetch('/api/scholarships').then(r=>r.json()).then(d => setScholars(d.scholarships || [])) }, [])

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      {/* ================ HERO ================ */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0" />
        <div className="cosmos-dots cosmos-drift pointer-events-none absolute inset-0 -z-0" aria-hidden/>

        {/* Faint orbital lines behind hero (SVG) */}
        <svg className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[900px] w-[1400px] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <linearGradient id="orb" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D4AF37" stopOpacity="0"/>
              <stop offset="0.5" stopColor="#D4AF37" stopOpacity="0.6"/>
              <stop offset="1" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <ellipse cx="700" cy="450" rx="620" ry="180" stroke="url(#orb)" strokeWidth="1"/>
          <ellipse cx="700" cy="450" rx="520" ry="150" stroke="url(#orb)" strokeWidth="1" opacity="0.7"/>
          <ellipse cx="700" cy="450" rx="420" ry="120" stroke="url(#orb)" strokeWidth="1" opacity="0.5"/>
        </svg>

        <div className="container mx-auto max-w-6xl px-4 pt-12 pb-14 md:pt-16 md:pb-20 relative">
          <div className="relative">
            {/* Floating 3D-style decorative objects around the hero title */}
            <Hero3DObjects />

            <div className="relative mx-auto max-w-3xl text-center py-8 md:py-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                <Sparkles className="h-3 w-3"/> AI Scholarship Command Center
              </div>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.035em] leading-[0.95] text-white">
                Find <span className="text-gold-hi">scholarships</span> that
                <br className="hidden md:block"/> fit your profile.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-white/70 leading-relaxed">
                ScholarshipFit uses AI-assisted research to organize <b className="text-white">800+ hand-verified, premium scholarships</b> by <b className="text-white">fit</b>, <b className="text-white">funding</b>, <b className="text-white">deadlines</b>, and <b className="text-white">missing requirements</b> — so you stop wasting hours on the wrong ones.
              </p>

              {/* Quality-over-quantity pill */}
              <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/70">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Hand-verified</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1">No dead links</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1">No aggregator spam</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[#E7C766]">Every listing sourced from the official provider</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/quiz">
                  <Button size="lg" className="btn-gold btn-pill h-12 px-8 text-base font-semibold">
                    Find My Scholarship Matches <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </Link>
                <Link href="/sample-report">
                  <Button size="lg" variant="outline" className="border-white/25 text-white/85 hover:bg-white/10 hover:text-white h-12 px-6">
                    View Sample Report
                  </Button>
                </Link>
              </div>

              <p className="mx-auto mt-6 max-w-xl text-[11px] text-white/40 leading-relaxed">
                Official source links included · No guaranteed outcomes · Users apply through official provider websites · AI-assisted research, not automated applications
              </p>
            </div>
          </div>

          {/* Trust divider + Scrolling 15-university crest marquee */}
          <div className="mt-16 md:mt-20" id="universities">
            <div className="flex items-center gap-4 max-w-3xl mx-auto">
              <div className="h-px flex-1 divider-gold"/>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/80">Trusted by students around the world</p>
              <div className="h-px flex-1 divider-gold"/>
            </div>
            <UniversityMarquee />
          </div>

          {/* Scroll cue */}
          <div className="mt-14 flex items-center justify-center gap-2 text-xs text-white/40">
            <MousePointer2 className="h-3.5 w-3.5"/> Scroll to explore <ChevronDown className="h-3.5 w-3.5 animate-bounce"/>
          </div>
        </div>
      </section>

      {/* ================ PRODUCT DEMO PREVIEW (Notion-style) ================ */}
      <ProductDemoPreview />

      {/* ================ QUALITY > QUANTITY promise ================ */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37]">Quality over quantity</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Not <span className="text-white/40 line-through">40,000 scholarships</span>. <br className="hidden md:block"/>
              <span className="text-gold-hi">800+ ones worth applying to.</span>
            </h2>
            <p className="mt-4 text-white/60 leading-relaxed">
              Aggregators brag about size. We brag about signal. Every scholarship on ScholarshipFit is <span className="text-white font-medium">hand-verified against the official provider website</span> — with real deadlines, real funding, and a working URL.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
            {/* THEM */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-[11px] uppercase tracking-widest text-red-300">
                Typical aggregators
              </div>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0"/> &ldquo;40,000+ scholarships&rdquo; — most expired, duplicated, or fake</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0"/> Broken redirect links that dead-end on landing pages</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0"/> Recycled scam listings that ask for &ldquo;application fees&rdquo;</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0"/> No fit signal — you sift through 90% junk to find 1 match</li>
              </ul>
            </div>

            {/* US */}
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/8 to-transparent p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#E7C766]">
                ScholarshipFit
              </div>
              <ul className="space-y-3 text-sm text-white/85">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"/> 800+ hand-verified premium scholarships — every one worth applying to</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"/> Every listing sourced from the <span className="text-white">official provider</span> URL</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"/> No dead links, no aggregator middlemen, no application fees</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"/> Deterministic fit engine ranks them against <span className="text-white">your</span> profile</li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/40 max-w-xl mx-auto">
            Prefer 800 real opportunities over 40,000 dead links. Your time is worth more than the count.
          </p>
        </div>
      </section>

      {/* ================ HOW IT WORKS — 4 steps ================ */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37]">How ScholarshipFit works</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              From profile to source-linked shortlist in minutes.
            </h2>
            <p className="mt-3 text-white/60">
              You don&apos;t need to search from zero. ScholarshipFit is the AI research layer sitting on top of a curated, source-linked scholarship library.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { n: '01', title: 'Tell us your profile', body: 'Country, degree level, field, budget, test scores, achievements, target intake.' },
              { n: '02', title: 'AI analyzes fit', body: 'We compare your profile against source-linked scholarship opportunities.' },
              { n: '03', title: 'Get ranked matches', body: 'Strong fit · Possible fit · Weak fit — with missing requirements flagged.' },
              { n: '04', title: 'Apply through official sources', body: 'Official links · document checklists · deadline notes · clear next steps.' },
            ].map(s => (
              <div key={s.n} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-[#D4AF37]/30 transition-colors">
                <div className="text-4xl font-semibold text-[#D4AF37]/80 leading-none mb-4">{s.n}</div>
                <div className="text-white font-medium">{s.title}</div>
                <div className="mt-2 text-sm text-white/60 leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/quiz">
              <Button size="lg" className="btn-gold btn-pill h-12 px-8 font-semibold">
                Find My Scholarship Matches <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================ FEATURE 1 — Match ================ */}
      <FeatureBlock
        kicker="Match"
        title="Ranked shortlist with fit reasoning."
        body="Answer 8 quick questions — education level, field, nationality, destinations, GPA, English scores, work experience, timeline, and funding preference. We instantly rank 800+ hand-verified, premium scholarships against your profile and show fit score, matched requirements, gaps, warnings, and the official source URL. No dead links, no aggregator spam."
        ctaLabel="Start matching"
        ctaHref="/quiz"
      >
        <MockMatchCard/>
      </FeatureBlock>

      {/* ================ FEATURE 2 — Advisor ================ */}
      <FeatureBlock
        kicker="Advisor"
        reversed
        title="Chat with Nova — Claude Sonnet 4.5."
        body="Ask in plain language. Nova only references scholarships from our verified database and always links out to the official provider for verification."
        ctaLabel="Ask Nova"
        ctaHref="/advisor"
      >
        <MockAdvisor/>
      </FeatureBlock>

      {/* ================ FEATURE 3 — Library (the engine) ================ */}
      <FeatureBlock
        kicker="Source-linked library"
        title="The engine behind your matches."
        body="ScholarshipFit doesn't ask you to search from zero. Our curated source-linked scholarship library is the engine your matches are built from — every record traces back to the official provider website, so you can verify anything in one click."
        ctaLabel="Explore the library"
        ctaHref="/database"
      >
        <MockDatabase scholars={scholars}/>
      </FeatureBlock>

      {/* ================ FEATURE 4 — Cabinet ================ */}
      <FeatureBlock
        kicker="Cabinet"
        reversed
        title="A quiet dashboard, built for real applications."
        body="Track scholarships as saved, preparing, applied, shortlisted, or won. Document checklist auto-generated from your top matches. Deadline notes verified on official sources."
        ctaLabel="Open cabinet"
        ctaHref="/dashboard"
      >
        <MockCabinet/>
      </FeatureBlock>

      {/* ================ SAVE 15-30 HOURS — value stat block ================ */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 items-center">
            <div className="md:col-span-5" data-reveal>
              <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">The math</div>
              <h2 className="mt-3 text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-white">
                Save <span className="text-gold-hi">15–30 hours</span> per application cycle.
              </h2>
              <p className="mt-5 text-lg text-white/60 leading-relaxed">
                We&apos;ve timed it. That&apos;s how long students typically spend Googling scholarships, checking eligibility, chasing dead links, and rewriting the same essay for programs they didn&apos;t qualify for.
              </p>
              <p className="mt-3 text-lg text-white/60 leading-relaxed">
                ScholarshipFit collapses that into <span className="text-white font-medium">3 minutes</span> — one 8-step quiz, one ranked shortlist, one AI advisor.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/quiz">
                  <Button size="lg" className="btn-gold btn-pill h-12 px-8 font-semibold">
                    Get my shortlist in 3 minutes <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </Link>
                <Link href="/sample-report">
                  <Button size="lg" variant="outline" className="border-white/20 text-white/80 hover:bg-white/5 h-12 px-6">
                    See a sample first
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:col-span-7" data-reveal data-reveal-delay="200">
              <div className="grid grid-cols-2 gap-4">
                <StatTile big="20h" small="Avg time saved per cycle" tone="gold"/>
                <StatTile big="800+" small="Hand-verified premium scholarships" tone="cyan"/>
                <StatTile big="3 min" small="From profile to shortlist" tone="emerald"/>
                <StatTile big="60 countries" small="Where our scholarships come from" tone="gold"/>
              </div>
              <div className="mt-4 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/8 to-transparent p-5">
                <div className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Compounded value</div>
                <p className="text-white/80 leading-relaxed">
                  If you apply to 3 scholarships that fit you well, instead of 30 that don&apos;t,
                  you win the odds game. Time on wrong applications is worse than time not applying at all.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================ BEFORE / AFTER ScholarshipFit ================ */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-12" data-reveal>
            <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Before / After ScholarshipFit</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-white">
              Stop searching. Start <span className="text-gold-hi">applying to the right ones.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Before */}
            <div className="rounded-3xl border border-red-500/25 bg-red-500/[0.04] p-6 md:p-8" data-reveal data-reveal-delay="100">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-red-300 mb-4">
                <Clock className="h-4 w-4"/> Without ScholarshipFit
              </div>
              <div className="text-2xl font-semibold text-white mb-4">15–30 hours lost, zero clarity.</div>
              <ul className="space-y-3">
                {[
                  '30+ browser tabs, half of them dead links',
                  'No idea if you actually qualify — until after you spend a weekend on the essay',
                  'Deadlines discovered too late. Cycle already closed.',
                  'Same motivation letter recycled — badly — across 12 programs',
                  'Zero visibility on fit score, gaps, or realistic odds',
                  'Endless Reddit threads. Contradictory advice. Anxiety.',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-400"/>{t}
                  </li>
                ))}
              </ul>
            </div>
            {/* After */}
            <div className="rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 via-emerald-500/[0.03] to-transparent p-6 md:p-8" data-reveal data-reveal-delay="300">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-300 mb-4">
                <Sparkles className="h-4 w-4"/> With ScholarshipFit
              </div>
              <div className="text-2xl font-semibold text-white mb-4">3 minutes → shortlist → action plan.</div>
              <ul className="space-y-3">
                {[
                  'Ranked shortlist of programs that ACTUALLY fit your profile',
                  'Fit score, requirements met, gaps to close — before you write a single essay',
                  'Deadlines and eligibility validated against official source URLs',
                  'Application tracker + document checklist auto-generated from your matches',
                  'Nova AI advisor — Claude Sonnet 4.5, grounded in our source-linked library',
                  '"Why NOT fit" warnings on every match — stop wasting time on reaches',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex justify-center" data-reveal>
            <Link href="/quiz">
              <Button size="lg" className="btn-gold btn-pill h-12 px-8 font-semibold">
                Start my 8-step quiz — free <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================ REAL VIDEO OUTCOMES — verified proof ================ */}
      <OutcomesPreview />

      {/* ================ TESTIMONIAL WALL — 3-col masonry ================ */}
      <TestimonialWall />

      {/* ================ Honest strip ================ */}
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="rounded-3xl border border-[#D4AF37]/15 bg-white/[0.02] px-6 py-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Honest by design</p>
          <p className="mt-3 text-xl md:text-2xl font-medium text-white tracking-tight max-w-3xl mx-auto">
            No invented scholarships. No fake deadlines. No guaranteed outcomes. Users apply directly on official provider websites.
          </p>
        </div>
      </section>

      {/* ================ Final CTA ================ */}
      <section className="container mx-auto max-w-5xl px-4 pb-24">
        <div className="relative rounded-3xl border border-[#D4AF37]/20 bg-[#0A0A0A] px-6 py-16 md:py-20 text-center overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/15 blur-3xl"/>
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl"/>
          <h2 className="relative text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
            Ready to see <span className="text-gold-hi">your shortlist?</span>
          </h2>
          <div className="relative mt-6 flex justify-center">
            <Link href="/quiz">
              <Button size="lg" className="btn-gold btn-pill px-8 h-12 text-base font-semibold">
                Check My Scholarships <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PricingPreview />
      <ProofStats />
      {/* ================ FOUNDER WELCOME VIDEO ================ */}
      <FounderVideo />
      <BottomCTA />
      <Footer />
    </div>
  )
}

/* ==================== helpers ==================== */

function StatTile({ big, small, tone = 'gold' }) {
  const toneCls = {
    gold:    'text-[#D4AF37]',
    cyan:    'text-cyan-300',
    emerald: 'text-emerald-300',
  }[tone] || 'text-white'
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-5 md:p-6 hover:border-white/25 transition">
      <div className={`text-4xl md:text-5xl font-semibold tracking-tight ${toneCls} leading-none`}>{big}</div>
      <div className="mt-2 text-xs md:text-sm text-white/60">{small}</div>
    </div>
  )
}

function FeatureBlock({ kicker, title, body, ctaLabel, ctaHref, children, reversed }) {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className={`grid gap-10 md:gap-16 md:grid-cols-12 items-center ${reversed ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <div className="md:col-span-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">{kicker}</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-white">{title}</h2>
          <p className="mt-5 text-lg text-white/60 leading-relaxed">{body}</p>
          <Link href={ctaHref}>
            <Button className="mt-6 btn-gold btn-pill px-5 font-medium">
              {ctaLabel} <ArrowUpRight className="ml-1.5 h-4 w-4"/>
            </Button>
          </Link>
        </div>
        <div className="md:col-span-7">
          <div className="relative rounded-3xl border border-[#D4AF37]/15 bg-gradient-to-br from-[#0F0F10] to-[#08080A] p-6 md:p-8 min-h-[320px] flex items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl"/>
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-[#D4AF37]/5 blur-3xl"/>
            <div className="relative w-full">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- mocks ---- */

function MockMatchCard() {
  return (
    <div className="max-w-md mx-auto rounded-2xl bg-white/[0.04] border border-[#D4AF37]/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#D4AF37]/70">Türkiye · Full funding</p>
          <p className="mt-1 text-lg font-semibold text-white">Türkiye Scholarships</p>
          <p className="text-xs text-white/50">Republic of Türkiye · government</p>
        </div>
        <div className="h-14 w-14 rounded-full btn-gold flex items-center justify-center text-lg font-bold" style={{boxShadow:'0 0 0 1px rgba(212,175,55,0.4), 0 10px 30px -10px rgba(212,175,55,0.4)'}}>92</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#D4AF37]/15 text-[#F5D67B] border border-[#D4AF37]/30 text-[11px] px-2.5 py-0.5">Source-linked</span>
        <span className="rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/25 text-[11px] px-2.5 py-0.5">Eligible</span>
        <span className="rounded-full bg-white/5 text-white/70 border border-white/10 text-[11px] px-2.5 py-0.5">Budget: excellent</span>
        <span className="rounded-full bg-white/5 text-white/70 border border-white/10 text-[11px] px-2.5 py-0.5">Risk: low</span>
      </div>
      <p className="mt-4 text-sm text-white/70 leading-relaxed">Full funding covers tuition, monthly stipend, accommodation, and one-time airfare. Türkiye is a preferred country and GPA 3.7 clears the threshold.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/[0.03] border border-white/8 p-2.5">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Requirements met</p>
          <p className="mt-1 text-xs text-emerald-300">4 of 4</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/8 p-2.5">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Deadline</p>
          <p className="mt-1 text-xs text-white/80">Check official source</p>
        </div>
      </div>
    </div>
  )
}

function MockAdvisor() {
  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="rounded-2xl bg-white/[0.05] border border-[#D4AF37]/15 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Nova</p>
        <p className="mt-1 text-sm text-white leading-relaxed">Two strong source-linked options: <b>DAAD EPOS</b> (full funding for postgraduate courses; requires 2+ years relevant work experience) and <b>Stipendium Hungaricum</b> for engineering. Deadlines vary — check official sources.</p>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl btn-gold px-4 py-2.5 text-sm font-medium">Full funding · Germany · engineering, IELTS 7.0?</div>
      </div>
      <div className="rounded-2xl bg-white/[0.05] border border-[#D4AF37]/15 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Nova</p>
        <p className="mt-1 text-sm text-white leading-relaxed">Note that DAAD EPOS courses each have their own deadline. I&apos;d start with the WASCAL and SEPT programs — both accept IELTS 6.5+.</p>
      </div>
    </div>
  )
}

function MockDatabase({ scholars }) {
  const preview = (scholars || []).slice(0,4)
  return (
    <div className="grid grid-cols-2 gap-3">
      {preview.map(s => (
        <div key={s.id} className="rounded-2xl bg-white/[0.04] border border-[#D4AF37]/15 p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70">{s.country}</p>
          <p className="mt-1 text-sm font-semibold text-white line-clamp-2 leading-snug">{s.university_name}</p>
          <p className="mt-1 text-xs text-white/50 line-clamp-2">{s.scholarship_name}</p>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-[#F5D67B]"><ExternalLink className="h-3 w-3"/>Official source</div>
        </div>
      ))}
      {preview.length === 0 && Array.from({length:4}).map((_,i)=>(<div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 animate-pulse h-24"/>))}
    </div>
  )
}

function MockCabinet() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[{n:'Saved',c:3},{n:'Preparing',c:2},{n:'Applied',c:1},{n:'Won',c:0}].map((s,i)=>(
          <div key={i} className="rounded-xl bg-white/[0.04] border border-[#D4AF37]/15 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">{s.n}</p>
            <p className="mt-1 text-xl font-semibold text-white">{s.c}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-[#D4AF37]/15 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Document checklist</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Passport','Transcript','Motivation letter','References','CV'].map((d,i)=>(
            <span key={i} className="rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#F5D67B] text-[10px] px-2 py-0.5">{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
