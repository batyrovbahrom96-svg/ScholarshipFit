'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { store } from '@/lib/client-store'
import UniversityMarquee from '@/components/site/UniversityMarquee'
import {
  ArrowRight, ArrowUpRight, Sparkles, ShieldCheck, GraduationCap, Globe2, Award, ExternalLink, XCircle
} from 'lucide-react'

function Home() {
  const router = useRouter()
  const [scholars, setScholars] = useState([])
  useEffect(() => { fetch('/api/scholarships').then(r=>r.json()).then(d => setScholars(d.scholarships || [])) }, [])

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      {/* ================ HERO — minimal ================ */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0" />
        <div className="container mx-auto max-w-6xl px-4 pt-24 pb-16 md:pt-32 md:pb-24 relative">
          {/* Subtle floating icons */}
          <div className="pointer-events-none absolute left-[10%] top-[30%] hidden md:block">
            <FloatingIcon rotate="-8deg"><GraduationCap className="h-6 w-6 text-white/80"/></FloatingIcon>
          </div>
          <div className="pointer-events-none absolute right-[10%] top-[26%] hidden md:block">
            <FloatingIcon delay="1s" rotate="12deg" tint="cyan"><Globe2 className="h-6 w-6 text-white/80"/></FloatingIcon>
          </div>
          <div className="pointer-events-none absolute left-[14%] top-[70%] hidden lg:block">
            <FloatingIcon delay="2s" rotate="-14deg" tint="pink"><Award className="h-6 w-6 text-white/80"/></FloatingIcon>
          </div>
          <div className="pointer-events-none absolute right-[13%] top-[70%] hidden lg:block">
            <FloatingIcon delay="0.8s" rotate="10deg" tint="orange"><ShieldCheck className="h-6 w-6 text-white/80"/></FloatingIcon>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.035em] leading-[0.95] text-white">
              Find <span className="text-gradient-warm">real scholarships</span>
              <br className="hidden md:block"/> that fit your profile.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
              AI-powered, source-linked scholarship shortlist. Real records only.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="bg-white hover:bg-white/90 text-[#060608] btn-pill px-8 h-12 text-base font-medium">
                  Check My Scholarships <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================ Trust bar ================ */}
      <section className="relative pt-4 pb-4">
        <p className="text-center text-sm text-white/40">Relied on by international students applying to</p>
        <UniversityMarquee compact />
      </section>

      {/* ================ Feature 1 — Match ================ */}
      <FeatureBlock
        kicker="Match"
        title="Ranked shortlist with fit reasoning."
        body="Your profile is compared to every record in our source-linked database. Each result carries a fit score, requirements you already meet, gaps to prepare, and the official source URL."
        ctaLabel="Start matching"
        ctaHref="/onboarding"
      >
        <MockMatchCard/>
      </FeatureBlock>

      {/* ================ Feature 2 — Advisor ================ */}
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

      {/* ================ Feature 3 — Database ================ */}
      <FeatureBlock
        kicker="Database"
        title="Every record links to an official source."
        body="No invented scholarships, deadlines, or funding amounts. If a detail is missing, we say 'Check official source.' You apply directly through the university or government portal."
        ctaLabel="Browse database"
        ctaHref="/database"
      >
        <MockDatabase scholars={scholars}/>
      </FeatureBlock>

      {/* ================ Feature 4 — Cabinet ================ */}
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

      {/* ================ Honest boundaries — one line strip ================ */}
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] px-6 py-8 md:py-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-medium">Honest by design</p>
          <p className="mt-3 text-xl md:text-2xl font-medium text-white tracking-tight max-w-3xl mx-auto">
            No invented scholarships. No fake deadlines. No guaranteed outcomes. Users apply directly on official provider websites.
          </p>
        </div>
      </section>

      {/* ================ Final CTA ================ */}
      <section className="container mx-auto max-w-5xl px-4 pb-24">
        <div className="relative rounded-3xl border border-white/10 bg-[#0A0A0F] px-6 py-16 md:py-20 text-center overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl"/>
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"/>
          <h2 className="relative text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
            Ready to see <span className="text-gradient-warm">your shortlist?</span>
          </h2>
          <div className="relative mt-6 flex justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-white hover:bg-white/90 text-[#060608] btn-pill px-8 h-12 text-base font-medium">
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
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-medium">{kicker}</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-white">{title}</h2>
          <p className="mt-5 text-lg text-white/60 leading-relaxed">{body}</p>
          <Link href={ctaHref}>
            <Button className="mt-6 bg-white hover:bg-white/90 text-[#060608] btn-pill px-5 font-medium">
              {ctaLabel} <ArrowUpRight className="ml-1.5 h-4 w-4"/>
            </Button>
          </Link>
        </div>
        <div className="md:col-span-7">
          <div className="relative rounded-3xl border border-white/8 bg-gradient-to-br from-[#0F0F16] to-[#08080C] p-6 md:p-8 min-h-[320px] flex items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl"/>
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl"/>
            <div className="relative w-full">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FloatingIcon({ children, delay='0s', rotate='0deg', tint }) {
  const tints = {
    cyan: 'bg-gradient-to-br from-cyan-500/20 to-cyan-800/20 border-cyan-400/20',
    pink: 'bg-gradient-to-br from-pink-500/20 to-pink-800/20 border-pink-400/20',
    orange: 'bg-gradient-to-br from-orange-500/20 to-orange-800/20 border-orange-400/20',
    default: 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10',
  }
  const cls = tints[tint] || tints.default
  return (
    <div className={`animate-float rounded-2xl border ${cls} p-3 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]`} style={{ animationDelay: delay, transform: `rotate(${rotate})` }}>
      {children}
    </div>
  )
}

/* ---- larger, richer mocks (single per section) ---- */

function MockMatchCard() {
  return (
    <div className="max-w-md mx-auto rounded-2xl bg-white/[0.04] border border-white/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/40">Türkiye · Full funding</p>
          <p className="mt-1 text-lg font-semibold text-white">Türkiye Scholarships</p>
          <p className="text-xs text-white/50">Republic of Türkiye · government</p>
        </div>
        <div className="h-14 w-14 rounded-full bg-white text-[#060608] flex items-center justify-center text-lg font-bold">92</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-500/25 text-[11px] px-2.5 py-0.5">Source-linked</span>
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
      <div className="self-start rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-cyan-300">Nova</p>
        <p className="mt-1 text-sm text-white leading-relaxed">Two strong source-linked options: <b>DAAD EPOS</b> (full funding for postgraduate courses; requires 2+ years relevant work experience and DAC-list nationality) and <b>Stipendium Hungaricum</b> for engineering. Deadlines vary — check official sources.</p>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-white text-[#060608] px-4 py-2.5 text-sm font-medium">Full funding · Germany · engineering, IELTS 7.0?</div>
      </div>
      <div className="self-start rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-cyan-300">Nova</p>
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
        <div key={s.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{s.country}</p>
          <p className="mt-1 text-sm font-semibold text-white line-clamp-2 leading-snug">{s.university_name}</p>
          <p className="mt-1 text-xs text-white/50 line-clamp-2">{s.scholarship_name}</p>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-cyan-300"><ExternalLink className="h-3 w-3"/>Official source</div>
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
          <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">{s.n}</p>
            <p className="mt-1 text-xl font-semibold text-white">{s.c}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Document checklist</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Passport','Transcript','Motivation letter','References','CV'].map((d,i)=>(
            <span key={i} className="rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-200 text-[10px] px-2 py-0.5">{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
