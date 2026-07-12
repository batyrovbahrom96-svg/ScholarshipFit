'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Linkedin, ShieldCheck, ArrowRight, Loader2, CheckCircle2, Quote as QuoteIcon } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export default function ShareYourStoryClient() {
  const [form, setForm] = useState({
    name: '', email: '', linkedin_url: '', country: '', university: '',
    scholarship: '', year: new Date().getFullYear(), quote: '', permission: false,
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err,  setErr]  = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.name.trim() || !form.email.trim() || !form.linkedin_url.trim() || !form.scholarship.trim() || !form.quote.trim()) {
      setErr('Please fill in the required fields.'); return
    }
    if (!/^https?:\/\/(www\.)?linkedin\.com\//i.test(form.linkedin_url)) {
      setErr('LinkedIn URL must start with https://www.linkedin.com/'); return
    }
    if (!form.permission) {
      setErr('Please confirm you’re OK with us featuring your story.'); return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'Something went wrong'); setBusy(false); return }
      try { trackEvent('testimonial_submitted', { has_photo: false }) } catch {/* ignore */}
      setDone(true)
    } catch {
      setErr('Network error — please try again')
    } finally { setBusy(false) }
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-14 md:py-20">
        {done ? (
          <Card className="border-emerald-500/30 bg-emerald-500/[0.05]">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400"/>
              <h1 className="mt-4 text-2xl font-semibold text-white">Thank you — your story is in review</h1>
              <p className="mt-3 text-white/70 leading-relaxed">
                We’ll verify your LinkedIn profile and your scholarship, then reach out via email before publishing. This usually takes 2–5 business days. Once verified, your story appears on our public testimonials wall with a link to your LinkedIn profile.
              </p>
              <div className="mt-6"><Link href="/"><Button className="btn-gold btn-pill">Back to home</Button></Link></div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <QuoteIcon className="h-3.5 w-3.5"/> Share your scholarship story
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white leading-tight">Tell us how it went.</h1>
            <p className="mt-3 text-white/60 max-w-xl">
              If ScholarshipFit helped you win (or shortlist) a scholarship — even in a small way — we’d love to feature your story. We manually verify every submission via LinkedIn so readers can trust that every quote is real.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name*"       value={form.name}         onChange={set('name')}         placeholder="e.g. Adaora Okafor"/>
                <Field label="Email*"           type="email"              value={form.email}        onChange={set('email')}        placeholder="we’ll only email to verify"/>
              </div>
              <Field label="LinkedIn profile URL*" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://www.linkedin.com/in/…" icon={<Linkedin className="h-4 w-4 text-[#0A66C2]"/>}/>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Country"          value={form.country}      onChange={set('country')}      placeholder="Nigeria"/>
                <Field label="Year won/started" type="number"             value={form.year}         onChange={set('year')}         placeholder="2026"/>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Scholarship*"     value={form.scholarship}  onChange={set('scholarship')}  placeholder="e.g. Chevening Scholarship"/>
                <Field label="University (if applicable)" value={form.university} onChange={set('university')} placeholder="e.g. University of Oxford"/>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50">Your story* <span className="text-white/30">(2–4 sentences)</span></label>
                <Textarea
                  value={form.quote}
                  onChange={set('quote')}
                  rows={5}
                  placeholder="What did ScholarshipFit help you do? Be specific — what changed, what you avoided, what surprised you."
                  className="mt-1 bg-white/[0.04] border-white/15 text-white"
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.permission}
                  onChange={(e) => setForm({ ...form, permission: e.target.checked })}
                  className="mt-1 h-4 w-4"
                />
                <span>I&apos;m OK with ScholarshipFit featuring my name, quote, and LinkedIn profile link on their website once verified. I can request removal any time.</span>
              </label>

              {err && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Button type="submit" disabled={busy} className="btn-gold btn-pill h-11 px-6 font-semibold">
                  {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting…</> : <>Submit story <ArrowRight className="ml-2 h-4 w-4"/></>}
                </Button>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/> We verify every submission before publishing
                </span>
              </div>
            </form>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

function Field({ label, icon, ...props }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-white/50">{label}</label>
      <div className="mt-1 relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <Input {...props} className={`${icon ? 'pl-9 ' : ''}bg-white/[0.04] border-white/15 text-white`}/>
      </div>
    </div>
  )
}
