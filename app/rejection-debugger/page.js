'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Heart, AlertTriangle, ArrowRight, ArrowUpRight, Sparkles, ShieldCheck, Lock, Loader2,
  Info, Target, BookOpen, TrendingUp, Clock, ExternalLink, RotateCcw, MessageSquare,
} from 'lucide-react'

/* ============================================================================
   /rejection-debugger — Rejection Debugger.
   Paste a scholarship rejection letter → AI extracts structured signals
   (rejection categories, profile gaps) and returns 3-5 real, DB-grounded
   alternatives with fit scores. Empathetic UX because rejection is emotional.
   No competitor offers this. Massive retention feature.
   ============================================================================ */

const CATEGORY_LABEL = {
  profile_below_bar:     { label: 'Profile below competitive bar', icon: TrendingUp, tone: 'amber' },
  field_mismatch:        { label: 'Field / research fit mismatch', icon: Target,     tone: 'amber' },
  nationality_ineligible:{ label: 'Nationality eligibility',       icon: Info,       tone: 'red' },
  documentation:         { label: 'Missing / weak documentation',  icon: BookOpen,   tone: 'amber' },
  timing:                { label: 'Application timing / deadline', icon: Clock,      tone: 'amber' },
  high_competition:      { label: 'High competition — small margin', icon: Sparkles, tone: 'gold' },
  language_score:        { label: 'English proficiency below threshold', icon: BookOpen, tone: 'amber' },
  financial_criteria:    { label: 'Financial-need criteria',       icon: Info,       tone: 'red' },
  essay_or_interview:    { label: 'Essay / interview quality',     icon: MessageSquare, tone: 'amber' },
  unknown:               { label: 'Reason not clearly stated',     icon: Info,       tone: 'muted' },
}
const TONE_CLS = {
  amber:  'border-amber-400/30 bg-amber-500/10 text-amber-200',
  red:    'border-red-400/30 bg-red-500/10 text-red-200',
  gold:   'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]',
  muted:  'border-white/10 bg-white/[0.03] text-white/60',
}

const COUNTRIES = ['International','India','Nigeria','Pakistan','Bangladesh','Philippines','Vietnam','Kenya','Egypt','Mexico','Brazil','China','Turkey','Uzbekistan','Ethiopia','South Africa']
const DEGREES = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters',       label: "Master's" },
  { value: 'phd',           label: 'PhD' },
  { value: 'postdoctoral',  label: 'Postdoctoral' },
]

