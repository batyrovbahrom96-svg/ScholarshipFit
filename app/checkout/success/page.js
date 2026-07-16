'use client'
// Payment success interstitial — where Dodo's return_url lands the user
// after a successful checkout. The subscription-activation is asynchronous
// (webhook can take 3-30s to arrive), so we:
//
//   1) Poll GET /api/auth/me every 2s (max 60s)
//   2) The moment `subscription_active === true` shows up → refresh the auth
//      context and redirect to /dashboard
//   3) If it never activates → show a support-contact fallback (webhook may
//      have failed signature verification or crashed)
//
// This eliminates the "I just paid but still see the paywall" experience.

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

function CheckoutSuccessInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useAuth()
  const planFromUrl = (searchParams.get('plan') || '').toLowerCase()
  const [status, setStatus] = useState('waiting') // waiting | active | timeout
  const [elapsed, setElapsed] = useState(0)
  const [plan, setPlan] = useState(planFromUrl || null)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const maxAttempts = 30 // 30 attempts × 2s = 60s max wait
    const poll = async () => {
      if (cancelled) return
      attempts += 1
      setElapsed(attempts * 2)
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        const j = await r.json()
        const sub = j?.user?.subscription
        const active = j?.user?.subscription_active === true
          || sub?.status === 'active'
          || sub?.status === 'trialing'
          || sub?.status === 'lifetime'
          || j?.user?.plan === 'lifetime'
        if (active) {
          if (sub?.plan_key) setPlan(sub.plan_key)
          setStatus('active')
          try { await refresh() } catch { /* ignore */ }
          // Give the celebration animation a moment before handing off
          setTimeout(() => { if (!cancelled) router.replace('/dashboard?welcome=1') }, 2500)
          return
        }
      } catch { /* network error — keep polling */ }
      if (attempts >= maxAttempts) {
        setStatus('timeout')
        return
      }
      setTimeout(poll, 2000)
    }
    poll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const planLabel = { monthly: 'Pro — Monthly', annual: 'Pro — Annual', lifetime: 'Pro — Lifetime' }[plan] || 'ScholarshipFit Pro'

  return (
    <div className="dark-bg min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {status === 'waiting' && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-[#D4AF37] animate-spin"/>
            </div>
            <div className="mt-4 text-[11px] uppercase tracking-widest text-[#D4AF37]">Payment confirmed</div>
            <h1 className="mt-2 text-2xl font-semibold text-white">Activating your {planLabel}…</h1>
            <p className="mt-3 text-sm text-white/60">
              Your card was charged successfully. We&apos;re syncing your subscription — usually takes 5-15 seconds. Please don&apos;t close this tab.
            </p>
            <div className="mt-6 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#e8c85a] transition-all" style={{ width: `${Math.min(100, (elapsed / 60) * 100)}%` }}/>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-widest text-white/40">Elapsed: {elapsed}s</div>
          </div>
        )}

        {status === 'active' && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400"/>
            </div>
            <div className="mt-4 text-[11px] uppercase tracking-widest text-emerald-400">Activated</div>
            <h1 className="mt-2 text-2xl font-semibold text-white">{planLabel} is live 🎉</h1>
            <p className="mt-3 text-sm text-white/60">
              Every feature is now unlocked. Taking you to your command center…
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs text-white/50">
              <Trophy className="h-3.5 w-3.5 text-[#D4AF37]"/> A welcome email is on its way to your inbox
            </div>
          </div>
        )}

        {status === 'timeout' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-300"/>
            </div>
            <div className="mt-4 text-center text-[11px] uppercase tracking-widest text-amber-300">Sync in progress</div>
            <h1 className="mt-2 text-center text-2xl font-semibold text-white">Payment received — activation is taking longer than usual</h1>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              Your <strong className="text-white">$14.99</strong> was charged successfully by Dodo Payments — you&apos;re not double-billed if you refresh. Our webhook is running slow; your Pro access will appear in the next few minutes.
            </p>
            <div className="mt-5 grid gap-2 text-sm">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-[#D4AF37] px-4 py-2.5 font-semibold text-black hover:bg-[#c9a530] transition"
              >
                Retry sync
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-center text-white/80 hover:bg-white/[0.05] inline-flex items-center justify-center gap-1.5"
              >
                Go to dashboard anyway <ArrowRight className="h-3.5 w-3.5"/>
              </Link>
              <a
                href="mailto:support@scholarshipfit.com?subject=Payment%20received%20but%20Pro%20not%20activated"
                className="text-center text-xs text-[#D4AF37] hover:underline mt-1"
              >
                Email support — we&apos;ll fix it in minutes
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="dark-bg min-h-screen"/>}>
      <CheckoutSuccessInner />
    </Suspense>
  )
}
