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
  BadgeCheck, Zap, User2, ExternalLink, MousePointer2, ChevronDown, Sparkles
} from 'lucide-react'

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
          {/* Floating ornament cards — 2 left, 2 right */}
          <div className="pointer-events-none absolute left-2 lg:left-8 top-[16%] hidden md:block">
            <OrnamentCard icon={<GraduationCap className="h-5 w-5 text-[#D4AF37]"/>} title="Verified" subtitle="Opportunities"/>
          </div>
          <div className="pointer-events-none absolute right-2 lg:right-8 top-[16%] hidden md:block">
            <OrnamentCard icon={<Globe2 className="h-5 w-5 text-[#D4AF37]"/>} title="Global" subtitle="Scholarships" style={{ animationDelay: '1s' }}/>
          </div>
          <div className="pointer-events-none absolute left-2 lg:left-8 top-[64%] hidden md:block">
            <OrnamentCard icon={<Award className="h-5 w-5 text-[#D4AF37]"/>} title="Real" subtitle="Success Stories" style={{ animationDelay: '2s' }}/>
          </div>
          <div className="pointer-events-none absolute right-2 lg:right-8 top-[64%] hidden md:block">
            <OrnamentCard icon={<ShieldCheck className="h-5 w-5 text-[#D4AF37]"/>} title="Trusted" subtitle="& Secure" style={{ animationDelay: '0.5s' }}/>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.035em] leading-[0.95] text-white">
              Find real <span className="text-gold-hi">scholarships</span>
              <br className="hidden md:block"/> that fit your profile.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
              AI-powered, source-linked scholarship shortlist. Real records only. No spam. No fake promises.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="btn-gold btn-pill px-8 h-12 text-base font-semibold animate-gold-pulse">
                  Check My Scholarships <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[#D4AF37]"/> 100% Free</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#D4AF37]"/> Takes 2 Minutes</span>
              <span className="inline-flex items-center gap-1.5"><User2 className="h-4 w-4 text-[#D4AF37]"/> Personalized for You</span>
            </div>
          </div>

          {/* Trust divider */}
          <div className="mt-16 md:mt-20">
            <div className="flex items-center gap-4 max-w-3xl mx-auto">
              <div className="h-px flex-1 divider-gold"/>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/80">Trusted by students around the world</p>
              <div className="h-px flex-1 divider-gold"/>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" id="universities">
              {CRESTS.map(c => <CrestTile key={c.name} crest={c}/>)}
            </div>
          </div>

          {/* Scroll cue */}
          <div className="mt-14 flex items-center justify-center gap-2 text-xs text-white/40">
            <MousePointer2 className="h-3.5 w-3.5"/> Scroll to explore <ChevronDown className="h-3.5 w-3.5 animate-bounce"/>
          </div>
        </div>
      </section>

      {/* ================ FEATURE 1 — Match ================ */}
      <FeatureBlock
        kicker="Match"
        title="Ranked shortlist with fit reasoning."
        body="Your profile is compared to every record in our source-linked database. Each result carries a fit score, requirements you already meet, gaps to prepare, and the official source URL."
        ctaLabel="Start matching"
        ctaHref="/onboarding"
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

      {/* ================ FEATURE 3 — Database ================ */}
      <FeatureBlock
        kicker="Database"
        title="Every record links to an official source."
        body="No invented scholarships, deadlines, or funding amounts. If a detail is missing, we say 'Check official source.' You apply directly through the university or government portal."
        ctaLabel="Browse database"
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
            <Link href="/onboarding">
              <Button size="lg" className="btn-gold btn-pill px-8 h-12 text-base font-semibold">
                Check My Scholarships <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ==================== helpers ==================== */

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
        <p className="mt-1 text-sm text-white leading-relaxed">Note that DAAD EPOS courses each have their own deadline. I'd start with the WASCAL and SEPT programs — both accept IELTS 6.5+.</p>
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
