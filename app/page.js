'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import Starfield from '@/components/site/Starfield'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { store } from '@/lib/client-store'
import {
  Sparkles, ShieldCheck, Link2, Calendar, DollarSign, GraduationCap, Compass, BookOpen, LayoutDashboard,
  Rocket, ArrowRight, CheckCircle2, Globe2, Brain, ScrollText, MessageSquare, Database as DbIcon, Star
} from 'lucide-react'

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_dea30a66-dd5d-4b69-9dee-68cfc5172ec3/artifacts/g1gq6k95_image.png'

const SAMPLE_PREVIEW = [
  { name: 'Türkiye Scholarships', uni: 'Republic of Türkiye', country: 'Türkiye', score: 92, tag: 'Full funding', trust: 'Source-linked' },
  { name: 'DAAD EPOS', uni: 'DAAD', country: 'Germany', score: 78, tag: 'Full funding · DAC list', trust: 'Source-linked' },
  { name: 'Padua Excellence', uni: 'University of Padua', country: 'Italy', score: 74, tag: '€8,000/yr + fee waiver', trust: 'Source-linked' },
]

function Home() {
  const router = useRouter()
  const [form, setForm] = useState({
    current_level: '',
    degree_level: '',
    intended_major: '',
    preferred_countries: '',
    annual_budget_usd: '',
    gpa: '',
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

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
    <div className="cosmos-bg min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <Starfield density={180} />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-16 pb-20 md:pt-24 md:pb-28 relative">
          <div className="grid gap-10 md:grid-cols-12 items-center">
            <div className="md:col-span-7">
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                <Sparkles className="mr-1.5 h-3 w-3" /> AI-powered · Source-linked · No invented results
              </Badge>
              <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-white">
                Find <span className="text-gradient-cyan">real scholarships</span> that fit your profile.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-300">
                ScholarshipFit turns your academic profile into an AI-powered, source-linked scholarship shortlist — with fit reasoning, funding notes, deadline status, and official links to apply.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/onboarding">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-400 text-white shadow-[0_20px_60px_-15px_rgba(249,115,22,0.65)]">
                    <Rocket className="mr-2 h-5 w-5"/> Check My Scholarships
                  </Button>
                </Link>
                <Link href="/sample-report">
                  <Button size="lg" variant="outline" className="border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]">
                    View Sample Report <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                <TrustBullet icon={<Link2 className="h-4 w-4"/>} text="Official source links"/>
                <TrustBullet icon={<Brain className="h-4 w-4"/>} text="AI fit reasoning"/>
                <TrustBullet icon={<Calendar className="h-4 w-4"/>} text="Deadline & funding notes"/>
                <TrustBullet icon={<ShieldCheck className="h-4 w-4"/>} text="No invented results"/>
              </div>
            </div>

            {/* Search / Profile Panel */}
            <div className="md:col-span-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-500/30 via-sky-500/10 to-indigo-500/30 blur-xl opacity-60"/>
                <Card className="relative glass-strong border-white/10 shadow-[0_40px_120px_-30px_rgba(56,189,248,0.35)]">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><Compass className="h-4 w-4 text-cyan-300"/></div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-cyan-300">Command Panel</p>
                        <p className="text-white font-medium">Start your ScholarshipFit search</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FieldSelect label="Current level" value={form.current_level} onChange={v=>upd('current_level',v)} options={['High school','Bachelor','Master','Graduate','Working professional']} />
                        <FieldSelect label="Target degree" value={form.degree_level} onChange={v=>upd('degree_level',v)} options={['Bachelor','Master','PhD','Research program']} />
                      </div>
                      <FieldInput label="Field of study" placeholder="e.g. Mechanical Engineering" value={form.intended_major} onChange={v=>upd('intended_major',v)} />
                      <FieldInput label="Preferred countries (comma-separated)" placeholder="Germany, Italy, Canada" value={form.preferred_countries} onChange={v=>upd('preferred_countries',v)} />
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Annual budget (USD)" placeholder="3000" type="number" value={form.annual_budget_usd} onChange={v=>upd('annual_budget_usd',v)} />
                        <FieldInput label="GPA (optional)" placeholder="3.7" type="number" value={form.gpa} onChange={v=>upd('gpa',v)} />
                      </div>
                      <Button onClick={startMatch} className="mt-2 w-full bg-cyan-500 text-black hover:bg-cyan-400 h-11 text-base">
                        Find My Matches <ArrowRight className="ml-2 h-4 w-4"/>
                      </Button>
                      <p className="text-[11px] text-slate-500 text-center">Free preview. No signup required.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Scholarship preview strip */}
          <div className="mt-14">
            <p className="text-xs uppercase tracking-widest text-slate-500">Live examples — source-linked matches</p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {SAMPLE_PREVIEW.map((s,i)=>(
                <Card key={i} className="relative overflow-hidden border-white/10 bg-white/[0.03] hover:border-cyan-400/30 transition">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl"/>
                  <CardContent className="p-4 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><GraduationCap className="h-3 w-3"/> {s.uni} · {s.country}</p>
                        <p className="mt-1 font-medium text-white">{s.name}</p>
                        <p className="mt-1 text-sm text-slate-300">{s.tag}</p>
                      </div>
                      <div className="h-11 w-11 rounded-full border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-cyan-200">{s.score}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300"><ShieldCheck className="mr-1 h-3 w-3"/>{s.trust}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section title="How ScholarshipFit works" caption="From profile to source-linked shortlist — in minutes.">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {icon:<ScrollText className="h-5 w-5"/>, t:'1. Build profile', d:'Degree, field, scores, budget, achievements, target countries.'},
            {icon:<DbIcon className="h-5 w-5"/>, t:'2. Match to real records', d:'AI checks every scholarship in our verified, source-linked database.'},
            {icon:<Brain className="h-5 w-5"/>, t:'3. Fit reasoning', d:'Overall + academic fit, requirements met, gaps, and next steps.'},
            {icon:<Link2 className="h-5 w-5"/>, t:'4. Apply on official site', d:'You go directly to the university or provider. We never submit for you.'},
          ].map((s,i)=>(
            <Card key={i} className="border-white/10 bg-white/[0.03] hover:border-cyan-400/30 transition">
              <CardContent className="p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-400/25 text-cyan-300">{s.icon}</div>
                <p className="mt-4 font-medium text-white">{s.t}</p>
                <p className="mt-1 text-sm text-slate-400">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* AI ADVISOR PREVIEW */}
      <Section title="Meet Nova — your AI scholarship advisor" caption="Ask in plain language. Get source-linked answers.">
        <div className="grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-5">
            <div className="relative aspect-square max-w-md">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/10 blur-3xl opacity-70"/>
              <Image src={LOGO_URL} alt="Nova, ScholarshipFit AI guide" width={640} height={640} className="relative rounded-3xl border border-white/10 object-cover"/>
            </div>
          </div>
          <div className="md:col-span-7 space-y-3">
            <ChatBubble role="user" text="I want full funding in Germany for engineering with IELTS 7.0 and GPA 3.7."/>
            <ChatBubble role="assistant" text="Two strong source-linked options: DAAD EPOS (full funding, ~€934/mo + tuition; needs 2+ yrs work exp & DAC-country nationality) and Stipendium Hungaricum for engineering fields in Hungary. I'll also flag Türkiye Scholarships as an outside-Germany full-funding fallback. Deadlines change yearly — check official sources."/>
            <div className="pt-3">
              <Link href="/advisor"><Button className="bg-cyan-500 text-black hover:bg-cyan-400"><MessageSquare className="mr-2 h-4 w-4"/>Talk to Nova</Button></Link>
            </div>
          </div>
        </div>
      </Section>

      {/* PERSONAL CABINET PREVIEW */}
      <Section title="Your ScholarshipFit cabinet" caption="A premium dashboard for tracking every application, deadline, and document.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {icon:<LayoutDashboard className="h-4 w-4"/>,t:'Match stats',d:'Fit score distribution, top matches, and country breakdown.'},
            {icon:<CheckCircle2 className="h-4 w-4"/>,t:'Application tracker',d:'Saved · Preparing · Applied · Shortlisted · Won — all in one place.'},
            {icon:<BookOpen className="h-4 w-4"/>,t:'Document checklist',d:'Auto-generated from your top matches’ required documents.'},
            {icon:<Calendar className="h-4 w-4"/>,t:'Deadline radar',d:'Qualitative deadline status — verify exact dates on official pages.'},
            {icon:<DollarSign className="h-4 w-4"/>,t:'Budget fit insights',d:'See which scholarships bring your annual cost into your budget.'},
            {icon:<Brain className="h-4 w-4"/>,t:'Profile strength',d:'Suggestions to raise your fit scores next cycle.'},
          ].map((s,i)=>(
            <Card key={i} className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-5">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/15 border border-cyan-400/25 text-cyan-300">{s.icon}</div>
                <p className="mt-3 font-medium text-white">{s.t}</p>
                <p className="mt-1 text-sm text-slate-400">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6"><Link href="/dashboard"><Button variant="outline" className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">Open dashboard <ArrowRight className="ml-2 h-4 w-4"/></Button></Link></div>
      </Section>

      {/* DATABASE TRUST */}
      <Section title="Every scholarship is source-linked" caption="We never invent records, deadlines, or funding numbers.">
        <div className="grid gap-6 md:grid-cols-3">
          <TrustCard tone="cyan" tag="Source-linked" text="Pulled from the official university or government portal, with the URL stored alongside the record."/>
          <TrustCard tone="emerald" tag="Strongly reviewed" text="Cross-checked by our editorial team against the provider’s public documentation."/>
          <TrustCard tone="amber" tag="Needs source review" text="Hidden from the public until an official source is attached and confirmed."/>
        </div>
        <div className="mt-6"><Link href="/database"><Button variant="outline" className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">Browse the database <ArrowRight className="ml-2 h-4 w-4"/></Button></Link></div>
      </Section>

      {/* OUTCOMES */}
      <Section title="Outcomes" caption="We only publish stories with explicit permission. No fake testimonials.">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-8 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-cyan-300"/>
            <p className="mt-3 text-lg text-slate-200">Outcomes page opens once verified student stories are submitted.</p>
            <p className="mt-1 text-sm text-slate-500">Individual results vary. ScholarshipFit does not guarantee similar outcomes.</p>
            <div className="mt-4"><Link href="/outcomes"><Button variant="outline" className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">Visit outcomes page</Button></Link></div>
          </CardContent>
        </Card>
      </Section>

      {/* PRICING TEASER */}
      <Section title="Simple plans, coming soon" caption="Payments are not active yet. Join the waitlist and get early access.">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {name:'Free Research Check', price:'$0', highlight:false, features:['Basic match preview','Top 3 source-linked matches','Community disclaimer coverage']},
            {name:'Starter Report', price:'—', highlight:false, features:['Full AI report','Requirements + gaps','Downloadable summary']},
            {name:'Full Scholarship Cabinet', price:'—', highlight:true, features:['Personal dashboard','Application tracker','Document checklist','Deadline radar']},
            {name:'AI Advisor Access', price:'—', highlight:false, features:['Nova unlimited chat','Multi-session memory','Priority updates']},
          ].map((p,i)=>(
            <Card key={i} className={`relative border-white/10 ${p.highlight ? 'bg-gradient-to-b from-cyan-500/10 to-white/[0.02] border-cyan-400/30' : 'bg-white/[0.03]'}`}>
              {p.highlight && <div className="absolute -top-2 left-1/2 -translate-x-1/2"><Badge className="bg-cyan-500 text-black hover:bg-cyan-400"><Star className="mr-1 h-3 w-3"/>Popular</Badge></div>}
              <CardContent className="p-5">
                <p className="text-sm text-slate-400">{p.name}</p>
                <p className="mt-1 text-3xl font-semibold text-white">{p.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {p.features.map((f,j)=>(<li key={j} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5"/><span>{f}</span></li>))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6"><Link href="/pricing"><Button variant="outline" className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">See pricing <ArrowRight className="ml-2 h-4 w-4"/></Button></Link></div>
      </Section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-0"><Starfield density={140} /></div>
        <div className="container mx-auto max-w-5xl px-4 py-20 relative">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-10 text-center">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"/>
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"/>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Ready to see your ScholarshipFit shortlist?</h2>
            <p className="mt-3 text-slate-300">Build your profile in 3 minutes and get source-linked matches instantly.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/onboarding"><Button size="lg" className="bg-orange-500 hover:bg-orange-400 text-white"><Rocket className="mr-2 h-5 w-5"/>Check My Scholarships</Button></Link>
              <Link href="/sample-report"><Button size="lg" variant="outline" className="border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]">View Sample Report</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Section({ title, caption, children }) {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-16 md:py-20">
      <div className="max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{title}</h2>
        {caption && <p className="mt-2 text-slate-400">{caption}</p>}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  )
}

function TrustBullet({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="text-cyan-300">{icon}</span>
      <span className="text-sm text-slate-200">{text}</span>
    </div>
  )
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-cyan-500 text-black' : 'bg-white/[0.05] border border-white/10 text-slate-100'}`}>
        {!isUser && <p className="mb-1 text-[11px] uppercase tracking-widest text-cyan-300">Nova</p>}
        {text}
      </div>
    </div>
  )
}

function TrustCard({ tag, text, tone='cyan' }) {
  const map = {
    cyan:'border-sky-500/30 bg-sky-500/10 text-sky-200',
    emerald:'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    amber:'border-amber-500/30 bg-amber-500/10 text-amber-200',
  }
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="p-5">
        <Badge variant="outline" className={`border ${map[tone]}`}><ShieldCheck className="mr-1 h-3 w-3"/>{tag}</Badge>
        <p className="mt-3 text-sm text-slate-300">{text}</p>
      </CardContent>
    </Card>
  )
}

function FieldInput({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-slate-400">{label}</label>
      <Input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 bg-white/[0.04] border-white/10 text-slate-100 placeholder:text-slate-500"/>
    </div>
  )
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-slate-400">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-slate-100"><SelectValue placeholder="Select"/></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

export default Home
