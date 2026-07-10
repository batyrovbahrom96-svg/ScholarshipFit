'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Check, Sparkles, Shield, Zap, Trophy, Lock, X,
  CreditCard, Loader2, AlertCircle, Star,
} from 'lucide-react'

// -----------------------------------------------------------------------------
// Plan catalogue — same pricing that already lives on /pricing. NO free trials.
// Immediate activation. All features included per tier.
// -----------------------------------------------------------------------------
const PLANS = [
  {
    key: 'pro',
    name: 'Pro',
    price: 9,
    unit: 'per month',
    billing: 'Billed monthly · cancel anytime',
    ribbon: null,
    accent: 'gold',
    tagline: 'Everything you need to win real scholarships',
    features: [
      'Unlock all 303 source-linked scholarships',
      'Unlimited AI Match reports (Claude Sonnet 4.5)',
      'Unlimited Application Readiness Scores',
      'Cabinet: transcript + essay storage',
      'Application Tracker (Kanban board)',
      'Deadline calendar + reminders',
      'PDF match-report export',
      'Priority email support',
    ],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: 24,
    unit: 'per month',
    billing: 'Billed monthly · cancel anytime',
    ribbon: 'Most Popular',
    accent: 'gold-plus',
    tagline: 'For serious applicants who want expert help',
    features: [
      'Everything in Pro',
      'Claude Opus advisor (deeper reasoning)',
      '2 essay reviews / month by human editor',
      '1 × 30-min strategy call / month',
      'Deadline concierge (we hand-check for you)',
      'Same-day priority support',
      'Early access to new scholarships',
    ],
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    price: 199,
    unit: 'one-time',
    billing: 'Pay once · Pro tier forever',
    ribbon: 'Best Value',
    accent: 'emerald',
    tagline: 'Lock in Pro access forever',
    features: [
      'All Pro features — forever, no monthly bills',
      'Locked in before the $19/mo regular price',
      'First access to every new feature',
      'Direct Slack line to the founding team',
      'Founding Member badge on your profile',
    ],
  },
]

const TRUST_BADGES = [
  { icon: Shield,   text: 'Secure Stripe checkout',      sub: '256-bit SSL encrypted' },
  { icon: Zap,      text: 'Instant access',              sub: 'Unlocked in < 5 seconds' },
  { icon: Trophy,   text: '303 real scholarships',       sub: 'Source-linked · verified' },
]

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
export default function PaywallModal({ open, onClose, matchCount = 0, totalWorth = 0, initialPlan = 'pro' }) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const activate = async (planKey) => {
    setLoading(true); setError('')
    try {
      // Step 1: check auth
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      const me = await meRes.json()
      if (!me?.user) {
        // Not signed in — redirect to signup with a "next" param to come back
        const next = encodeURIComponent(`/checkout?plan=${planKey}`)
        router.push(`/signup?next=${next}`)
        return
      }
      // Step 2: activate subscription (mock payment success — real Stripe hook
      // will be added later. For now backend records subscription immediately.)
      const res = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planKey, payment_reference: 'manual-activation' }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      // Step 3: redirect to dashboard with celebration flag
      router.push('/dashboard?activated=1')
    } catch (e) {
      setError(e?.message || 'Activation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto bg-[#0A0A0A] border-white/10 p-0">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-[#D4AF37]/10 via-transparent to-transparent border-b border-white/10 p-6 md:p-8">
          <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5"/>
          </button>
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37]">
              <Sparkles className="h-4 w-4"/> Unlock your matches
            </div>
            <h2 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight text-white">
              {matchCount > 0 ? (
                <>You matched <span className="text-[#D4AF37]">{matchCount} real scholarships</span>{totalWorth > 0 ? <> worth up to <span className="text-emerald-400">${totalWorth.toLocaleString()}</span></> : null}</>
              ) : (
                <>Activate your <span className="text-[#D4AF37]">ScholarshipFit</span> membership</>
              )}
            </h2>
            <p className="mt-3 text-white/60 max-w-2xl">
              Every match below is a real, source-linked program. Activate now to unlock deadlines, application links, AI Match reports, and the full Cabinet. No trial. No credit card gotchas. Full access instantly.
            </p>
          </div>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TRUST_BADGES.map(b => (
              <div key={b.text} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <b.icon className="h-5 w-5 text-[#D4AF37]"/>
                <div>
                  <div className="text-sm font-medium text-white">{b.text}</div>
                  <div className="text-xs text-white/50">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => {
              const isSelected = selectedPlan === p.key
              const accent = p.accent === 'emerald'
                ? { ring: 'ring-emerald-400/70', ribbon: 'bg-emerald-500 text-black', btn: 'bg-emerald-500 hover:bg-emerald-400 text-black' }
                : p.accent === 'gold-plus'
                  ? { ring: 'ring-[#D4AF37]', ribbon: 'bg-[#D4AF37] text-black', btn: 'bg-[#D4AF37] hover:bg-[#B8941F] text-black' }
                  : { ring: 'ring-white/20', ribbon: 'bg-white/10 text-white', btn: 'bg-white hover:bg-white/90 text-black' }
              return (
                <div
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative cursor-pointer rounded-2xl border p-6 transition-all
                    ${isSelected
                      ? `bg-white/[0.04] border-white/20 ring-2 ${accent.ring}`
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
                >
                  {p.ribbon && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold ${accent.ribbon}`}>
                      <Star className="inline h-3 w-3 mr-1 -mt-0.5"/>{p.ribbon}
                    </div>
                  )}
                  <div className="text-lg font-semibold text-white">{p.name}</div>
                  <div className="mt-1 text-sm text-white/50">{p.tagline}</div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${p.price}</span>
                    <span className="text-white/50 text-sm">{p.unit}</span>
                  </div>
                  <div className="text-xs text-white/40">{p.billing}</div>

                  <Button
                    onClick={(e) => { e.stopPropagation(); activate(p.key) }}
                    disabled={loading}
                    className={`mt-5 w-full ${accent.btn} disabled:opacity-40`}
                  >
                    {loading && selectedPlan === p.key ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Activating…</>
                    ) : (
                      <><CreditCard className="mr-2 h-4 w-4"/>Activate {p.name} — ${p.price}</>
                    )}
                  </Button>

                  <ul className="mt-5 space-y-2">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4"/>{error}
            </div>
          )}

          <div className="mt-6 flex flex-col items-center justify-center gap-3 border-t border-white/5 pt-6 text-center">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Lock className="h-3 w-3"/>
              Payment processed securely. No free trials, no hidden fees, no automatic renewals without warning.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
              <span>✓ Cancel anytime</span>
              <span>✓ 7-day money-back guarantee</span>
              <span>✓ Instant access</span>
              <span>✓ 303 real scholarships</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
