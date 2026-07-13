'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles, FileText, PenLine, Award, GraduationCap, FlaskConical,
  ArrowRight, ArrowLeft, Loader2, Copy, RefreshCw, Check, AlertCircle,
  Trophy, Bot, Lock, ChevronRight
} from 'lucide-react'

/*
  ================================================================
  Essay/SOP Generator — the killer conversion feature.
  ----------------------------------------------------------------
  4-step wizard:
    1. Pick essay type
    2. Scholarship context
    3. Profile snapshot + why-this-scholarship
    4. Prompts to address + tone/length
  Then generate → display essay with copy/save/regenerate.
  ================================================================
*/

const ESSAY_TYPES = [
  { key: 'sop',                 label: 'Statement of Purpose',      body: 'The most common. Academic + career vision + fit.', icon: GraduationCap },
  { key: 'personal_statement',  label: 'Personal Statement',        body: 'Story-driven. Focus on personal journey and identity.', icon: PenLine },
  { key: 'motivation_letter',   label: 'Motivation Letter',         body: 'Why this program, why now. Direct and passionate.', icon: Award },
  { key: 'cover_letter',        label: 'Cover Letter',              body: 'Professional application cover. Concise and evidence-first.', icon: FileText },
  { key: 'research_proposal',   label: 'Research Proposal Intro',   body: 'Master\'s / PhD research direction with methodology.', icon: FlaskConical },
]

const TONES = [
  { key: 'confident',    label: 'Confident',    body: 'Direct. Achievement-first. For high-competition scholarships.' },
  { key: 'reflective',   label: 'Reflective',   body: 'Thoughtful. Story-driven. Personal growth arc.' },
  { key: 'story-driven', label: 'Story-driven', body: 'Opens with a scene. Builds narrative tension throughout.' },
]

