'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { store } from '@/lib/client-store'
import { toast } from 'sonner'
import { useAuth, buildSignInUrl } from '@/hooks/use-auth'
import { ArrowLeft, ArrowRight, Sparkles, Rocket, ShieldCheck, Brain, Compass, GraduationCap, Award, Globe, FileText, User, Calendar, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { key: 'basics', title: 'Basics', icon: <User className="h-4 w-4"/> },
  { key: 'origin', title: 'Nationality & country', icon: <Globe className="h-4 w-4"/> },
  { key: 'academic', title: 'Academics', icon: <GraduationCap className="h-4 w-4"/> },
  { key: 'scores', title: 'Scores', icon: <Award className="h-4 w-4"/> },
  { key: 'achievements', title: 'Achievements', icon: <Sparkles className="h-4 w-4"/> },
  { key: 'preferences', title: 'Preferences', icon: <Compass className="h-4 w-4"/> },
  { key: 'documents', title: 'Documents', icon: <FileText className="h-4 w-4"/> },
  { key: 'processing', title: 'AI processing', icon: <Brain className="h-4 w-4"/> },
]

const PROC_LINES = [
  'Analyzing your academic profile',
  'Checking eligibility signals across 68+ scholarships',
  'Comparing funding tiers and deadlines',
  'Running Claude Sonnet 4.5 fit analysis',
  'Ranking scholarships by your fit score',
  'Building your ScholarshipFit cabinet',
]