export default function RejectionDebugger() {
  const [letter, setLetter]   = useState('')
  const [country, setCountry] = useState('International')
  const [degree, setDegree]   = useState('masters')
  const [field, setField]     = useState('')
  const [gpa, setGpa]         = useState('')
  const [ielts, setIelts]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [gate, setGate]       = useState(null)

  const analyze = async () => {
    if (letter.trim().length < 40) { setError('Please paste the full rejection letter (at least a paragraph).'); return }
    setLoading(true); setError(''); setResult(null); setGate(null)
    try {
      const r = await fetch('/api/rejection/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter,
          profile: {
            nationality: country === 'International' ? '' : country,
            degree, field, gpa: gpa || null, ielts: ielts || null,
          },
        }),
      })
      const d = await r.json()
      if (r.status === 429) { setGate({ require: d.require, message: d.message }); return }
      if (!r.ok) throw new Error(d.error || d.detail || 'Analysis failed')
      setResult(d)
    } catch (e) {
      setError(e?.message || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const reset = () => { setLetter(''); setResult(null); setError(''); setGate(null) }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0"/>
        <div className="container mx-auto max-w-3xl px-4 pt-14 pb-8 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#D4AF37]">
            <Heart className="h-3.5 w-3.5"/> Rejection Debugger · empathetic AI
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.05]">
            Rejection is <span className="text-gold-hi">data</span>, not a verdict.
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Paste your rejection letter. Nova extracts the real signals, names your profile gaps, and lines up <span className="text-white">verified alternatives</span> that actually fit you — from our hand-verified, source-linked database of 800 premium scholarships. No dead links. No aggregator spam.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-white/40">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Letters are never stored in plaintext</span>
            <span className="opacity-30">·</span>
            <span>No competitor offers this</span>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div className="container mx-auto max-w-4xl px-4 pb-16 grid gap-6">
        {!result && (
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="p-5 md:p-6">
              <label className="text-[11px] uppercase tracking-widest text-white/60">Paste the rejection letter</label>
              <Textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                placeholder="Paste the full text of the rejection email or letter here…"
                className="mt-2 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37] min-h-[180px] resize-y"
                maxLength={8000}
              />
              <div className="mt-1 flex justify-between text-[10px] text-white/40">
                <span>Minimum 40 characters · Only the hash is stored, not the letter</span>
                <span>{letter.length}/8000</span>
              </div>

              <div className="mt-5 pt-5 border-t border-white/5">
                <div className="text-[11px] uppercase tracking-widest text-white/60 mb-3">Your profile <span className="normal-case tracking-normal text-white/40">(optional but helps)</span></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Nationality</label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white h-10"><SelectValue/></SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white max-h-72">
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Degree level</label>
                    <Select value={degree} onValueChange={setDegree}>
                      <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white h-10"><SelectValue/></SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white">
                        {DEGREES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Field of study</label>
                    <Input placeholder="e.g. Computer Science" value={field} onChange={(e) => setField(e.target.value)}
                      className="mt-1 h-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/40">GPA (4.0)</label>
                      <Input inputMode="decimal" placeholder="3.5" value={gpa} onChange={(e) => setGpa(e.target.value)}
                        className="mt-1 h-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"/>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/40">IELTS</label>
                      <Input inputMode="decimal" placeholder="6.5" value={ielts} onChange={(e) => setIelts(e.target.value)}
                        className="mt-1 h-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"/>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertTriangle className="inline h-4 w-4 mr-1 -mt-0.5"/>{error}
                </div>
              )}

              <Button
                onClick={analyze}
                disabled={loading || letter.trim().length < 40}
                className="mt-5 h-12 w-full btn-gold btn-pill font-semibold disabled:opacity-60"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Analysing your letter…</> : <>Debug my rejection <ArrowRight className="ml-2 h-4 w-4"/></>}
              </Button>
              <p className="mt-3 text-[11px] text-white/40 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3"/> Free · No signup required · 2 free anonymous · 5/day signed-in
              </p>
            </CardContent>
          </Card>
        )}

        {/* Rate-limit gate */}
        {gate && (
          <Card className="border-[#D4AF37]/30 bg-[#D4AF37]/[0.06]">
            <CardContent className="p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                <Lock className="h-6 w-6 text-[#D4AF37]"/>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Daily limit reached</h3>
              <p className="mt-2 text-sm text-white/70 max-w-md mx-auto">{gate.message}</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {gate.require === 'signup' ? (
                  <Link href="/signup"><Button className="btn-gold btn-pill font-semibold h-11 px-6">Create free account</Button></Link>
                ) : (
                  <Link href="/pricing"><Button className="btn-gold btn-pill font-semibold h-11 px-6">Reserve founder pricing</Button></Link>
                )}
                <Button onClick={reset} variant="outline" className="h-11 px-5 border-white/15 bg-transparent text-white hover:bg-white/5">Start over</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RESULT */}
        {result && (
          <div className="space-y-5">
            {/* Empathy header */}
            {result.analysis?.empathy_note && (
              <Card className="border-[#D4AF37]/25 bg-[#D4AF37]/[0.04]">
                <CardContent className="p-5 flex items-start gap-3">
                  <Heart className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5"/>
                  <p className="text-sm md:text-base text-white/85 leading-relaxed">{result.analysis.empathy_note}</p>
                </CardContent>
              </Card>
            )}

            {/* Meta strip */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  {result.analysis?.scholarship_mentioned && (
                    <span className="inline-flex items-center gap-1.5"><Target className="h-3.5 w-3.5"/>Rejected from: <span className="text-white">{result.analysis.scholarship_mentioned}</span></span>
                  )}
                  {result.analysis?.provider_mentioned && (
                    <span className="inline-flex items-center gap-1.5">Provider: <span className="text-white">{result.analysis.provider_mentioned}</span></span>
                  )}
                  {result.analysis?.recovery_time_estimate && (
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/>Recovery: <span className="text-white">{result.analysis.recovery_time_estimate}</span></span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rejection categories */}
            {result.analysis?.rejection_categories?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400"/>What likely happened
                </h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {result.analysis.rejection_categories.map((c, i) => {
                    const meta = CATEGORY_LABEL[c.code] || CATEGORY_LABEL.unknown
                    const Icon = meta.icon
                    return (
                      <Card key={i} className={`border ${TONE_CLS[meta.tone]}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5 shrink-0"/>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-medium text-sm">{meta.label}</div>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-current opacity-70">{c.confidence} confidence</Badge>
                              </div>
                              <div className="mt-1 text-sm opacity-90">{c.reason}</div>
                              {c.quoted_signal && (
                                <div className="mt-2 text-[11px] italic opacity-70 border-l-2 border-current/30 pl-2">&ldquo;{c.quoted_signal}&rdquo;</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Profile gaps */}
            {result.analysis?.profile_gaps?.length > 0 && (
              <Card className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#D4AF37]"/>Close these gaps before you try again
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {result.analysis.profile_gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center text-xs font-medium shrink-0">{i + 1}</div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]">{g.area}</div>
                          <div className="text-sm text-white">{g.action}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Alternatives */}
            {result.alternatives?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D4AF37]"/>Better-fit alternatives from our verified DB
                </h2>
                <p className="text-xs text-white/50 mt-1">Real, source-linked scholarships that match your profile. Nova refuses to invent options.</p>
                <div className="mt-3 grid gap-3">
                  {result.alternatives.map((a, i) => (
                    <Card key={a.scholarship_id || i} className="border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/30 transition">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] uppercase tracking-widest text-white/50">{a.provider} · {a.country}</div>
                            <div className="mt-0.5 font-semibold text-white">{a.name}</div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                a.fit_score >= 80 ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' :
                                a.fit_score >= 65 ? 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10' :
                                'text-white/60 border-white/15 bg-white/[0.03]'
                              }`}>
                                {a.fit_score}% fit
                              </span>
                              {a.funding_type && <Badge variant="outline" className="border-white/10 bg-white/[0.02] text-white/70 text-[10px]">{a.funding_type}</Badge>}
                              {a.funding_amount && <span className="text-[11px] text-white/60 truncate max-w-[240px]">💰 {a.funding_amount}</span>}
                            </div>
                            {a.reasons?.length > 0 && (
                              <ul className="mt-2 text-[12px] text-white/70 space-y-0.5">
                                {a.reasons.slice(0, 2).map((r, j) => (
                                  <li key={j} className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <Button variant="outline" size="sm" className="border-white/10 bg-transparent text-white hover:bg-white/5">
                              Official <ArrowUpRight className="ml-1 h-3 w-3"/>
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/70">
                <div className="text-white font-medium">Save this analysis + get deadline reminders for alternatives</div>
                <div className="mt-0.5 text-[12px] text-white/50">Turn this into a permanent shortlist inside your Command Center.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/pricing">
                  <Button className="h-10 px-4 btn-gold btn-pill text-sm font-semibold">Reserve founder pricing</Button>
                </Link>
                <Button onClick={reset} variant="outline" className="h-10 px-4 border-white/15 bg-transparent text-white hover:bg-white/5">
                  <RotateCcw className="mr-2 h-3.5 w-3.5"/>Debug another
                </Button>
              </div>
            </div>

            {/* Privacy footer */}
            <div className="text-[11px] text-white/40 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3"/>
              We stored a one-way hash of your letter (not the text) plus the rejection categories, for rate-limiting and quality metrics only.
            </div>
          </div>
        )}

        {/* Explainer / what we detect */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-white/50 flex items-center gap-1.5"><Info className="h-3 w-3"/>What we look for</div>
            <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm text-white/75">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="font-medium text-white">🎯 Signal extraction</div>
                <div className="mt-1 text-xs text-white/60">Categorises rejection reasons (profile bar, field mismatch, timing, competition, etc.) with quoted evidence from your letter.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="font-medium text-white">📏 Gap identification</div>
                <div className="mt-1 text-xs text-white/60">Names the 2-5 specific things you need to strengthen — GPA, language score, publications, documentation, etc.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="font-medium text-white">🔁 Real alternatives</div>
                <div className="mt-1 text-xs text-white/60">Runs your profile through the 800 hand-verified premium DB and returns 3-5 scholarships that address the gaps — never invented.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
