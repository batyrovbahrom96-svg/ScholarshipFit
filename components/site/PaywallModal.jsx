'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SUBSCRIPTION_PLANS } from '@/lib/pricing-plans'
import { useRegionalPricing, REGION_SELECTOR } from '@/hooks/use-regional-pricing'
import FounderReservationModal from './FounderReservationModal'
import { track } from '@/lib/analytics'
import {
  Check, Sparkles, Shield, Zap, Trophy, Lock, X,
  CreditCard, Loader2, AlertCircle, Star, Crown,
} from 'lucide-react'

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'preorder'
const IS_PREORDER = PAYMENT_MODE !== 'live'

const TRUST_BADGES = [
  { icon: Shield,  text: '7-day free trial', sub: 'Cancel before day 7 — no charge' },
  { icon: Zap,     text: 'Instant access',   sub: 'Full Command Center in < 5s' },
  { icon: Trophy,  text: '303 real scholarships', sub: 'Source-linked · verified' },
]

// -----------------------------------------------------------------------------
// PaywallModal — 4-tier length-based pricing with 7-day free trial (card capture).
// Backed by SUBSCRIPTION_PLANS in /lib/pricing-plans.js.
// -----------------------------------------------------------------------------
export default function PaywallModal({ open, onClose, matchCount = 0, totalWorth = 0, initialPlan = 'quarterly' }) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [activatingKey, setActivatingKey] = useState('')
  const [reservePlan, setReservePlan] = useState(null)
  const [error, setError] = useState('')
  const { region, setOverride, priceFor } = useRegionalPricing()
  const discountPct = region?.discount_pct || 0
  const hasRegionalDiscount = discountPct > 0

  // Track paywall_view whenever the modal actually opens (funnel top)
  useEffect(() => {
    if (open) {
      track.paywallView({
        match_count: matchCount,
        total_worth: totalWorth,
        initial_plan: initialPlan,
        mode: IS_PREORDER ? 'preorder' : 'live',
      })
    }
  }, [open, matchCount, totalWorth, initialPlan])

  const activate = async (planObj) => {
    setError('')
    // Track intent regardless of preorder/live mode
    track.checkoutInitiated({
      plan: planObj.key,
      total_charge: planObj.total_charge,
      mode: IS_PREORDER ? 'preorder' : 'live',
      region_country: region?.detected_country || '',
      discount_pct: discountPct || 0,
    })
    // In preorder mode (payment gateway pending approval) — open founder reservation
    // modal instead of activating a fake subscription. Ensures payment-gateway
    // reviewers walking through the flow see honest, non-deceptive intent.
    if (IS_PREORDER) {
      setReservePlan(planObj)
      return
    }
    // Live payment mode — LemonSqueezy hosted checkout
    const planKey = planObj.key
    setActivatingKey(planKey)
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      const me = await meRes.json()
      if (!me?.user) {
        const next = encodeURIComponent(`/checkout?plan=${planKey}`)
        router.push(`/signup?next=${next}`)
        return
      }
      const adjustedTotal = priceFor(planKey, 'adjusted_total') ?? planObj.total_charge
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: planKey,
          base_price: planObj.total_charge,
          custom_price_cents: hasRegionalDiscount ? Math.round(adjustedTotal * 100) : undefined,
          region_country: region?.detected_country || '',
          discount_pct:   discountPct || 0,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.url) throw new Error(j.error || `HTTP ${res.status}`)
      window.location.href = j.url // hand off to LemonSqueezy
    } catch (e) {
      setError(e?.message || 'Checkout failed. Please try again.')
    } finally {
      setActivatingKey('')
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
              {IS_PREORDER ? (
                <>Payments launch soon. Reserve any plan today to lock in your <span className="text-white font-medium">founder price for life</span> — no card required, no charges. We&apos;ll email your checkout link the day we open.</>
              ) : (
                <>Try any plan free for <span className="text-white font-medium">7 days</span> — card required, cancel anytime before day 7 and you&apos;re not charged. Longer commitment = bigger discount. Lifetime VIP is a one-time payment.</>
              )}
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

          {/* Regional pricing banner + selector */}
          {region && (
            <div className={`mt-4 rounded-xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3
              ${hasRegionalDiscount
                ? 'border-emerald-400/30 bg-emerald-500/[0.08]'
                : 'border-white/10 bg-white/[0.02]'}`}>
              <div className="text-xs">
                {hasRegionalDiscount ? (
                  <span className="text-emerald-300 font-medium">
                    Regional pricing — {discountPct}% off applied automatically
                    {region.detected_country ? <span className="text-white/60"> · {region.detected_country}</span> : null}
                  </span>
                ) : (
                  <span className="text-white/60">
                    Standard pricing{region.detected_country ? ` · ${region.detected_country}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-white/50">Change region:</span>
                <select
                  value={region.detected_from === 'query' ? (region.detected_country || '') : ''}
                  onChange={(e) => setOverride(e.target.value)}
                  className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  {REGION_SELECTOR.map(o => (
                    <option key={o.code || 'auto'} value={o.code}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div className="p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUBSCRIPTION_PLANS.map((p) => {
              const isSelected = selectedPlan === p.key
              const isActivating = activatingKey === p.key
              const accent = accentClasses(p.accent)
              const isLifetime = p.tier_type === 'lifetime'
              const adjustedMonthly = priceFor(p.key, 'adjusted_monthly') ?? p.display_price
              const adjustedTotal   = priceFor(p.key, 'adjusted_total')   ?? p.total_charge
              const showStrike = hasRegionalDiscount && Math.abs(adjustedMonthly - p.display_price) > 0.01
              const trialNote = isLifetime
                ? p.trial_note
                : (hasRegionalDiscount
                    ? `7 days free · then $${adjustedTotal} every ${p.days} days · cancel anytime`
                    : p.trial_note)
              return (
                <div
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative cursor-pointer rounded-2xl border p-5 pt-6 transition-all
                    ${isSelected
                      ? `bg-white/[0.04] border-white/25 ring-2 ${accent.ring}`
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
                >
                  {p.ribbon && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap ${accent.ribbon} shadow-lg`}>
                      {isLifetime ? <Crown className="inline h-3 w-3 mr-1 -mt-0.5"/> : <Star className="inline h-3 w-3 mr-1 -mt-0.5"/>}
                      {p.ribbon}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{p.name}</div>
                    {showStrike && (
                      <div className="mt-2 text-xs text-white/40 line-through">${p.display_price}{p.unit}</div>
                    )}
                    <div className={`${showStrike ? 'mt-0' : 'mt-3'} flex items-baseline justify-center gap-1`}>
                      <span className="text-4xl font-bold text-white">${adjustedMonthly}</span>
                      <span className="text-white/50 text-sm">{p.unit}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      {isLifetime
                        ? (hasRegionalDiscount ? `Pay once — $${adjustedTotal}. Forever.` : p.billing)
                        : (hasRegionalDiscount ? `billed $${adjustedTotal}/${p.days}d` : p.billing)}
                    </div>
                    {p.savings_label && (
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        {p.savings_label}
                      </div>
                    )}
                    {showStrike && (
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-emerald-300/80">
                        + {discountPct}% region
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={(e) => { e.stopPropagation(); activate(p) }}
                    disabled={isActivating}
                    className={`mt-4 w-full ${accent.btn} disabled:opacity-40 font-semibold`}
                  >
                    {isActivating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Activating…</>
                    ) : IS_PREORDER ? (
                      isLifetime ? <>Reserve founder spot</> : <>Reserve founder pricing</>
                    ) : (
                      <>{p.cta}</>
                    )}
                  </Button>
                  <div className="mt-2 text-center text-[11px] text-white/40 leading-relaxed">
                    {IS_PREORDER
                      ? (isLifetime
                          ? 'No card today · locked-in launch price'
                          : 'No card today · we email you when payments open')
                      : trialNote}
                  </div>

                  <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-4">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/75">
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isLifetime ? 'text-[#D4AF37]' : 'text-emerald-400'}`}/>
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
              {IS_PREORDER
                ? 'No card required today. Payments launch soon — we\u2019ll email your locked-in checkout link.'
                : 'Card required to start your 7-day trial. We never charge before day 7. Cancel anytime from your account.'}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
              <span>✓ Cancel anytime</span>
              <span>{IS_PREORDER ? '✓ Founder price locked in' : '✓ 7-day free trial (except Lifetime)'}</span>
              <span>{IS_PREORDER ? '✓ No charges today' : '✓ Instant access'}</span>
              <span>✓ 303 real scholarships</span>
            </div>
          </div>
        </div>
      </DialogContent>
      {/* Founder reservation modal — mounted alongside so it renders above the paywall */}
      <FounderReservationModal
        plan={reservePlan}
        source="paywall"
        onClose={() => setReservePlan(null)}
      />
    </Dialog>
  )
}

function accentClasses(accent) {
  switch (accent) {
    case 'green':
      return { ring: 'ring-emerald-400/70', ribbon: 'bg-emerald-500 text-white', btn: 'bg-emerald-500 hover:bg-emerald-400 text-white' }
    case 'red':
      return { ring: 'ring-red-400/60', ribbon: 'bg-red-500 text-white', btn: 'bg-red-500 hover:bg-red-400 text-white' }
    case 'orange':
      return { ring: 'ring-orange-400/60', ribbon: 'bg-orange-500 text-white', btn: 'bg-orange-500 hover:bg-orange-400 text-white' }
    case 'gold':
    default:
      return { ring: 'ring-[#D4AF37]', ribbon: 'bg-[#D4AF37] text-black', btn: 'bg-[#D4AF37] hover:bg-[#B8941F] text-black' }
  }
}
