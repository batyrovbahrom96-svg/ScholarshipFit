'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import PaywallModal from '@/components/site/PaywallModal'
import { store } from '@/lib/client-store'
import { track } from '@/lib/analytics'
import {
  ArrowRight, ArrowLeft, GraduationCap, Sparkles, ExternalLink, ShieldCheck,
  CheckCircle2, AlertCircle, MapPin, Globe, Award, Loader2, RotateCcw,
  Lock, Crown, Zap, TrendingUp, Briefcase, Calendar, Wallet, Brain, XCircle, ShieldAlert,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------
const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High school student', hint: 'Applying to Bachelor programs' },
  { value: 'bachelor', label: 'Bachelor / Undergraduate', hint: 'Currently in or applying to Bachelor' },
  { value: 'master', label: 'Master / Graduate', hint: "Master's programs (1–2 years)" },
  { value: 'mba', label: 'MBA', hint: 'Business school MBA programs' },
  { value: 'phd', label: 'PhD / Doctoral', hint: 'Research doctorate (3–5 years)' },
  { value: 'postdoc', label: 'Postdoc / Research fellowship', hint: 'Post-PhD research positions' },
  { value: 'other', label: 'Short course / Exchange / Non-degree', hint: 'Certificates, fellowships, exchanges' },
]

const FIELDS = [
  { value: 'engineering-cs',    label: 'Engineering, CS, AI, Data Science' },
  { value: 'natural-sciences',  label: 'Natural Sciences (Physics, Chem, Bio, Math)' },
  { value: 'medicine-health',   label: 'Medicine, Public Health, Life Sciences' },
  { value: 'business-economics',label: 'Business, Finance, Economics, MBA' },
  { value: 'law-policy',        label: 'Law, Policy, International Relations' },
  { value: 'humanities-arts',   label: 'Humanities, Arts, Design, Architecture' },
  { value: 'social-sciences',   label: 'Social Sciences, Education, Psychology' },
  { value: 'agriculture-env',   label: 'Agriculture, Environment, Sustainability' },
  { value: 'all',               label: "Not sure yet / Open to any field" },
]

const NATIONALITIES = [
  'Afghanistan','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bangladesh','Belarus','Belgium','Bolivia','Brazil','Bulgaria','Cambodia','Cameroon',
  'Canada','Chile','China','Colombia','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Ecuador','Egypt','Estonia','Ethiopia','Finland','France','Georgia',
  'Germany','Ghana','Greece','Guatemala','Honduras','Hong Kong','Hungary','Iceland',
  'India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica',
  'Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon',
  'Liberia','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Mali',
  'Malta','Mauritius','Mexico','Moldova','Mongolia','Morocco','Mozambique','Myanmar',
  'Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Nigeria','Norway','Oman',
  'Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore',
  'Slovakia','Slovenia','Somalia','South Africa','South Korea','Spain','Sri Lanka',
  'Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand',
  'Tunisia','Türkiye','Turkmenistan','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen',
  'Zambia','Zimbabwe',
]

const DESTINATIONS = [
  'Any', 'United States', 'United Kingdom', 'Germany', 'France', 'Netherlands', 'Switzerland',
  'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Hong Kong',
  'China', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Belgium', 'Italy', 'Spain',
  'Portugal', 'Austria', 'Türkiye', 'United Arab Emirates', 'Saudi Arabia', 'Israel',
]

const FUNDING_PREFS = [
  { value: 'full_only',   label: 'Fully funded only',       hint: 'Tuition + living + travel covered' },
  { value: 'partial_ok',  label: 'Partial funding is OK',    hint: 'Any tuition help is welcome' },
  { value: 'any',         label: "Show everything",         hint: 'Any funding, ranked by fit' },
]

const WORK_EXP = [
  { value: '0',   label: '0 years',   hint: 'Just finishing studies' },
  { value: '1-2', label: '1–2 years', hint: 'Early career' },
  { value: '3-5', label: '3–5 years', hint: 'Mid-career' },
  { value: '5+',  label: '5+ years',  hint: 'Senior / executive track' },
]

