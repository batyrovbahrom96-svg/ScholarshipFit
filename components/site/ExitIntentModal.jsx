'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, ShieldCheck, Check, Loader2, Lock } from 'lucide-react'
import { track } from '@/lib/analytics'

/* ============================================================================
   ExitIntentModal — one-shot exit-intent capture (per session).
   • Trigger: pointer moves toward the very top of the viewport (Y ≤ 10) on
     desktop OR the tab becomes hidden (mobile fallback), AFTER 15s dwell.
   • Once dismissed or converted, we set a sessionStorage flag so we don't
     nag repeatedly.
   • Suppressed on /pricing (dedicated conversion page), /login, /signup,
     /dashboard/* (already signed-in territory), and the calendar itself.
   • Payload: POST /api/lead-magnet with {email, source, intent}. The backend
     upserts into `leads`, tags for launch-day founder outreach, and returns
     a download URL for the deadline-calendar page.
   ============================================================================ */

const STORAGE_KEY = 'sf_exit_intent_seen_v1'

const SUPPRESSED_PATH_PREFIXES = [
  '/pricing',
  '/login', '/signup', '/register',
  '/dashboard',
  '/deadline-calendar',
  '/admin',
]

function isSuppressedPath() {
  if (typeof window === 'undefined') return true
  const p = window.location.pathname
  return SUPPRESSED_PATH_PREFIXES.some(pref => p === pref || p.startsWith(pref + '/'))
}

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [dlUrl, setDlUrl] = useState('/deadline-calendar')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isSuppressedPath()) return
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return
    } catch { /* private mode */ }

    let armed = false
    const armAfterDwell = setTimeout(() => { armed = true }, 15000)

    const onMouseLeave = (e) => {
      if (!armed || open) return
      // Only fire on TOP-edge exits (typical exit-intent behaviour) — not sides/bottom.
      if (e.clientY <= 10 && e.relatedTarget == null) {
        setOpen(true)
      }
    }
    const onVisibility = () => {
      if (!armed || open) return
      if (document.visibilityState === 'hidden') {
        // Mobile / tab-switch fallback — only trigger if the page had focus
        // (avoids firing on initial page-load Wake events on some devices).
        setOpen(true)
      }
    }

    document.addEventListener('mouseout', onMouseLeave)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(armAfterDwell)
      document.removeEventListener('mouseout', onMouseLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
  }

  const submit = async (e) => {
    e?.preventDefault?.()
    const clean = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return
    setBusy(true)
    try {
      const r = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clean,
          source: 'exit-intent',
          intent: 'deadline-calendar',
          context: { path: window.location.pathname, ref: document.referrer || null },
        }),
      })
      const d = await r.json()
      if (d?.download_url) setDlUrl(d.download_url)
      setDone(true)
      try {
        track.exitIntentCaptured({
          source: 'exit-intent',
          intent: 'deadline-calendar',
          path: window.location.pathname,
          email_domain: clean.split('@')[1] || '',
        })
      } catch { /* ignore */ }
      try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    } catch { /* ignore network hiccups */ }
    finally { setBusy(false) }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
      onClick={close}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#D4AF37]/30 bg-black p-7 md:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 50px 100px -20px rgba(212,175,55,0.35)' }}
      >
        {/* soft gold glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#D4AF37]/15 blur-3xl" aria-hidden/>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#D4AF37]/8 blur-3xl" aria-hidden/>

        <button
          onClick={close}
          className="absolute top-3 right-3 h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 inline-flex items-center justify-center z-10"
          aria-label="Close"
        >✕</button>

        {!done ? (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-[#D4AF37]"/>
            </div>
            <div className="mt-4 mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
              <Lock className="h-3 w-3"/> Free · No card required
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-white leading-tight">
              Wait — grab the <span className="text-[#D4AF37]">2026 Scholarship Deadline Calendar</span>
            </h2>
            <p className="mt-3 text-sm md:text-[15px] text-white/70 leading-relaxed">
              Every one of our <span className="text-white font-medium">303 source-linked scholarships</span> — sorted by deadline. Printable. Share-worthy. Yours in 10 seconds.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37] shrink-0"/> Sorted by real deadline (nearest first)</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37] shrink-0"/> Official source URLs on every entry</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37] shrink-0"/> Founder-price launch email — no spam</li>
            </ul>

            <form onSubmit={submit} className="mt-5">
              <label className="text-[11px] uppercase tracking-widest text-white/50">Your email</label>
              <div className="mt-1 flex gap-2">
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF37]"
                  autoFocus
                />
                <Button type="submit" disabled={busy} className="h-11 px-5 btn-gold btn-pill font-semibold disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <>Send me the calendar <ArrowRight className="ml-2 h-4 w-4"/></>}
                </Button>
              </div>
            </form>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck className="h-3 w-3"/> One email · No spam · Unsubscribe any time
            </p>
          </>
        ) : (
          <div className="text-center py-2">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              <Check className="h-8 w-8 text-[#D4AF37]"/>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">You&apos;re in.</h2>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Your 2026 Scholarship Deadline Calendar is ready. We&apos;ll also email your locked-in founder pricing on launch day.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href={dlUrl}>
                <Button className="w-full sm:w-auto h-11 btn-gold btn-pill font-semibold">
                  View the calendar <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <Button onClick={close} variant="outline" className="w-full sm:w-auto h-11 border-white/15 bg-transparent text-white hover:bg-white/5">
                Keep browsing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
