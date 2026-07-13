'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { matchScholarships } from '@/lib/quiz-match'
import {
  Sparkles, Zap, ArrowUp, ArrowDown, Minus, Trophy, ExternalLink,
  ShieldCheck, Loader2, RotateCcw, Lock, Info, TrendingUp, Target,
  GraduationCap, MapPin, Award, Wand2,
} from 'lucide-react'

/* ============================================================================
   /simulator — Fit Simulator.
   Drag sliders (GPA, IELTS, TOEFL, work experience) + pick country, degree,
   field → all 800 scholarships re-rank in REAL TIME using the same
   deterministic engine that powers /quiz. Shows delta vs. baseline profile
   so users see the ROI of improving each stat.
   ============================================================================ */

// ---------- Constants ---------------------------------------------------------
const COUNTRIES = [
  'International', 'India', 'Nigeria', 'Pakistan', 'Bangladesh', 'Philippines',
  'Vietnam', 'Indonesia', 'Kenya', 'Ghana', 'Egypt', 'Mexico', 'Brazil',
  'China', 'Turkey', 'Uzbekistan', 'Russia', 'Ukraine', 'Iran', 'Ethiopia',
  'South Africa', 'United States', 'United Kingdom', 'Germany', 'Canada',
]
const DEGREE_LEVELS = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters',       label: "Master's" },
  { value: 'phd',           label: 'PhD / Doctorate' },
  { value: 'postdoctoral',  label: 'Postdoctoral' },
]
const FIELDS = [
  { value: 'all',        label: 'All fields' },
  { value: 'engineering',label: 'Engineering' },
  { value: 'computer science', label: 'Computer Science' },
  { value: 'business',   label: 'Business / MBA' },
  { value: 'medicine',   label: 'Medicine / Health' },
  { value: 'law',        label: 'Law' },
  { value: 'social sciences', label: 'Social Sciences' },
  { value: 'natural sciences',label: 'Natural Sciences' },
  { value: 'arts',       label: 'Arts / Humanities' },
]