export default function EssayGeneratorPage() {
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')
  const [result, setResult] = useState(null)
  const [me, setMe] = useState(null)

  // Form state
  const [essayType, setEssayType] = useState('sop')
  const [scholarship, setScholarship] = useState({ name: '', provider: '', country: '', field: '', mission: '' })
  const [profile, setProfile] = useState({
    name: '', nationality: '', current_role: '', background: '',
    target_program: '', career_goals: '', achievements: '', why_this_scholarship: '', personal_angle: '',
  })
  const [prompts, setPrompts] = useState('')
  const [wordCount, setWordCount] = useState(700)
  const [tone, setTone] = useState('confident')

  // Load user
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => setMe(d?.user || d || null))
      .catch(() => {})
  }, [])

  const isPaid = !!(me?.subscription && (
    me.subscription.plan === 'lifetime' ||
    me.subscription.status === 'active' ||
    me.subscription.status === 'trialing'
  ))

  const canProceed = useMemo(() => {
    if (step === 1) return !!essayType
    if (step === 2) return scholarship.name.trim().length > 0
    if (step === 3) return profile.name.trim().length > 0 && profile.background.trim().length > 20
    if (step === 4) return true
    return false
  }, [step, essayType, scholarship, profile])

  const generate = async () => {
    setBusy(true); setErr(''); setResult(null)
    try {
      const body = {
        essay_type: essayType,
        scholarship: {
          name:     scholarship.name.trim(),
          provider: scholarship.provider.trim(),
          country:  scholarship.country.trim(),
          field:    scholarship.field.trim(),
          mission:  scholarship.mission.trim(),
        },
        profile: {
          ...profile,
          achievements: profile.achievements.split(/[\n;]/).map(s => s.trim()).filter(Boolean),
        },
        prompts: prompts.split('\n').map(s => s.trim()).filter(Boolean),
        word_count: Number(wordCount) || 700,
        tone,
      }
      const r = await fetch('/api/essays/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 402) {
          setErr(j.message || 'Free-tier limit reached — upgrade for unlimited essays.')
        } else {
          setErr(j.message || j.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setResult(j)
      setStep(5)
    } catch (e) {
      setErr('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setStep(1); setResult(null); setErr('')
  }

  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#E7C766]">
            <Sparkles className="h-3 w-3"/> Powered by Claude Sonnet 4.5
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            AI Essay & SOP{' '}
            <span className="bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">Generator.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-white/60 leading-relaxed">
            Give us your profile + a scholarship. We&apos;ll draft a first-person essay outline that opens with a specific moment,
            weaves in your real achievements, and closes with a clear career vision. <span className="text-white/80">You review, edit, and submit it yourself</span> through the scholarship provider&apos;s official application page.{' '}
            <Link href="/how-our-ai-works" className="text-[#F0D77A] underline decoration-white/20 hover:decoration-white/60">How our AI works →</Link>
          </p>
        </div>

        {/* Stepper */}
        {step < 5 && (
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { n: 1, label: 'Essay type' },
              { n: 2, label: 'Scholarship' },
              { n: 3, label: 'About you' },
              { n: 4, label: 'Prompts + tone' },
            ].map((s, i) => {
              const done = step > s.n
              const active = step === s.n
              return (
                <div key={s.n} className="flex items-center shrink-0">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs
                    ${done   ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                    : active ? 'border-[#D4AF37]/60 bg-[#D4AF37]/12 text-[#F0D77A]'
                    :          'border-white/10 bg-white/[0.02] text-white/40'}`}>
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold
                      ${done ? 'bg-emerald-400 text-black' : active ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/60'}`}>
                      {done ? <Check className="h-2.5 w-2.5"/> : s.n}
                    </span>
                    {s.label}
                  </div>
                  {i < 3 && <ChevronRight className="h-3.5 w-3.5 mx-1 text-white/20 shrink-0"/>}
                </div>
              )
            })}
          </div>
        )}

        {/* Error banner */}
        {err && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/>
            <div className="flex-1">
              <div>{err}</div>
              {err.includes('limit') && (
                <Link href="/pricing" className="mt-1 inline-flex items-center gap-1 text-[#F0D77A] hover:text-white">
                  See plans <ArrowRight className="h-3 w-3"/>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* STEP 1 — Essay type */}
        {step === 1 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">What kind of essay?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {ESSAY_TYPES.map(t => {
                const Icon = t.icon
                const active = essayType === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setEssayType(t.key)}
                    className={`text-left rounded-2xl border p-5 transition-all ${
                      active
                        ? 'border-[#D4AF37]/50 bg-[#D4AF37]/8 ring-1 ring-[#D4AF37]/25'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0
                        ${active ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/70'}`}>
                        <Icon className="h-4 w-4"/>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white">{t.label}</div>
                        <div className="mt-0.5 text-sm text-white/55">{t.body}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* STEP 2 — Scholarship */}
        {step === 2 && (
          <section>
            <h2 className="text-xl font-semibold mb-1">Which scholarship?</h2>
            <p className="text-sm text-white/50 mb-4">The more you fill in, the more the essay can tie your story to this specific scholarship&apos;s values.</p>
            <div className="grid gap-3">
              <Field label="Scholarship name" required>
                <Input placeholder="e.g. Chevening Scholarship, DAAD EPOS, Fulbright" value={scholarship.name}
                  onChange={e => setScholarship({...scholarship, name: e.target.value})}/>
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Provider / Body">
                  <Input placeholder="UK Foreign Office" value={scholarship.provider}
                    onChange={e => setScholarship({...scholarship, provider: e.target.value})}/>
                </Field>
                <Field label="Host country">
                  <Input placeholder="United Kingdom" value={scholarship.country}
                    onChange={e => setScholarship({...scholarship, country: e.target.value})}/>
                </Field>
              </div>
              <Field label="Field / Target program">
                <Input placeholder="MPP at LSE, MSc in Data Science" value={scholarship.field}
                  onChange={e => setScholarship({...scholarship, field: e.target.value})}/>
              </Field>
              <Field label="Provider's mission (optional but powerful)" hint="Copy a sentence from their About page if you have it — the essay will echo it.">
                <Textarea rows={3} placeholder="e.g. Chevening seeks emerging leaders to strengthen UK ties with their home country."
                  value={scholarship.mission}
                  onChange={e => setScholarship({...scholarship, mission: e.target.value})}/>
              </Field>
            </div>
          </section>
        )}

        {/* STEP 3 — Profile */}
        {step === 3 && (
          <section>
            <h2 className="text-xl font-semibold mb-1">Tell us about you.</h2>
            <p className="text-sm text-white/50 mb-4">Be specific — vague inputs make vague essays. The AI will use every concrete detail.</p>
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Full name" required><Input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}/></Field>
                <Field label="Nationality"><Input placeholder="Uzbek" value={profile.nationality} onChange={e => setProfile({...profile, nationality: e.target.value})}/></Field>
              </div>
              <Field label="Current role / occupation">
                <Input placeholder="Product Manager at fintech startup" value={profile.current_role}
                  onChange={e => setProfile({...profile, current_role: e.target.value})}/>
              </Field>
              <Field label="Academic + professional background" required hint="Include degree(s), years of experience, and a couple of context points.">
                <Textarea rows={4} placeholder="BSc Computer Science, Tashkent Uni (2020). 4 years building payment systems at 2 Y-Combinator fintechs. Led team of 6..."
                  value={profile.background} onChange={e => setProfile({...profile, background: e.target.value})}/>
              </Field>
              <Field label="Career goals — what you'll do AFTER the scholarship" hint="Concrete plans, not vague aspirations.">
                <Textarea rows={3} placeholder="Return to Uzbekistan to launch the country's first open-banking API for underbanked SMEs..."
                  value={profile.career_goals} onChange={e => setProfile({...profile, career_goals: e.target.value})}/>
              </Field>
              <Field label="Achievements (one per line — pick the top 3-5)">
                <Textarea rows={4} placeholder={"Founded ScholarshipFit (used by 4,000+ students)\nScaled payments product from 0 → 50k users\nSpoke at Fintech Uzbekistan 2025"}
                  value={profile.achievements} onChange={e => setProfile({...profile, achievements: e.target.value})}/>
              </Field>
              <Field label="In one sentence — why THIS scholarship (not just any)?">
                <Textarea rows={2} placeholder="Chevening's focus on emerging leaders returning to their home country aligns with my 5-year mission to modernize Uzbek public services."
                  value={profile.why_this_scholarship} onChange={e => setProfile({...profile, why_this_scholarship: e.target.value})}/>
              </Field>
              <Field label="Unique personal detail" hint="An unusual angle only YOU have — hobby, family story, unexpected turn. This becomes your hook.">
                <Textarea rows={2} placeholder="e.g. I grew up in a village without stable electricity. Building a payments product for offline-first users is personal — my mother still can't reliably use a card at our local market."
                  value={profile.personal_angle} onChange={e => setProfile({...profile, personal_angle: e.target.value})}/>
              </Field>
            </div>
          </section>
        )}

        {/* STEP 4 — Prompts + tone */}
        {step === 4 && (
          <section>
            <h2 className="text-xl font-semibold mb-1">Final touches.</h2>
            <p className="text-sm text-white/50 mb-4">Copy the exact essay prompts from the scholarship application if you have them.</p>
            <div className="grid gap-4">
              <Field label="Essay prompts (one per line — optional)" hint="Paste the actual scholarship application questions. Each will be addressed in the essay.">
                <Textarea rows={5} placeholder={"Why do you want to study in the UK?\nDescribe your leadership experience.\nHow will you contribute to your home country upon return?"}
                  value={prompts} onChange={e => setPrompts(e.target.value)}/>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">Tone</label>
                  <div className="space-y-2">
                    {TONES.map(t => (
                      <button key={t.key} onClick={() => setTone(t.key)}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                          tone === t.key
                            ? 'border-[#D4AF37]/50 bg-[#D4AF37]/8'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                        }`}>
                        <div className="text-sm font-medium text-white">{t.label}</div>
                        <div className="text-[11px] text-white/50 mt-0.5">{t.body}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">Word count target</label>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-3xl font-semibold text-white tabular-nums">{wordCount}<span className="text-sm text-white/40 font-normal ml-2">words</span></div>
                    <input type="range" min={250} max={1200} step={50}
                      value={wordCount} onChange={e => setWordCount(Number(e.target.value))}
                      className="w-full mt-3 accent-[#D4AF37]"/>
                    <div className="mt-1 flex justify-between text-[10px] text-white/40 tabular-nums">
                      <span>250</span><span>700 (typical)</span><span>1200</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access notice */}
              {!isPaid && (
                <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] p-4 flex items-start gap-3">
                  <Lock className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0"/>
                  <div className="text-sm">
                    <div className="text-white font-medium">
                      {me ? 'Free tier: 3 essays / 30 days' : 'Sign in to save your essays'}
                    </div>
                    <div className="text-white/60 mt-0.5">
                      {me ? <>Upgrade to <Link href="/pricing" className="text-[#F0D77A] underline decoration-white/20 hover:decoration-white/60">any paid plan</Link> for unlimited essays + Cabinet history.</>
                          : <><Link href="/signup" className="text-[#F0D77A] underline decoration-white/20 hover:decoration-white/60">Sign up free</Link> to save this essay and get 3 more this month.</>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* STEP 5 — Result */}
        {step === 5 && result && (
          <ResultView result={result} onReset={reset} onRegenerate={generate} busy={busy}/>
        )}

        {/* Nav buttons */}
        {step < 5 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
              className="border-white/15 hover:border-white/30">
              <ArrowLeft className="h-4 w-4 mr-1"/> Back
            </Button>

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed}
                className="btn-gold btn-pill font-semibold px-6">
                Continue <ArrowRight className="h-4 w-4 ml-1"/>
              </Button>
            ) : (
              <Button onClick={generate} disabled={busy || !canProceed}
                className="btn-gold btn-pill font-semibold px-6 disabled:opacity-60">
                {busy ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Drafting essay…</>) : (<><Sparkles className="h-4 w-4 mr-2"/> Generate essay</>)}
              </Button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

/* ============================================================
   Result view
   ============================================================ */
function ResultView({ result, onReset, onRegenerate, busy }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(result.essay || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Essay itself (main column) */}
      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="inline-flex items-center gap-2 text-xs text-white/60">
            <Trophy className="h-3.5 w-3.5 text-[#D4AF37]"/>
            Draft ready · <span className="tabular-nums font-medium text-white">{result.word_count}</span> words
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={copy} className="h-8 border-white/15 hover:border-white/30">
              {copied ? <><Check className="h-3.5 w-3.5 mr-1"/> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1"/> Copy</>}
            </Button>
            <Button size="sm" variant="outline" onClick={onRegenerate} disabled={busy} className="h-8 border-white/15 hover:border-white/30">
              {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin"/> : <RefreshCw className="h-3.5 w-3.5 mr-1"/>}
              Regenerate
            </Button>
          </div>
        </div>

        {/* Essay body */}
        <article className="prose prose-invert max-w-none">
          {result.essay.split('\n\n').map((para, i) => (
            <p key={i} className="text-white/85 leading-relaxed mb-4 whitespace-pre-wrap">{para}</p>
          ))}
        </article>

        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onReset} className="text-white/60 hover:text-white">
            ← Start a new essay
          </Button>
          <Link href="/dashboard" className="text-sm text-[#F0D77A] hover:text-white inline-flex items-center gap-1">
            View saved essays in Cabinet <ArrowRight className="h-3.5 w-3.5"/>
          </Link>
        </div>
      </div>

      {/* Sidebar: coaching notes */}
      <aside className="space-y-4 lg:sticky lg:top-24 self-start">
        {result.opening_hook && (
          <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-2">Opening choice</div>
            <div className="text-sm text-white/80 leading-relaxed">{result.opening_hook}</div>
          </div>
        )}

        {result.key_points_woven?.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
              <Bot className="h-3 w-3"/> Woven in
            </div>
            <ul className="text-[13px] text-white/70 space-y-1.5">
              {result.key_points_woven.map((p, i) => (
                <li key={i} className="flex items-start gap-2"><Check className="h-3 w-3 text-emerald-400 mt-1 shrink-0"/><span>{p}</span></li>
              ))}
            </ul>
          </div>
        )}

        {result.suggestions?.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Next iteration</div>
            <ul className="text-[13px] text-white/70 space-y-1.5">
              {result.suggestions.map((p, i) => (
                <li key={i} className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-[#D4AF37] mt-1 shrink-0"/><span>{p}</span></li>
              ))}
            </ul>
          </div>
        )}

        {result.essays_used_month != null && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-white/50">
            <div className="tabular-nums font-medium text-white">
              {result.essays_used_month} / {result.essays_limit_month}
            </div>
            <div className="mt-0.5">free essays used this month</div>
            <Link href="/pricing" className="mt-2 inline-flex text-[#F0D77A] hover:text-white text-[11px]">
              Unlock unlimited →
            </Link>
          </div>
        )}
      </aside>
    </div>
  )
}

/* ============================================================
   Small helpers
   ============================================================ */
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-white/85 mb-1.5 block">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-white/40">{hint}</div>}
    </div>
  )
}
