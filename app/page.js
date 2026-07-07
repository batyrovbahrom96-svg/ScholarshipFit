'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { store } from '@/lib/client-store'
import {
  ArrowRight, ArrowUpRight, Sparkles, ShieldCheck, Link2, Calendar, Brain, CheckCircle2,
  Search, MessageSquare, FileText, GraduationCap, Globe2, DollarSign, ExternalLink,
  Award, ClipboardCheck, XCircle, ChevronRight
} from 'lucide-react'
import UniversityMarquee from '@/components/site/UniversityMarquee'

const INSTITUTIONS = [
  { name: 'University of Bologna', country: 'Italy' },
  { name: 'University of Padua', country: 'Italy' },
  { name: 'DAAD Germany', country: 'Germany' },
  { name: 'University of Toronto', country: 'Canada' },
  { name: 'University of British Columbia', country: 'Canada' },
  { name: 'Türkiye Bursları', country: 'Türkiye' },
  { name: 'Stipendium Hungaricum', country: 'Hungary' },
  { name: 'KAIST', country: 'South Korea' },
]

// Cinematic campus / library images for the rolling marquee
const CAMPUS_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1652597306870-a4a2b1b46073?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'European campus', country: 'Italy' },
  { url: 'https://images.unsplash.com/photo-1651516450498-24cd52b10a84?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'Historic quad', country: 'UK / EU' },
  { url: 'https://images.unsplash.com/photo-1651993543783-2be488cf2b7c?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'Modern faculty', country: 'Germany' },
  { url: 'https://images.unsplash.com/photo-1602128749724-64caaf117b89?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'Campus arches', country: 'Canada' },
  { url: 'https://images.unsplash.com/photo-1529431801612-df968fb9eb9c?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'Study halls', country: 'North America' },
  { url: 'https://images.unsplash.com/photo-1605364850032-e25ae0835552?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'STEM building', country: 'South Korea' },
  { url: 'https://images.unsplash.com/photo-1505488387362-48bc38155987?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'Research library', country: 'Hungary' },
  { url: 'https://images.unsplash.com/photo-1613324765334-7f4a413b8bba?crop=entropy&cs=srgb&fm=jpg&w=800&q=75', label: 'Reading room', country: 'Türkiye' },
]

function Home() {
  const router = useRouter()
  const [scholars, setScholars] = useState([])
  const [form, setForm] = useState({ current_level:'', degree_level:'', intended_major:'', preferred_countries:'', annual_budget_usd:'', gpa:'' })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/scholarships').then(r=>r.json()).then(d => setScholars(d.scholarships || []))
  }, [])

  const startMatch = () => {
    const seed = {
      ...form,
      preferred_countries: form.preferred_countries ? form.preferred_countries.split(',').map(s => s.trim()).filter(Boolean) : [],
      annual_budget_usd: form.annual_budget_usd ? Number(form.annual_budget_usd) : null,
      gpa: form.gpa ? Number(form.gpa) : null,
      gpa_scale: 4.0,
    }
    store.setProfile(seed)
    router.push('/onboarding')
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0" />
        <div className="pointer-events-none absolute inset-0 -z-0 grid-lines-dark opacity-30" />

        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16 md:pt-28 md:pb-24 relative">
          {/* Decorative floating icons */}
          <div className="pointer-events-none absolute left-[7%] top-[24%] hidden md:block">
            <FloatingIcon rotate="-8deg"><GraduationCap className="h-7 w-7 text-white/90"/></FloatingIcon>
          </div>
          <div className="pointer-events-none absolute right-[8%] top-[20%] hidden md:block">
            <FloatingIcon delay="1s" rotate="12deg" tint="cyan"><Globe2 className="h-7 w-7 text-white/90"/></FloatingIcon>
          </div>
          <div className="pointer-events-none absolute left-[11%] top-[62%] hidden lg:block">
            <FloatingIcon delay="2s" rotate="-14deg" tint="pink"><Award className="h-7 w-7 text-white/90"/></FloatingIcon>
          </div>
          <div className="pointer-events-none absolute right-[9%] top-[62%] hidden lg:block">
            <FloatingIcon delay="0.8s" rotate="10deg" tint="orange"><ShieldCheck className="h-7 w-7 text-white/90"/></FloatingIcon>
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-white/80 rounded-full px-3 py-1">
              <Sparkles className="mr-1.5 h-3 w-3 text-cyan-300" /> AI-powered · Source-linked · No invented results
            </Badge>
            <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-[-0.03em] leading-[0.98] text-white">
              Find <span className="text-gradient-warm">real scholarships</span>
              <br className="hidden md:block"/> that fit your profile.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed">
              Turn your academic profile into an AI-powered, source-linked scholarship shortlist — with fit reasoning, funding notes, deadline status, and official links to apply.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/onboarding">
                <Button size="lg" className="bg-white hover:bg-white/90 text-[#060608] btn-pill px-7 h-12 text-base font-medium">
                  Check My Scholarships <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <Link href="/sample-report">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/[0.06] btn-pill px-6 h-12 text-base">
                  View Sample Report <ArrowUpRight className="ml-1.5 h-4 w-4"/>
                </Button>
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-14">
              <p className="text-sm text-white/40">Sourced from scholarships published by</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {INSTITUTIONS.slice(0, 8).map(i => (
                  <span key={i.name} className="text-sm md:text-base font-medium text-white/50 tracking-tight">{i.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== ROLLING CAMPUS MARQUEE ============== */}
      <section className="relative py-8 md:py-14">
        <div className="text-center mb-6 px-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-medium">Studied at institutions across</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white">4 continents · 30+ countries · thousands of programs</h2>
        </div>
        <div className="relative fade-x">
          <div className="flex gap-4 animate-marquee w-max py-4">
            {[...CAMPUS_IMAGES, ...CAMPUS_IMAGES].map((img, i) => (
              <CampusCard key={i} img={img}/>
            ))}
          </div>
        </div>
        <div className="relative fade-x mt-4">
          <div className="flex gap-4 animate-marquee-reverse w-max py-4">
            {[...CAMPUS_IMAGES.slice().reverse(), ...CAMPUS_IMAGES.slice().reverse()].map((img, i) => (
              <CampusCard key={i} img={img} small/>
            ))}
          </div>
        </div>
      </section>

      {/* ============== IVY LEAGUE + PRESTIGE LOGO MARQUEE ============== */}
      <UniversityMarquee />

      {/* ============== COMMAND PANEL ============== */}
      <section className="container mx-auto max-w-5xl px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="relative">
          <div className="absolute -inset-6 -z-0 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-violet-500/20 blur-3xl opacity-70"/>
          <Card className="card-dark-lg relative rounded-3xl">
            <CardContent className="p-6 md:p-10">
              <div className="grid gap-6 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-medium">Command panel</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start your ScholarshipFit search</h3>
                  <p className="mt-2 text-sm text-white/60">Six fields. One AI shortlist. Zero fake results.</p>
                </div>
                <div className="md:col-span-8">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldSelect label="Current level" value={form.current_level} onChange={v=>upd('current_level',v)} options={['High school','Bachelor','Master','Graduate','Working professional']}/>
                    <FieldSelect label="Target degree" value={form.degree_level} onChange={v=>upd('degree_level',v)} options={['Bachelor','Master','PhD','Research program']}/>
                    <FieldInput label="Field of study" placeholder="Mechanical Engineering" value={form.intended_major} onChange={v=>upd('intended_major',v)}/>
                    <FieldInput label="Preferred countries" placeholder="Germany, Italy, Canada" value={form.preferred_countries} onChange={v=>upd('preferred_countries',v)}/>
                    <FieldInput label="Annual budget (USD)" placeholder="3000" type="number" value={form.annual_budget_usd} onChange={v=>upd('annual_budget_usd',v)}/>
                    <FieldInput label="GPA (optional)" placeholder="3.7" type="number" value={form.gpa} onChange={v=>upd('gpa',v)}/>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-white/40">Free preview. No signup required.</p>
                    <Button onClick={startMatch} className="bg-white hover:bg-white/90 text-[#060608] btn-pill px-6 h-11 font-medium">
                      Find My Matches <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============== SECTION HEADER — features ============== */}
      <section className="container mx-auto max-w-7xl px-4 pt-8 pb-6">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
          Real scholarships. <span className="text-gradient-warm">Real sources.</span>
          <br className="hidden md:block"/> No invention.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-white/60">
          Other AI tools guess. ScholarshipFit is only allowed to recommend from records with official source URLs already stored in our database.
        </p>
      </section>

      {/* ============== FEATURE CARDS ============== */}
      <section className="container mx-auto max-w-7xl px-4 pt-6 pb-8">
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard title="Match" caption="Ranked shortlist with fit reasoning" href="/onboarding" cta="Start matching">
            <MockMatchCard/>
          </FeatureCard>
          <FeatureCard title="Advisor" caption="Chat with Nova · Claude Sonnet 4.5" href="/advisor" cta="Ask Nova">
            <MockAdvisor/>
          </FeatureCard>
          <FeatureCard title="Report" caption="Downloadable source-linked briefing" href="/sample-report" cta="See sample">
            <MockReport/>
          </FeatureCard>
          <FeatureCard title="Cabinet" caption="Track saved · preparing · applied · won" href="/dashboard" cta="Open cabinet">
            <MockCabinet/>
          </FeatureCard>
          <FeatureCard title="Database" caption="Every record links to an official URL" href="/database" cta="Browse database">
            <MockDatabase scholars={scholars}/>
          </FeatureCard>
          <FeatureCard title="Guardrails" caption="What the AI is not allowed to do" href="/methodology" cta="Read methodology">
            <MockGuardrails/>
          </FeatureCard>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="container mx-auto max-w-7xl px-4 pt-24">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
          Four steps <span className="text-gradient-brand">to your shortlist.</span>
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            { n:'01', t:'Build profile', d:'Degree, field, scores, budget, target countries, achievements.', icon:<FileText className="h-5 w-5"/> },
            { n:'02', t:'Match to real records', d:'AI checks every scholarship in our verified, source-linked database.', icon:<Search className="h-5 w-5"/> },
            { n:'03', t:'Fit reasoning', d:'Overall + academic fit, requirements met, gaps, next steps.', icon:<Brain className="h-5 w-5"/> },
            { n:'04', t:'Apply on official site', d:'You go directly to the university or provider. We never submit for you.', icon:<Link2 className="h-5 w-5"/> },
          ].map((s,i)=>(
            <div key={i} className="relative">
              <div className="text-white/30 text-sm font-mono tracking-widest">{s.n}</div>
              <div className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#060608]">{s.icon}</div>
              <p className="mt-4 text-xl font-semibold tracking-tight text-white">{s.t}</p>
              <p className="mt-1 text-white/60">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== REAL INSTITUTIONS BLOCK ============== */}
      <section className="container mx-auto max-w-7xl px-4 pt-24">
        <div className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-6">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
              Powered by scholarships from <span className="text-gradient-warm">real institutions</span>.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Every record in ScholarshipFit is manually seeded from an official university or government portal, with its source URL stored alongside the record.
            </p>
            <Link href="/database" className="mt-6 inline-flex items-center gap-1 text-white font-medium hover:text-cyan-300">
              Browse the database <ChevronRight className="h-4 w-4"/>
            </Link>
          </div>
          <div className="md:col-span-6">
            <div className="grid grid-cols-2 gap-3">
              {scholars.slice(0,6).map(s => (
                <a key={s.id} href={s.source_url} target="_blank" rel="noopener noreferrer" className="group card-dark rounded-2xl p-4 hover-lift block">
                  <p className="text-xs uppercase tracking-widest text-white/40">{s.country}</p>
                  <p className="mt-1 font-medium text-white line-clamp-2">{s.university_name}</p>
                  <p className="mt-2 text-xs text-white/50 line-clamp-2">{s.scholarship_name}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-cyan-300"><ExternalLink className="h-3 w-3"/>Official source</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== GUARDRAILS ============== */}
      <section className="container mx-auto max-w-7xl px-4 pt-24">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
          What ScholarshipFit <span className="text-gradient-warm">will never do.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-lg text-white/60">Honest boundaries — because scholarship research shouldn&apos;t be a hype machine.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            'Never invent scholarships',
            'Never invent deadlines',
            'Never invent funding amounts',
            'Never guarantee admission or funding',
            'Never submit applications on your behalf',
            'Never publish testimonials without consent',
          ].map((t,i)=>(
            <div key={i} className="card-dark rounded-2xl p-5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
                <XCircle className="h-4 w-4"/>
              </div>
              <p className="font-medium text-white leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== FAQ Callouts ============== */}
      <section className="container mx-auto max-w-7xl px-4 pt-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t:'Is ScholarshipFit free?', d:'Yes — the profile match and preview are free. Paid plans unlock the full cabinet, unlimited advisor chat, and downloadable reports.', icon:<DollarSign className="h-5 w-5"/> },
            { t:'Do you apply for me?', d:'No. ScholarshipFit is a research tool. Every card links to the official provider — you apply there.', icon:<ClipboardCheck className="h-5 w-5"/> },
            { t:'Do you guarantee scholarships?', d:'No. Nobody credible does. We help you find realistic fits and prepare a stronger, targeted application.', icon:<ShieldCheck className="h-5 w-5"/> },
          ].map((f,i)=>(
            <Card key={i} className="card-dark rounded-2xl hover-lift">
              <CardContent className="p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#060608]">{f.icon}</div>
                <p className="mt-4 text-lg font-semibold tracking-tight text-white">{f.t}</p>
                <p className="mt-2 text-white/60">{f.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="container mx-auto max-w-6xl px-4 pt-28 pb-20">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E0E13] to-[#050507] px-6 py-16 md:py-24 text-center overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl"/>
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"/>
          <div className="pointer-events-none absolute inset-0 grid-lines-dark opacity-20"/>
          <h2 className="relative text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white">
            Ready to see <span className="text-gradient-warm">your shortlist?</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/70">Build your profile in three minutes and get source-linked matches instantly.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/onboarding">
              <Button size="lg" className="bg-white hover:bg-white/90 text-[#060608] btn-pill px-7 h-12 text-base font-medium">
                Check My Scholarships <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </Link>
            <Link href="/sample-report">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 btn-pill px-6 h-12 text-base">
                View Sample Report <ArrowUpRight className="ml-1.5 h-4 w-4"/>
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

function CampusCard({ img, small }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-white/10 ${small ? 'h-40 w-64' : 'h-64 w-80'}`}>
      <Image src={img.url} alt={img.label} fill sizes="320px" className="object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"/>
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-[10px] uppercase tracking-widest text-white/70">{img.country}</p>
        <p className="mt-0.5 text-sm font-medium text-white">{img.label}</p>
      </div>
    </div>
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

function FieldInput({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-white/50">{label}</label>
      <Input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-500"/>
    </div>
  )
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-white/50">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white"><SelectValue placeholder="Select"/></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

function FeatureCard({ title, caption, children, href, cta }) {
  return (
    <Card className="card-dark rounded-3xl hover-lift overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-56 border-b border-white/5 bg-gradient-to-br from-[#0F0F16] to-[#08080C] overflow-hidden">
          <div className="absolute inset-4">{children}</div>
        </div>
        <div className="p-5">
          <p className="text-xs uppercase tracking-widest text-cyan-300 font-medium">{title}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-white">{caption}</p>
          <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm text-white font-medium group">
            {cta} <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition"/>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---- mini UI mocks inside feature cards ---- */

function MockMatchCard() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-[280px] rounded-2xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] text-white/40">Republic of Türkiye · Türkiye</p>
            <p className="mt-0.5 text-sm font-semibold text-white">Türkiye Scholarships</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-white text-[#060608] flex items-center justify-center text-sm font-semibold">92</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <span className="rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-500/25 text-[10px] px-2 py-0.5">Source-linked</span>
          <span className="rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/25 text-[10px] px-2 py-0.5">Eligible</span>
          <span className="rounded-full bg-orange-500/15 text-orange-200 border border-orange-500/25 text-[10px] px-2 py-0.5">Low risk</span>
        </div>
        <p className="mt-3 text-[11px] text-white/60 leading-relaxed">Full funding · monthly stipend · accommodation · airfare. Verify current cycle on official source.</p>
      </div>
    </div>
  )
}

function MockAdvisor() {
  return (
    <div className="h-full flex flex-col justify-end gap-2">
      <div className="self-start max-w-[70%] rounded-2xl bg-white/[0.05] border border-white/10 px-3 py-2 text-xs text-white">
        <span className="text-[9px] uppercase tracking-widest text-cyan-300">Nova</span>
        <p className="mt-1">Two strong source-linked options: <b>DAAD EPOS</b> and <b>Stipendium Hungaricum</b>. Deadlines vary — check official sources.</p>
      </div>
      <div className="self-end max-w-[65%] rounded-2xl bg-white text-[#060608] px-3 py-2 text-xs font-medium">Full funding · Germany · engineering?</div>
    </div>
  )
}

function MockReport() {
  return (
    <div className="h-full flex items-center">
      <div className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Portfolio summary</p>
        <div className="mt-2 flex gap-1.5">
          {[92,78,74,71].map((n,i)=>(<div key={i} className="flex-1 rounded-md bg-gradient-to-b from-cyan-500/25 to-cyan-500/10 border border-cyan-500/20 text-center py-2 text-xs font-semibold text-cyan-200">{n}</div>))}
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-white/5"><div className="h-1.5 w-[92%] rounded-full bg-white"/></div>
          <div className="h-1.5 w-full rounded-full bg-white/5"><div className="h-1.5 w-[78%] rounded-full bg-white/80"/></div>
          <div className="h-1.5 w-full rounded-full bg-white/5"><div className="h-1.5 w-[74%] rounded-full bg-white/60"/></div>
        </div>
      </div>
    </div>
  )
}

function MockCabinet() {
  return (
    <div className="h-full grid grid-cols-2 gap-2">
      {[{n:'Saved',c:3},{n:'Preparing',c:2},{n:'Applied',c:1},{n:'Won',c:0}].map((s,i)=>(
        <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 p-3 flex flex-col justify-between">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{s.n}</p>
          <p className="text-2xl font-semibold text-white">{s.c}</p>
        </div>
      ))}
    </div>
  )
}

function MockDatabase({ scholars }) {
  const preview = (scholars || []).slice(0,4)
  return (
    <div className="h-full grid grid-cols-2 gap-2">
      {preview.map(s => (
        <div key={s.id} className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
          <p className="text-[9px] uppercase tracking-widest text-white/40 truncate">{s.country}</p>
          <p className="mt-0.5 text-[11px] font-medium text-white line-clamp-2">{s.university_name}</p>
          <div className="mt-1 flex items-center gap-1 text-[9px] text-cyan-300"><ExternalLink className="h-2.5 w-2.5"/>Source</div>
        </div>
      ))}
      {preview.length === 0 && Array.from({length:4}).map((_,i)=>(<div key={i} className="rounded-xl bg-white/5 border border-white/10 p-2.5 animate-pulse h-16"/>))}
    </div>
  )
}

function MockGuardrails() {
  const items = ['No invented records','No fake deadlines','No fake funding','No fake outcomes']
  return (
    <div className="h-full flex flex-col justify-center gap-2">
      {items.map((t,i)=>(
        <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
          <XCircle className="h-4 w-4 text-white/70"/>
          <span className="text-xs font-medium text-white">{t}</span>
        </div>
      ))}
    </div>
  )
}

export default Home