// ---------- Slider component --------------------------------------------------
function Slider({ label, hint, value, onChange, min, max, step, formatter, tone = 'gold' }) {
  const pct = ((value - min) / (max - min)) * 100
  const toneCls = tone === 'gold' ? '#D4AF37' : '#22d3ee'
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] uppercase tracking-widest text-white/60 flex items-center gap-2">{label}
          {hint && <span className="text-white/30 normal-case tracking-normal text-xs">· {hint}</span>}
        </label>
        <div className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-sm text-white tabular-nums">
          {formatter ? formatter(value) : value}
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
             style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${toneCls}80, ${toneCls})` }}/>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-[-8px] h-2 w-full opacity-0 cursor-pointer"
      />
    </div>
  )
}

// ---------- Main --------------------------------------------------------------
export default function SimulatorPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [subActive, setSubActive] = useState(null)

  // profile state
  const [gpa,       setGpa]       = useState(3.5)
  const [ielts,     setIelts]     = useState(6.5)
  const [toefl,     setToefl]     = useState(90)
  const [workExp,   setWorkExp]   = useState(2)
  const [country,   setCountry]   = useState('International')
  const [degree,    setDegree]    = useState('masters')
  const [field,     setField]     = useState('all')

  // baseline snapshot (captured on first render for delta comparisons)
  const [baseline, setBaseline] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/scholarships').then(r => r.json()).catch(() => ({ scholarships: [] })),
      fetch('/api/subscription/status', { credentials: 'include' }).then(r => r.json()).catch(() => ({ active: false })),
    ]).then(([sch, sub]) => {
      setItems(Array.isArray(sch.scholarships) ? sch.scholarships : (sch?.items || sch || []))
      setSubActive(!!sub?.active)
      setLoading(false)
    })
  }, [])

  const answers = useMemo(() => ({
    education_level: degree,
    field,
    nationality: country === 'International' ? '' : country,
    gpa,
    gpa_scale: '4',
    ielts,
    toefl,
    funding_pref: 'any',
    work_exp: String(workExp),
    timeline: 'flexible',
  }), [degree, field, country, gpa, ielts, toefl, workExp])

  // Live recompute — expensive-ish, but 800 records × ~10 ops is fine on client
  const ranked = useMemo(() => {
    if (!items.length) return []
    return matchScholarships(answers, items)
  }, [answers, items])

  // Capture baseline once matches first appear so delta is meaningful
  useEffect(() => {
    if (baseline === null && ranked.length) {
      const firstNumber = (str) => {
        const m = String(str || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/)
        return m ? parseFloat(m[0]) : 0
      }
      setBaseline({
        count: ranked.length,
        totalFunding: ranked.reduce((sum, s) => sum + firstNumber(s.funding_amount), 0),
        avgScore: Math.round(ranked.reduce((a, s) => a + (s.overall_fit_score || 0), 0) / (ranked.length || 1)),
      })
    }
  }, [ranked, baseline])

  const stats = useMemo(() => {
    const count = ranked.length
    // Extract the FIRST numeric substring so "€1,400/month + travel" → 1400
    // (previously we concatenated all digits which produced garbage sums).
    const firstNumber = (str) => {
      const m = String(str || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/)
      return m ? parseFloat(m[0]) : 0
    }
    const totalFunding = ranked.reduce((sum, s) => sum + firstNumber(s.funding_amount), 0)
    const avgScore = count ? Math.round(ranked.reduce((a, s) => a + (s.overall_fit_score || 0), 0) / count) : 0
    const fullyFunded = ranked.filter(s => {
      const t = ((s.funding_type || '') + ' ' + (s.funding_summary || '')).toLowerCase()
      return t.includes('full')
    }).length
    return { count, totalFunding, avgScore, fullyFunded }
  }, [ranked])

  const reset = () => {
    setGpa(3.5); setIelts(6.5); setToefl(90); setWorkExp(2)
    setCountry('International'); setDegree('masters'); setField('all')
    setBaseline(null)
  }

  const delta = useMemo(() => {
    if (!baseline) return null
    return {
      count: stats.count - baseline.count,
      totalFunding: stats.totalFunding - baseline.totalFunding,
      avgScore: stats.avgScore - baseline.avgScore,
    }
  }, [baseline, stats])

  // Fully unlocked view for paid; free tier sees top 3 fully + rest with blur
  const FREE_VISIBLE = 3
  const top = ranked.slice(0, 30)

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0"/>
        <div className="container mx-auto max-w-6xl px-4 pt-14 pb-10 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <Wand2 className="h-3.5 w-3.5"/> Fit Simulator · live re-ranking
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.05]">
              What if you had a <span className="text-gold-hi">stronger profile</span>?
            </h1>
            <p className="mt-3 text-white/70 max-w-2xl mx-auto">
              Drag any slider and watch all 800 hand-verified scholarships instantly re-rank against your new profile. Answer the one question no other platform can: <span className="text-white">&ldquo;Is improving my IELTS actually worth it?&rdquo;</span>
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pb-16 grid gap-6 lg:grid-cols-12">
        {/* CONTROLS */}
        <aside className="lg:col-span-5">
          <Card className="border-white/10 bg-white/[0.03] sticky top-24">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] uppercase tracking-widest text-white/50">Your profile</div>
                <button onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white">
                  <RotateCcw className="h-3 w-3"/> Reset
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/60 flex items-center gap-1.5"><MapPin className="h-3 w-3"/>Nationality</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white h-10"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white max-h-72">
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-white/60 flex items-center gap-1.5"><GraduationCap className="h-3 w-3"/>Degree</label>
                    <Select value={degree} onValueChange={setDegree}>
                      <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white h-10"><SelectValue/></SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white">
                        {DEGREE_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-white/60 flex items-center gap-1.5"><Target className="h-3 w-3"/>Field</label>
                    <Select value={field} onValueChange={setField}>
                      <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white h-10"><SelectValue/></SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white">
                        {FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Slider label="GPA (4.0 scale)" hint="drag to see impact" value={gpa}
                        onChange={setGpa} min={2.0} max={4.0} step={0.05}
                        formatter={(v) => v.toFixed(2)}/>
                <Slider label="IELTS" hint="most scholarships need 6.5+" value={ielts}
                        onChange={setIelts} min={5.0} max={9.0} step={0.5}
                        formatter={(v) => v.toFixed(1)}/>
                <Slider label="TOEFL" hint="alternative to IELTS" value={toefl}
                        onChange={setToefl} min={40} max={120} step={1}
                        formatter={(v) => Math.round(v)}/>
                <Slider label="Work experience" hint="years, if relevant" value={workExp}
                        onChange={setWorkExp} min={0} max={10} step={1}
                        formatter={(v) => `${v} yr${v === 1 ? '' : 's'}`}/>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 text-[11px] text-white/40 flex items-start gap-1.5 leading-relaxed">
                <Info className="mt-0.5 h-3 w-3 shrink-0"/>
                Recomputed instantly across all 800 hand-verified records using our deterministic fit engine. No AI, no invented programs, no dead links.
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* RESULTS */}
        <main className="lg:col-span-7">
          {/* Stat cards with delta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Matches" value={stats.count} delta={delta?.count} icon={Trophy} tone="gold"/>
            <StatCard label="Avg fit score" value={`${stats.avgScore}%`} delta={delta?.avgScore} suffix="%" icon={TrendingUp} tone="cyan"/>
            <StatCard label="Fully funded" value={stats.fullyFunded} delta={null} icon={Award} tone="emerald"/>
            <StatCard label="Total funding" value={fmtMoney(stats.totalFunding)} delta={null} icon={Sparkles} tone="gold"/>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-10 flex items-center gap-3 text-white/60">
              <Loader2 className="h-5 w-5 animate-spin"/>Loading scholarship database…
            </div>
          ) : ranked.length === 0 ? (
            <Card className="mt-6 border-white/10 bg-white/[0.03]">
              <CardContent className="p-10 text-center text-white/70">
                No scholarships match this profile. Try loosening the field or lowering GPA/IELTS to see options.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Top {top.length} of {ranked.length} matches, ranked by fit</span>
                {subActive === false && <span className="text-[#D4AF37]">First {FREE_VISIBLE} unlocked · rest locked</span>}
              </div>
              {top.map((s, idx) => {
                const isLocked = subActive === false && idx >= FREE_VISIBLE
                return <ResultRow key={s.scholarship_id || s.id || idx} scholarship={s} rank={idx + 1} isLocked={isLocked}/>
              })}

              {ranked.length > 30 && (
                <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50 text-center">
                  + {ranked.length - 30} more matches — <Link href="/database" className="text-[#D4AF37] hover:underline">browse the full database →</Link>
                </div>
              )}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-8 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] p-5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
              <Zap className="h-3 w-3"/> Lock in your matches
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">Save this profile & get deadline reminders</h3>
            <p className="mt-1 text-sm text-white/70 max-w-lg mx-auto">
              Turn this snapshot into your permanent shortlist with the full 8-step quiz. Deadline autopilot included.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Link href="/quiz">
                <Button className="h-11 px-6 btn-gold btn-pill font-semibold">Take the full quiz →</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="h-11 px-6 border-white/20 bg-transparent text-white hover:bg-white/10">Reserve founder pricing</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}

// ---------- Sub-components ----------------------------------------------------

function fmtMoney(n) {
  if (!n || n < 1000) return '—'
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return `$${Math.round(n)}`
}

function StatCard({ label, value, delta, suffix = '', icon: Icon, tone = 'gold' }) {
  const toneCls = {
    gold:    'border-[#D4AF37]/25 bg-[#D4AF37]/[0.05] text-[#D4AF37]',
    cyan:    'border-cyan-400/25 bg-cyan-500/[0.05] text-cyan-300',
    emerald: 'border-emerald-400/25 bg-emerald-500/[0.05] text-emerald-300',
  }[tone] || 'border-white/10 bg-white/[0.03] text-white'

  const showDelta = typeof delta === 'number' && delta !== 0
  const positive = (delta || 0) > 0

  return (
    <div className={`rounded-2xl border p-3 ${toneCls}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
        <Icon className="h-3.5 w-3.5 opacity-70"/>
      </div>
      <div className="mt-1 text-2xl md:text-3xl font-semibold text-white tabular-nums">{value}</div>
      {showDelta ? (
        <div className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${positive ? 'text-emerald-300' : 'text-red-300'}`}>
          {positive ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>}
          {positive ? '+' : ''}{delta}{suffix} vs. baseline
        </div>
      ) : delta === 0 ? (
        <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/40"><Minus className="h-3 w-3"/>no change</div>
      ) : (
        <div className="mt-0.5 text-[11px] text-white/30">baseline</div>
      )}
    </div>
  )
}

function ResultRow({ scholarship: s, rank, isLocked }) {
  const score = s.overall_fit_score || s.fit_score || 0
  const scoreCls = score >= 80 ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' :
                   score >= 65 ? 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10' :
                   'text-white/70 border-white/15 bg-white/[0.03]'
  return (
    <Card className={`group relative overflow-hidden border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/30 transition ${isLocked ? 'select-none' : ''}`}>
      <CardContent className={`p-4 ${isLocked ? 'blur-[6px] pointer-events-none opacity-70' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-sm text-white/60 tabular-nums">
            {rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
              <span className="truncate">{s.university_name}</span>
              <span className="opacity-40">•</span>
              <span>{s.country}</span>
            </div>
            <div className="mt-0.5 text-sm font-semibold text-white truncate">{s.scholarship_name}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${scoreCls}`}>
                {score}% fit
              </span>
              {s.funding_type && <Badge variant="outline" className="border-white/10 bg-white/[0.02] text-white/70 text-[10px]">{s.funding_type}</Badge>}
              {s.funding_amount && <span className="text-[11px] text-white/60">💰 {s.funding_amount}</span>}
            </div>
          </div>
          <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0 self-center">
            <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-white/80 hover:bg-white/5">
              <ExternalLink className="h-3.5 w-3.5"/>
            </Button>
          </a>
        </div>
      </CardContent>
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <Link href="/pricing">
            <Button className="btn-gold btn-pill h-8 px-4 text-xs font-semibold">
              <Lock className="mr-1.5 h-3 w-3"/>Unlock rank #{rank}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