const TIMELINES = [
  { value: '2025',     label: 'This year (2025 cycle)',  hint: 'Applying to programs closing in the next 6 months' },
  { value: '2026',     label: 'Next year (2026 cycle)',  hint: 'Planning ahead — build a strong pipeline' },
  { value: 'flexible', label: 'Flexible / not sure yet', hint: 'Rank everything, hide nothing' },
]

const FIN_NEED = [
  { value: 'high',   label: 'High — I cannot pay tuition without a full scholarship' },
  { value: 'medium', label: 'Moderate — I can cover some costs, need help with the rest' },
  { value: 'low',    label: 'Low — funding is a bonus, not a blocker' },
]

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function StepHeader({ step, total, title, subtitle }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-[#D4AF37]">
          Step {step} of {total}
        </span>
        <span className="text-xs text-white/40">{Math.round((step / total) * 100)}% complete</span>
      </div>
      <Progress value={(step / total) * 100} className="h-1 bg-white/5 [&>div]:bg-[#D4AF37]" />
      <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 text-white/60 max-w-xl">{subtitle}</p> : null}
    </div>
  )
}

function OptionCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all
        ${selected
          ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
          : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
        }`}
    >
      {children}
    </button>
  )
}

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-all
        ${selected
          ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
          : 'bg-white/[0.02] text-white/70 border-white/10 hover:border-white/30 hover:text-white'
        }`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 8