function Onboarding() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [i, setI] = useState(0)
  const [form, setForm] = useState({
    full_name: '', email: '', birthdate: '',
    nationality: '', current_country: '',
    current_level: '', degree_level: '', intended_major: '',
    gpa: '', gpa_scale: 4.0, ielts: '', toefl: '', sat: '', act: '', gre: '',
    achievements: '',
    preferred_countries: '', intake_year: '', annual_budget_usd: '',
    full_funding_only: true, partial_funding_ok: false,
    documents_ready: { passport: false, transcript: false, cv: false, motivation: false, recommendations: false, portfolio: false, research_proposal: false },
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [procIdx, setProcIdx] = useState(0)

  useEffect(() => {
    const cached = store.getProfile()
    if (cached) setForm(f => ({ ...f, ...cached, documents_ready: { ...f.documents_ready, ...(cached.documents_ready||{}) } }))
  }, [])

  // Auto-fill from Google sign-in — name & email from Emergent
  useEffect(() => {
    if (user && (!form.full_name || !form.email)) {
      setForm(f => ({
        ...f,
        full_name: f.full_name || user.name || '',
        email:     f.email     || user.email || '',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const signInWithGoogle = () => {
    if (typeof window === 'undefined') return
    window.location.href = buildSignInUrl(window.location.pathname)
  }

  const progress = useMemo(() => Math.round(((i + 1) / STEPS.length) * 100), [i])

  const next = () => setI(x => Math.min(STEPS.length - 1, x + 1))
  const back = () => setI(x => Math.max(0, x - 1))

  // Safe JSON fetch: never throws on HTML/timeout responses — returns a
  // structured { ok, data, error } object so we can show a friendly message
  // instead of crashing with "Unexpected token '<' ... is not valid JSON".
  const safeJsonFetch = async (url, init = {}, timeoutMs = 115000) => {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const r = await fetch(url, { ...init, signal: controller.signal, credentials: 'include' })
      clearTimeout(t)
      const ct = r.headers.get('content-type') || ''
      if (!ct.includes('application/json')) {
        const text = await r.text().catch(() => '')
        return { ok: false, status: r.status, error: `Non-JSON response (HTTP ${r.status}). Server may have timed out.`, snippet: text.slice(0, 140) }
      }
      const data = await r.json()
      if (!r.ok) return { ok: false, status: r.status, error: data.error || data.detail || `HTTP ${r.status}`, data }
      return { ok: true, status: r.status, data }
    } catch (e) {
      clearTimeout(t)
      if (e.name === 'AbortError') return { ok: false, error: 'The request took too long. Your matches are still being prepared — you can browse scholarships now and come back to your cabinet in a minute.', timeout: true }
      return { ok: false, error: `Network error: ${e.message}` }
    }
  }

  const finishAndMatch = async () => {
    const payload = {
      ...form,
      preferred_countries: typeof form.preferred_countries === 'string' ? form.preferred_countries.split(',').map(s=>s.trim()).filter(Boolean) : form.preferred_countries,
      gpa: form.gpa ? Number(form.gpa) : null,
      ielts: form.ielts ? Number(form.ielts) : null,
      toefl: form.toefl ? Number(form.toefl) : null,
      sat: form.sat ? Number(form.sat) : null,
      act: form.act ? Number(form.act) : null,
      gre: form.gre ? Number(form.gre) : null,
      annual_budget_usd: form.annual_budget_usd ? Number(form.annual_budget_usd) : null,
      intake_year: form.intake_year ? Number(form.intake_year) : null,
    }

    // 1) Persist profile (fast, ~200ms)
    const pr = await safeJsonFetch('/api/profiles', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...payload, id: store.getProfile()?.id }),
    }, 15000)
    if (!pr.ok) {
      toast.error('Could not save profile', { description: pr.error })
      setI(STEPS.length - 2)
      return
    }
    const profile = pr.data.profile
    store.setProfile(profile)
    // Also mirror to the DB cabinet if the user is signed in
    fetch('/api/cabinet/profile', {
      method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(profile),
    }).catch(() => {})

    // 2) Fire AI match (can take up to 90s on cache miss; ~100ms on cache hit)
    const mr = await safeJsonFetch('/api/match', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ profile }),
    }, 115000)

    if (!mr.ok) {
      // Timeout or ingress dropped the response — offer graceful fallback:
      // navigate to /database with the profile filters pre-applied so the
      // user still sees a curated scholarship list.
      const qs = new URLSearchParams()
      const c = (profile.preferred_countries || [])[0]
      if (c) qs.set('country', c)
      if (profile.degree_level)   qs.set('level', profile.degree_level)
      if (profile.intended_major) qs.set('field', profile.intended_major)
      toast.error('AI match is taking longer than expected', {
        description: 'Redirecting you to the database — your cabinet is saved. Try "Refresh matches" in the navbar in a minute.',
        duration: 6000,
      })
      router.push('/database' + (qs.toString() ? '?' + qs.toString() : ''))
      return
    }
    store.setRun(mr.data.run)
    router.push('/dashboard')
  }

  // Run processing effect when step index reaches the last step
  useEffect(() => {
    if (STEPS[i].key !== 'processing') return
    setProcIdx(0)
    // Slower cadence (2.8s per line) so the sequence lasts ~16s and stays
    // stuck on the last two lines during the long Claude call (up to ~90s).
    const iv = setInterval(() => {
      setProcIdx(x => Math.min(PROC_LINES.length - 1, x + 1))
    }, 2800)
    finishAndMatch()
    return () => clearInterval(iv)
    // eslint-disable-next-line
  }, [i])

  const step = STEPS[i].key

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="relative">
        <div className="container mx-auto max-w-4xl px-4 py-10 relative">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]"><ShieldCheck className="mr-1 h-3 w-3"/>Step {i+1} of {STEPS.length}</Badge>
            <p className="text-sm text-white/60">{STEPS[i].title}</p>
          </div>
          <Progress value={progress} className="mt-3 h-1.5 bg-white/5 [&>div]:bg-cyan-400"/>

          <Card className="mt-6 card-dark">
            <CardContent className="p-6 md:p-8">
              {step==='basics' && (
                <StepShell title="Let's start with the basics" caption="Your name and email so we can label your ScholarshipFit cabinet.">
                  {/* Google sign-in banner — mirrors ScholarshipOwl's registration UX.
                      Skipped once the user is signed in (shows a confirmation instead). */}
                  {!user ? (
                    <div className="mb-5 rounded-2xl border border-[#D4AF37]/25 bg-black/60 backdrop-blur px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-medium">Sign up with Google to save your cabinet</p>
                          <p className="text-xs text-white/60 mt-0.5">One click. Your matches persist across devices.</p>
                        </div>
                        <Button
                          type="button"
                          onClick={signInWithGoogle}
                          disabled={authLoading}
                          className="h-11 px-5 rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow-md"
                        >
                          <GoogleG className="mr-2 h-5 w-5"/> Continue with Google
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-white/40">
                        <div className="flex-1 h-px bg-white/10"/> OR CONTINUE MANUALLY <div className="flex-1 h-px bg-white/10"/>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#D4AF37]/25 bg-black/60 px-4 py-3">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover"/>
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-sm font-medium">
                          {(user.name || user.email || '?').trim()[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">Signed in as {user.name || user.email}</p>
                        <p className="text-xs text-[#D4AF37]/80 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/>Cabinet linked to your account</p>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First & Last name" val={form.full_name} on={v=>upd('full_name',v)} placeholder="Aisha Khan"/>
                    <Field label="Email" val={form.email} on={v=>upd('email',v)} placeholder="you@email.com" type="email"/>
                    <Field label="Birthdate" val={form.birthdate} on={v=>upd('birthdate',v)} placeholder="YYYY-MM-DD" type="date"/>
                  </div>
                </StepShell>
              )}

              {step==='origin' && (
                <StepShell title="Where are you from?" caption="Nationality strongly affects scholarship eligibility.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nationality" val={form.nationality} on={v=>upd('nationality',v)} placeholder="Pakistan"/>
                    <Field label="Current country of residence" val={form.current_country} on={v=>upd('current_country',v)} placeholder="Pakistan"/>
                  </div>
                </StepShell>
              )}

              {step==='academic' && (
                <StepShell title="Your academic path" caption="Current level, target degree, and field of study.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="Current school level" val={form.current_level} on={v=>upd('current_level',v)} options={['High school','Bachelor in progress','Bachelor completed','Master in progress','Master completed','Working professional']}/>
                    <SelectField label="Target degree" val={form.degree_level} on={v=>upd('degree_level',v)} options={['Bachelor','Master','PhD','Research program']}/>
                    <Field className="sm:col-span-2" label="Field of study / major" val={form.intended_major} on={v=>upd('intended_major',v)} placeholder="Mechanical Engineering"/>
                  </div>
                </StepShell>
              )}

              {step==='scores' && (
                <StepShell title="Academic scores" caption="Only what you have. Leave blank if not applicable.">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="GPA" val={form.gpa} on={v=>upd('gpa',v)} placeholder="3.7" type="number"/>
                    <SelectField label="GPA scale" val={String(form.gpa_scale)} on={v=>upd('gpa_scale', Number(v))} options={['4','5','10','100']}/>
                    <Field label="IELTS" val={form.ielts} on={v=>upd('ielts',v)} placeholder="7.0" type="number"/>
                    <Field label="TOEFL" val={form.toefl} on={v=>upd('toefl',v)} placeholder="100" type="number"/>
                    <Field label="SAT" val={form.sat} on={v=>upd('sat',v)} placeholder="1450" type="number"/>
                    <Field label="ACT" val={form.act} on={v=>upd('act',v)} placeholder="32" type="number"/>
                    <Field label="GRE" val={form.gre} on={v=>upd('gre',v)} placeholder="325" type="number"/>
                  </div>
                </StepShell>
              )}

              {step==='achievements' && (
                <StepShell title="Achievements & experience" caption="Free-text — awards, olympiads, leadership, research, volunteering, work, portfolio.">
                  <textarea value={form.achievements} onChange={e=>upd('achievements', e.target.value)} rows={6} placeholder="e.g. 2x national robotics finalist, 1 year research internship in fluid dynamics, volunteer STEM mentor..." className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"/>
                </StepShell>
              )}

              {step==='preferences' && (
                <StepShell title="Preferences" caption="Countries, intake, budget, and funding requirements.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" label="Preferred countries (comma-separated)" val={typeof form.preferred_countries === 'string' ? form.preferred_countries : (form.preferred_countries||[]).join(', ')} on={v=>upd('preferred_countries',v)} placeholder="Germany, Italy, Canada"/>
                    <Field label="Intake year" val={form.intake_year} on={v=>upd('intake_year',v)} placeholder="2026" type="number"/>
                    <Field label="Annual budget (USD)" val={form.annual_budget_usd} on={v=>upd('annual_budget_usd',v)} placeholder="3000" type="number"/>
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"><span className="text-sm text-white">Full funding only</span><Switch checked={form.full_funding_only} onCheckedChange={v=>upd('full_funding_only',v)}/></div>
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"><span className="text-sm text-white">Partial funding acceptable</span><Switch checked={form.partial_funding_ok} onCheckedChange={v=>upd('partial_funding_ok',v)}/></div>
                  </div>
                </StepShell>
              )}

              {step==='documents' && (
                <StepShell title="Documents you already have" caption="Check what's ready. Missing items will appear on your dashboard checklist.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['passport','Passport'],['transcript','Academic transcript'],['cv','CV / Résumé'],['motivation','Motivation letter'],['recommendations','Recommendation letters'],['portfolio','Portfolio'],['research_proposal','Research proposal'],
                    ].map(([k,label])=>(
                      <label key={k} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 cursor-pointer hover:border-[#D4AF37]/30">
                        <Checkbox checked={!!form.documents_ready[k]} onCheckedChange={v=>upd('documents_ready',{...form.documents_ready,[k]:!!v})}/>
                        <span className="text-sm text-white">{label}</span>
                      </label>
                    ))}
                  </div>
                </StepShell>
              )}

              {step==='processing' && (
                <div className="text-center py-6">
                  <div className="relative mx-auto h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30" style={{animation:'orbit 6s linear infinite'}}/>
                    <div className="absolute inset-3 rounded-full border border-[#D4AF37]/40" style={{animation:'orbit 4s linear infinite reverse'}}/>
                    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-400/40 to-indigo-500/30 blur-md"/>
                    <div className="absolute inset-8 rounded-full bg-cyan-400"/>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-white">Building your ScholarshipFit shortlist</h3>
                  <p className="mt-1 text-sm text-white/60">Claude Sonnet 4.5 is analyzing your profile against every source-linked record.</p>
                  <ul className="mt-6 mx-auto max-w-md space-y-2 text-left">
                    {PROC_LINES.map((l, idx) => (
                      <li key={idx} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${idx <= procIdx ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]' : 'border-white/10 bg-white/[0.04] text-white/40'}`}>
                        <span className={`h-2 w-2 rounded-full ${idx <= procIdx ? 'bg-cyan-300' : 'bg-slate-600'}`}/>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step!=='processing' && (
                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" onClick={back} disabled={i===0} className="text-white/80 hover:text-white hover:bg-white/5"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>
                  {i < STEPS.length - 2 ? (
                    <Button onClick={next} className="btn-gold btn-pill font-medium">Continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  ) : (
                    <Button onClick={next} className="btn-gold btn-pill font-medium"><Rocket className="mr-2 h-4 w-4"/>Run AI Match</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-white/40">ScholarshipFit provides informational scholarship research only. It does not guarantee admission, scholarships, visas, or funding.</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function StepShell({ title, caption, children }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/60">{caption}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function Field({ label, val, on, placeholder, type='text', className='' }) {
  return (
    <div className={className}>
      <label className="text-[11px] uppercase tracking-widest text-white/60">{label}</label>
      <Input type={type} placeholder={placeholder} value={val} onChange={e=>on(e.target.value)} className="mt-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"/>
    </div>
  )
}

function SelectField({ label, val, on, options }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-white/60">{label}</label>
      <Select value={val} onValueChange={on}>
        <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white"><SelectValue placeholder="Select"/></SelectTrigger>
        <SelectContent>{options.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

/* Official-style Google "G" — inline SVG so it works without loading external assets. */
function GoogleG({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

export default Onboarding