export default function QuizPage() {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    education_level: '',
    field: '',
    nationality: '',
    preferred_countries: [],
    gpa: '', gpa_scale: '4',
    ielts: '', toefl: '',
    funding_pref: '',
    // Optional step 8 — precision fields
    work_exp: '',
    gre: '', gmat: '',
    timeline: '',
    financial_need: '',
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')

  // Pull user name (if signed in) for a personalized results header
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const n = d?.user?.name || d?.user?.full_name || ''
        if (n) setUserName(n.split(' ')[0])
      })
      .catch(() => {})
  }, [])

  // Track quiz_started once on mount (funnel entry)
  useEffect(() => {
    try { track.quizStarted() } catch { /* ignore */ }
  }, [])

  // Track each step advance for drop-off analysis
  useEffect(() => {
    try { track.quizStepCompleted(step) } catch { /* ignore */ }
  }, [step])

  const setA = (patch) => setAnswers(a => ({ ...a, ...patch }))
  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!answers.education_level
      case 2: return !!answers.field
      case 3: return !!answers.nationality
      case 4: return (answers.preferred_countries?.length || 0) > 0
      case 5: return true // GPA optional
      case 6: return true // English optional
      case 7: return !!answers.funding_pref
      case 8: return true // Boost step — everything optional
      default: return false
    }
  }, [step, answers])

  const submit = async () => {
    setLoading(true); setError('')
    try {
      // Kick off the API call and enforce a minimum loader duration so the
      // "AI is analyzing 800 scholarships" experience feels grounded.
      const started = Date.now()
      const apiCall = fetch('/api/scholarships/quiz-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      const [data] = await Promise.all([
        apiCall,
        new Promise(r => setTimeout(r, 2600 - Math.min(2600, Date.now() - started))),
      ])
      setResults(data)

      try {
        track.quizCompleted({
          match_count: (data.top_matches || []).length,
          total_worth: data.total_worth || 0,
          education_level: answers.education_level,
          field: answers.field,
          nationality: answers.nationality,
          preferred_countries_count: (answers.preferred_countries || []).length,
          funding_pref: answers.funding_pref,
        })
      } catch { /* ignore */ }
      // way, when the user activates a plan from the paywall, the redirect
      // to /dashboard immediately shows their matched scholarships instead
      // of an empty cabinet.
      try {
        const matches = (data.top_matches || []).map(m => ({
          scholarship_id: m.scholarship_id,
          slug: m.slug,
          scholarship_name: m.scholarship_name,
          university_name: m.university_name,
          country: m.country,
          source_url: m.source_url,
          application_link: m.application_link || m.source_url,
          trust_level: m.trust_level,
          funding_amount: m.funding_amount,
          funding_type: m.funding_type,
          deadline_note: m.deadline_note,
          deadline_status: m.deadline_status,
          overall_fit_score: m.overall_fit_score,
          academic_fit_score: m.overall_fit_score,
          scholarship_fit_score: m.overall_fit_score,
          budget_fit: (answers.funding_pref === 'full_only' && /full/i.test(m.funding_type || '')) ? 'excellent' : 'good',
          eligibility_status: m.risk_level === 'high' ? 'borderline' : 'likely_eligible',
          application_waste_risk: m.risk_level || 'low',
          requirements_met: m.reasons || [],
          requirements_missing: m.gaps || [],
          fit_reasoning: (m.reasons || []).slice(0, 2).join(' · '),
          funding_note: m.funding_summary,
          next_steps: ['Verify current cycle on official source URL', 'Prepare motivation letter', 'Collect transcripts + references'],
          disclaimer_hint: 'Verify all details on the official source before applying.',
          warnings: m.warnings || [],
          risk_level: m.risk_level || 'low',
          degree_levels: m.degree_levels,
          major_fields: m.major_fields,
        }))
        const runShape = {
          run: {
            id: `quiz-${Date.now()}`,
            created_at: new Date().toISOString(),
            profile: { ...answers, source: 'quiz' },
            result: {
              matches,
              summary: `Ranked ${data.total_matches || matches.length} of ${data.total_evaluated || 800} source-linked scholarships against your quiz profile.`,
              advisory: 'These matches are deterministic — verify every deadline on the official source URL before applying.',
            },
          },
        }
        store.setRun(runShape.run)
        store.setLastAnswers?.(answers)
      } catch { /* localStorage may be blocked in some browsers */ }
    } catch (e) {
      setError('Could not fetch matches. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResults(null); setStep(1); setError('')
    setAnswers({
      education_level: '', field: '', nationality: '', preferred_countries: [],
      gpa: '', gpa_scale: '4', ielts: '', toefl: '', funding_pref: '',
      work_exp: '', gre: '', gmat: '', timeline: '', financial_need: '',
    })
  }

  // -------------------------------------------------------------------------
  // Loader (shown while analyzing)
  // -------------------------------------------------------------------------
  if (loading) {
    return <QuizAnalyzingLoader userName={userName} />
  }

  // -------------------------------------------------------------------------
  // Results view
  // -------------------------------------------------------------------------
  if (results) {
    return <QuizResults results={results} answers={answers} onReset={reset} userName={userName} />
  }

  // -------------------------------------------------------------------------
  // Wizard view
  // -------------------------------------------------------------------------
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.15),transparent_70%)]"/>
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-24 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <>
                <StepHeader step={1} total={TOTAL_STEPS} title="What best describes you?" subtitle="We match your education level to the right scholarship programs."/>
                <div className="space-y-3">
                  {EDUCATION_LEVELS.map(o => (
                    <OptionCard key={o.value} selected={answers.education_level === o.value} onClick={() => setA({ education_level: o.value })}>
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 mt-0.5 text-[#D4AF37]"/>
                        <div>
                          <div className="font-medium text-white">{o.label}</div>
                          <div className="text-sm text-white/50">{o.hint}</div>
                        </div>
                      </div>
                    </OptionCard>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <StepHeader step={2} total={TOTAL_STEPS} title="Your field of study" subtitle="This helps us prioritise scholarships that accept your discipline."/>
                <div className="space-y-2">
                  {FIELDS.map(o => (
                    <OptionCard key={o.value} selected={answers.field === o.value} onClick={() => setA({ field: o.value })}>
                      <div className="font-medium text-white">{o.label}</div>
                    </OptionCard>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <StepHeader step={3} total={TOTAL_STEPS} title="What is your citizenship?" subtitle="Most scholarships restrict by nationality — we use this to filter out anything you can't apply for."/>
                <Label htmlFor="nat" className="text-white/70">Country of citizenship</Label>
                <select
                  id="nat"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
                  value={answers.nationality}
                  onChange={e => setA({ nationality: e.target.value })}
                >
                  <option value="">Select your citizenship</option>
                  {NATIONALITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="mt-3 text-xs text-white/40">If you hold dual citizenship, choose the one that gives you access to more scholarships (typically a developing country or Commonwealth citizenship).</p>
              </>
            )}

            {step === 4 && (
              <>
                <StepHeader step={4} total={TOTAL_STEPS} title="Where do you want to study?" subtitle={`Pick as many as you like — we'll rank scholarships by your destination fit. Choose "Any" if you're open to anywhere.`}/>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map(c => {
                    const selected = answers.preferred_countries?.includes(c)
                    return (
                      <Chip
                        key={c}
                        selected={selected}
                        onClick={() => {
                          if (c === 'Any') {
                            setA({ preferred_countries: selected ? [] : ['Any'] })
                            return
                          }
                          let next = [...(answers.preferred_countries || [])].filter(x => x !== 'Any')
                          if (selected) next = next.filter(x => x !== c)
                          else next.push(c)
                          setA({ preferred_countries: next })
                        }}
                      >{c}</Chip>
                    )
                  })}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <StepHeader step={5} total={TOTAL_STEPS} title="Your academic performance" subtitle="Optional but recommended — helps us match you to scholarships whose GPA thresholds you meet."/>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="gpa" className="text-white/70">GPA</Label>
                    <Input id="gpa" type="number" step="0.01" min="0" placeholder="e.g. 3.7"
                      value={answers.gpa}
                      onChange={e => setA({ gpa: e.target.value })}
                      className="mt-2 bg-white/[0.02] border-white/10 text-white"/>
                  </div>
                  <div>
                    <Label htmlFor="scale" className="text-white/70">Scale</Label>
                    <select id="scale"
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none h-10"
                      value={answers.gpa_scale}
                      onChange={e => setA({ gpa_scale: e.target.value })}
                    >
                      <option value="4">out of 4.0</option>
                      <option value="10">out of 10</option>
                      <option value="100">out of 100 (%)</option>
                    </select>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/40">You can skip this &mdash; matches will still work, we just won&apos;t be able to tell you which GPA thresholds you clear.</p>
              </>
            )}

            {step === 6 && (
              <>
                <StepHeader step={6} total={TOTAL_STEPS} title="English test scores" subtitle="Optional. If you have IELTS or TOEFL, we'll flag which scholarships you meet the language bar for."/>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ielts" className="text-white/70">IELTS Overall</Label>
                    <Input id="ielts" type="number" step="0.5" min="0" max="9" placeholder="e.g. 7.0"
                      value={answers.ielts}
                      onChange={e => setA({ ielts: e.target.value })}
                      className="mt-2 bg-white/[0.02] border-white/10 text-white"/>
                  </div>
                  <div>
                    <Label htmlFor="toefl" className="text-white/70">TOEFL iBT</Label>
                    <Input id="toefl" type="number" min="0" max="120" placeholder="e.g. 100"
                      value={answers.toefl}
                      onChange={e => setA({ toefl: e.target.value })}
                      className="mt-2 bg-white/[0.02] border-white/10 text-white"/>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/40">Don&apos;t have scores yet? Skip &mdash; matches whose language requirements you can&apos;t verify will still be shown, just without the &ldquo;requirement met&rdquo; tick.</p>
              </>
            )}

            {step === 7 && (
              <>
                <StepHeader step={7} total={TOTAL_STEPS} title="Funding preference" subtitle="One last thing — how much funding do you actually need?"/>
                <div className="space-y-3">
                  {FUNDING_PREFS.map(o => (
                    <OptionCard key={o.value} selected={answers.funding_pref === o.value} onClick={() => setA({ funding_pref: o.value })}>
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 mt-0.5 text-[#D4AF37]"/>
                        <div>
                          <div className="font-medium text-white">{o.label}</div>
                          <div className="text-sm text-white/50">{o.hint}</div>
                        </div>
                      </div>
                    </OptionCard>
                  ))}
                </div>
              </>
            )}

            {step === 8 && (
              <>
                <StepHeader
                  step={8}
                  total={TOTAL_STEPS}
                  title="Boost your matches"
                  subtitle="All optional — but the more you tell us, the tighter your match report will be."
                />

                {/* Work experience */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                    <Briefcase className="h-3.5 w-3.5"/> Work experience
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WORK_EXP.map(o => (
                      <OptionCard key={o.value} selected={answers.work_exp === o.value} onClick={() => setA({ work_exp: answers.work_exp === o.value ? '' : o.value })}>
                        <div className="font-medium text-white text-sm">{o.label}</div>
                        <div className="text-[11px] text-white/50 mt-0.5">{o.hint}</div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                {/* GRE / GMAT (only surfaces for relevant levels) */}
                {(answers.education_level === 'master' || answers.education_level === 'phd' || answers.education_level === 'mba') && (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                      <Brain className="h-3.5 w-3.5"/> Standardised test scores
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="gre" className="text-white/70">GRE (optional)</Label>
                        <Input id="gre" type="number" min="260" max="340" placeholder="e.g. 320"
                          value={answers.gre}
                          onChange={e => setA({ gre: e.target.value })}
                          className="mt-2 bg-white/[0.02] border-white/10 text-white"/>
                      </div>
                      <div>
                        <Label htmlFor="gmat" className="text-white/70">GMAT (optional)</Label>
                        <Input id="gmat" type="number" min="200" max="800" placeholder="e.g. 680"
                          value={answers.gmat}
                          onChange={e => setA({ gmat: e.target.value })}
                          className="mt-2 bg-white/[0.02] border-white/10 text-white"/>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                    <Calendar className="h-3.5 w-3.5"/> Application timeline
                  </div>
                  <div className="space-y-2">
                    {TIMELINES.map(o => (
                      <OptionCard key={o.value} selected={answers.timeline === o.value} onClick={() => setA({ timeline: answers.timeline === o.value ? '' : o.value })}>
                        <div className="font-medium text-white text-sm">{o.label}</div>
                        <div className="text-[11px] text-white/50 mt-0.5">{o.hint}</div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                {/* Financial need */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                    <Wallet className="h-3.5 w-3.5"/> Financial need
                  </div>
                  <div className="space-y-2">
                    {FIN_NEED.map(o => (
                      <OptionCard key={o.value} selected={answers.financial_need === o.value} onClick={() => setA({ financial_need: answers.financial_need === o.value ? '' : o.value })}>
                        <div className="text-white text-sm">{o.label}</div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <p className="mt-6 text-xs text-white/40">
                  You can skip this step entirely — but each detail sharpens your fit score and removes ineligible matches.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4"/>{error}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <Button variant="ghost" className="text-white/60 hover:text-white"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4"/> Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="bg-[#D4AF37] text-black hover:bg-[#B8941F] disabled:opacity-30"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={!canNext || loading}
              className="bg-[#D4AF37] text-black hover:bg-[#B8941F] disabled:opacity-30"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Matching…</> : <>Find my scholarships <Sparkles className="ml-2 h-4 w-4"/></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Estimate USD funding value from a scholarship's funding_amount free-text.
// Handles: "$50,000", "€25,000", "£10,000", "SGD $3,300/mo", "CAD $40,000/yr",
// "USD 8,000-25,000". Returns the highest number found, normalised to USD-ish.
// -----------------------------------------------------------------------------
function estimateFundingUSD(m) {
  const s = String(m?.funding_amount || m?.funding_summary || '')
  if (!s) return 0
  const currencyMult = { '€': 1.07, '£': 1.27, 'CAD': 0.73, 'AUD': 0.66, 'SGD': 0.74, 'CHF': 1.12, 'HKD': 0.13, 'JPY': 0.0065, 'INR': 0.012, 'ZAR': 0.055 }
  const numbers = []
  const re = /(€|£|CAD|AUD|SGD|CHF|HKD|USD|JPY|INR|ZAR|\$)\s*(\d{1,3}(?:[,\s]\d{3})+|\d+(?:\.\d+)?)/gi
  let match
  while ((match = re.exec(s)) !== null) {
    const sym = match[1].toUpperCase()
    const raw = parseFloat(match[2].replace(/[,\s]/g, ''))
    if (Number.isNaN(raw)) continue
    let usd = raw * (currencyMult[sym] || 1)
    // Convert small monthly to annual (rough)
    if (/\bper (mo|month)\b|\/mo\b/i.test(s) && raw < 10000) usd = usd * 12
    numbers.push(usd)
  }
  if (numbers.length === 0) {
    // Fallback: "Full tuition + living" → assume $30k
    if (/fully funded|full tuition/i.test(s)) return 30000
    if (/tuition (waiver|discount)/i.test(s)) return 15000
    return 5000
  }
  return Math.round(Math.max(...numbers))
}

function QuizResults({ results, answers, onReset, userName }) {
  const matches = results?.top_matches || []
  const total = results?.total_matches || 0
  const evaluated = results?.total_evaluated || 0
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [meActive, setMeActive] = useState(false)

  // Check whether user already has an active subscription (skip paywall)
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setMeActive(!!d?.user?.subscription_active))
      .catch(() => {})
  }, [])

  const totalWorth = useMemo(() => {
    return matches.reduce((sum, m) => sum + estimateFundingUSD(m), 0)
  }, [matches])

  const strongCount = matches.filter(m => (m.overall_fit_score || 0) >= 75).length
  const greeting = userName ? `Hi ${userName}` : (answers?.nationality ? `Hi there` : 'Your matches')

  const teaser = matches.slice(0, 3)
  const locked  = matches.slice(3)

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.15),transparent_70%)]"/>
      <div className="container mx-auto max-w-5xl px-4 pt-24 pb-24 relative">

        {/* HERO — personalized results header with match-value stat */}
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37]">
                <Sparkles className="h-4 w-4"/> Your personalized shortlist is ready
              </div>
              <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
                {greeting}
                {userName && <>,</>} we found{' '}
                <span className="text-[#D4AF37]">{total} real scholarships</span>
                {strongCount > 0 && (
                  <> — <span className="text-emerald-400">{strongCount} strong-fit</span></>
                )}
                {totalWorth > 0 && (
                  <> worth up to <span className="text-emerald-400">${totalWorth.toLocaleString()}</span></>
                )}
              </h1>
              <p className="mt-3 text-white/70 max-w-2xl">
                Every match is a REAL program with an official source URL — no random suggestions, no hallucinations. Ranked from {evaluated} source-linked scholarships in our library.
              </p>
            </div>
            <Button variant="outline" className="border-white/20 text-white/70 hover:text-white shrink-0" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4"/>Adjust
            </Button>
          </div>

          {/* Value strip */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-xs text-white/50">Matched scholarships</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="text-2xl font-bold text-emerald-400">${(totalWorth / 1000).toFixed(0)}K+</div>
              <div className="text-xs text-white/50">Total funding available</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="text-2xl font-bold text-[#D4AF37]">100%</div>
              <div className="text-xs text-white/50">Source-linked verified</div>
            </div>
          </div>
        </div>

        {matches.length === 0 && (
          <Card className="mt-8 border-white/10 bg-white/[0.02]">
            <CardContent className="p-8 text-center text-white/70">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-400 mb-3"/>
              <div className="font-medium text-white text-lg mb-2">No exact matches yet</div>
              <p className="text-sm max-w-md mx-auto">
                Try broadening your destination country selection, or removing the &ldquo;fully funded only&rdquo; filter &mdash; many great partial-funding programs exist.
              </p>
              <Button onClick={onReset} className="mt-5 bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                Adjust preferences
              </Button>
            </CardContent>
          </Card>
        )}

        {/* TEASER — first 3 matches fully visible */}
        {teaser.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
              <TrendingUp className="h-4 w-4"/> Top 3 best-fit matches — preview
            </div>
            <div className="grid gap-4">
              {teaser.map(m => <MatchCard key={m.slug} m={m}/>)}
            </div>
          </div>
        )}

        {/* PAYWALL BANNER — sits between teaser and locked rows */}
        {locked.length > 0 && !meActive && (
          <div className="mt-10 rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/15 via-[#0A0A0A] to-[#0A0A0A] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none"/>
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37]">
                <Crown className="h-4 w-4"/> {locked.length} more matches locked
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
                Unlock all {total} matches + apply-ready features
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl">
                See every match, deadline calendar, application links, AI Match reports, Cabinet document storage, Application Tracker and PDF export. <span className="text-[#D4AF37] font-medium">Instant access — no free trial, no credit-card gotchas.</span>
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2 max-w-3xl">
                {[
                  ['Unlock all 800 hand-verified scholarships', 'Deadlines + application links'],
                  ['Unlimited AI Match reports', 'Claude Sonnet 4.5 personalised'],
                  ['Application Readiness Score', 'PDF/DOCX upload + gap analysis'],
                  ['Cabinet + Application Tracker', 'Kanban board · deadline reminders'],
                ].map(([t, s]) => (
                  <div key={t} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>
                    <div>
                      <div className="text-white font-medium">{t}</div>
                      <div className="text-white/50 text-xs">{s}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setPaywallOpen(true)}
                  size="lg"
                  className="btn-gold btn-pill h-12 px-8 text-base font-semibold text-black"
                >
                  <Zap className="mr-2 h-4 w-4"/>Get started — from $7.42/mo
                </Button>
                <div className="text-xs text-white/50">
                  ✓ Instant access · ✓ Cancel anytime · ✓ 30-day money-back guarantee
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOCKED MATCHES — blurred, non-clickable */}
        {locked.length > 0 && (
          <div className="mt-10 relative">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
              <Lock className="h-4 w-4"/> {locked.length} more matches — {meActive ? 'unlocked' : 'unlock to view'}
            </div>
            <div className={`grid gap-4 ${meActive ? '' : 'pointer-events-none select-none'}`}>
              {locked.slice(0, meActive ? locked.length : 8).map(m => (
                <div key={m.slug} className="relative">
                  <div className={meActive ? '' : 'blur-[6px] opacity-70'}>
                    <MatchCard m={m}/>
                  </div>
                </div>
              ))}
            </div>
            {!meActive && locked.length > 8 && (
              <div className="mt-6 text-center text-sm text-white/50">
                + {locked.length - 8} additional matches hidden
              </div>
            )}
            {!meActive && (
              <div className="mt-8 text-center">
                <Button
                  onClick={() => setPaywallOpen(true)}
                  size="lg"
                  className="btn-gold btn-pill h-12 px-8 font-semibold text-black"
                >
                  <Crown className="mr-2 h-4 w-4"/>Unlock all {total} matches — from $7.42/mo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Trust footer */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-white/5 pt-8">
          {[
            ["800", "Hand-verified scholarships"],
            ['60', 'Countries covered'],
            ['100%', 'Source-linked'],
            ['0', 'Fake data'],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold text-white">{n}</div>
              <div className="text-xs text-white/50">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        matchCount={total}
        totalWorth={totalWorth}
      />
    </div>
  )
}

function MatchCard({ m }) {
  const score = Math.round(m.overall_fit_score || 0)
  const scoreColor = score >= 80 ? 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10'
                   : score >= 60 ? 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10'
                   : 'text-amber-300 border-amber-400/30 bg-amber-500/10'
  const warnings = Array.isArray(m.warnings) ? m.warnings : []
  const risk = m.risk_level || (warnings.length >= 2 ? 'high' : warnings.length === 1 ? 'medium' : 'low')
  const riskBadge = {
    high:   { cls: 'border-red-500/40 bg-red-500/10 text-red-300',    label: 'Reach — verify carefully', icon: ShieldAlert },
    medium: { cls: 'border-amber-400/40 bg-amber-500/10 text-amber-200', label: 'Some gaps to close',      icon: AlertCircle },
    low:    { cls: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300', label: 'Strong fit',        icon: CheckCircle2 },
  }[risk]
  const RiskIcon = riskBadge.icon

  return (
    <Card className="group overflow-hidden border-white/10 bg-white/[0.02] hover:border-white/25 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              <GraduationCap className="h-3.5 w-3.5"/><span className="truncate">{m.university_name}</span>
              <span className="opacity-40">·</span>
              <MapPin className="h-3.5 w-3.5"/><span>{m.country}</span>
              {m.trust_level && (<>
                <span className="opacity-40">·</span>
                <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]"/>
                <span className="text-[#D4AF37]">{m.trust_level}</span>
              </>)}
            </div>
            <h3 className="mt-1.5 text-lg font-semibold leading-snug text-white">{m.scholarship_name}</h3>
            {m.funding_amount && (
              <div className="mt-1 text-sm text-emerald-300/90">{m.funding_amount}</div>
            )}
            {m.deadline_status && (
              <div className="mt-1 text-xs text-white/50">Deadline: {m.deadline_status} — {m.deadline_note}</div>
            )}
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${riskBadge.cls}`}>
              <RiskIcon className="h-3 w-3"/>{riskBadge.label}
            </div>
          </div>
          <div className={`shrink-0 rounded-full border px-3 py-2 text-center ${scoreColor}`}>
            <div className="text-[10px] uppercase tracking-widest opacity-70">Fit</div>
            <div className="text-xl font-bold leading-none">{score}</div>
          </div>
        </div>

        {m.reasons?.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs uppercase tracking-widest text-white/40">Why you match</div>
            <ul className="space-y-1">
              {m.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* WHY NOT FIT — surface hard risks in red, so users skip application waste */}
        {warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-red-300">
              <XCircle className="h-3.5 w-3.5"/> Why this might NOT fit
            </div>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-100/90">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400"/>{w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {m.gaps?.length > 0 && warnings.length === 0 && (
          <div className="mt-3">
            <div className="mb-2 text-xs uppercase tracking-widest text-amber-300/80">Gaps to close</div>
            <ul className="space-y-1">
              {m.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-100/80">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"/>{g}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge className="bg-white/[0.06] text-white/80 border-white/10">{m.funding_type}</Badge>
          {(m.degree_levels || []).slice(0, 2).map(l => (
            <Badge key={l} variant="outline" className="border-white/15 text-white/70">{l}</Badge>
          ))}
          <div className="ml-auto flex gap-2">
            {m.source_url && (
              <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
                Source <ExternalLink className="h-3 w-3"/>
              </a>
            )}
            <a href={m.application_link || m.source_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                Apply <ExternalLink className="ml-1.5 h-3 w-3"/>
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Post-quiz loading experience — full-screen animated multi-step analysis.
// Sells the "AI Command Center" narrative and buys ~2.5s so the API
// response feels considered rather than instant.
// ---------------------------------------------------------------------------
function QuizAnalyzingLoader({ userName }) {
  const STEPS = [
    { label: 'Reading your profile',                     detail: 'Parsing 8 answers · normalising GPA + language scores' },
    { label: 'Applying eligibility filters',             detail: 'Nationality · degree level · field of study' },
    { label: 'Scoring against 800 hand-verified scholarships',    detail: 'Fit engine · deterministic · no hallucinations · no dead links' },
    { label: 'Ranking your top matches',                 detail: 'Sorting by fit score · surfacing risks + gaps' },
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(x => Math.min(STEPS.length - 1, x + 1)), 620)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.18),transparent_70%)]"/>
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]"/>
      <div className="container mx-auto max-w-2xl px-4 pt-32 pb-24 relative">
        <div className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
            <Sparkles className="h-7 w-7 text-[#D4AF37] animate-pulse"/>
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">
            {userName ? `${userName}, we're building your report` : 'Building your report'}
          </h1>
          <p className="mt-3 text-white/60">
            Analyzing your profile against every source-linked scholarship in our library.
          </p>
        </div>

        <Card className="mt-10 border-white/10 bg-white/[0.03]">
          <CardContent className="p-6 space-y-4">
            {STEPS.map((s, idx) => {
              const done = idx < i
              const active = idx === i
              return (
                <div key={s.label} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all
                    ${done ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400'
                          : active ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-white/15 text-white/30'}`}>
                    {done ? <CheckCircle2 className="h-4 w-4"/> : active ? <Loader2 className="h-4 w-4 animate-spin"/> : <span className="text-[10px]">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${done ? 'text-white/70' : active ? 'text-white' : 'text-white/40'}`}>
                      {s.label}
                    </div>
                    <div className={`text-xs ${active ? 'text-white/60' : 'text-white/30'}`}>{s.detail}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-white/40">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1 text-[#D4AF37]"/> No third-party AI is guessing your matches. Every result is scored against a REAL scholarship record.
        </div>
      </div>
    </div>
  )
}
