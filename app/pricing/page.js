'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import BottomCTA from '@/components/site/BottomCTA'
import FounderReservationModal from '@/components/site/FounderReservationModal'
import UrgencyBanner from '@/components/site/UrgencyBanner'
import GuaranteeBadge from '@/components/site/GuaranteeBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Check, Sparkles, ArrowRight, ShieldCheck, Clock, Star, Crown, Zap,
  CreditCard, Lock, Loader2, AlertCircle, Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import { SUBSCRIPTION_PLANS } from '@/lib/pricing-plans'
import { useAuth } from '@/hooks/use-auth'
import { useRegionalPricing, REGION_SELECTOR } from '@/hooks/use-regional-pricing'

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'preorder'
const IS_PREORDER = PAYMENT_MODE !== 'live'

/* ==========================================================================
   /pricing — Length-based 3-tier pricing (2026 reset)
   Monthly / Annual / Lifetime · 7-day free trial (card required, except lifetime)
   ========================================================================== */

function accentClasses(accent) {
  switch (accent) {
    case 'green':
      return { ring: 'ring-emerald-400/70', ribbon: 'bg-emerald-500 text-white', btn: 'bg-emerald-500 hover:bg-emerald-400 text-white', text: 'text-emerald-300' }
    case 'red':
      return { ring: 'ring-red-400/60', ribbon: 'bg-red-500 text-white', btn: 'bg-red-500 hover:bg-red-400 text-white', text: 'text-red-300' }
    case 'orange':
      return { ring: 'ring-orange-400/60', ribbon: 'bg-orange-500 text-white', btn: 'bg-orange-500 hover:bg-orange-400 text-white', text: 'text-orange-300' }
    case 'gold':
    default:
      return { ring: 'ring-[#D4AF37]', ribbon: 'bg-[#D4AF37] text-black', btn: 'bg-[#D4AF37] hover:bg-[#B8941F] text-black', text: 'text-[#D4AF37]' }
  }
}

function Pricing() {
  const router = useRouter()
  const { user } = useAuth()
  const { region, setOverride, priceFor } = useRegionalPricing()
  const [activatingKey, setActivatingKey] = useState('')
  const [reservePlan, setReservePlan] = useState(null)
  const [error, setError] = useState('')
  const discountPct = region?.discount_pct || 0
  const hasRegionalDiscount = discountPct > 0

  const activate = async (planObj) => {
    setError('')
    // In preorder mode (payment gateway pending approval) — open founder reservation
    // modal instead of activating a fake subscription. This is the pattern payment
    // gateway reviewers see when they walk through the flow.
    if (IS_PREORDER) {
      setReservePlan(planObj)
      return
    }
    // ---- Live payment mode (post-gateway approval) ----
    // Opens LemonSqueezy hosted checkout. Any regional PPP discount is passed
    // through as `custom_price_cents` so the customer sees the discounted price.
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
    <div className="dark-bg min-h-screen">
      <Navbar />

      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.12),transparent_70%)]"/>

        {/* HERO */}
        <div className="container mx-auto max-w-6xl px-4 pt-16 pb-4 md:pt-24 text-center relative">
          <div className={`mx-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.22em] backdrop-blur
            ${IS_PREORDER
              ? 'border-[#D4AF37]/40 bg-black/60 text-[#D4AF37]'
              : 'border-[#D4AF37]/30 bg-black/60 text-[#D4AF37]'}`}>
            {IS_PREORDER
              ? <><Clock className="h-3.5 w-3.5"/> Payments launching soon · Reserve founder pricing today</>
              : <><Clock className="h-3.5 w-3.5"/> 7-day free trial · Card required · Cancel anytime</>}
          </div>

          <h1 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Pricing that <span className="text-[#D4AF37]">rewards commitment</span>
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-base md:text-lg text-white/60">
            Every plan unlocks the same full feature set. The only difference: <span className="text-white">longer commitment = lower monthly rate</span>. Lifetime VIP is a one-time payment — never renews.
          </p>

          {IS_PREORDER && (
            <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] px-5 py-4 text-sm text-white/80 leading-relaxed">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] mb-1">
                <Lock className="h-3.5 w-3.5"/> Pre-launch — no charges today
              </div>
              We&apos;re finalising our payment provider. Reserve any plan now and we&apos;ll email your locked-in founder checkout link the moment payments open. Free features (quiz, sample report, database) remain fully accessible while you wait.
            </div>
          )}

          {/* Founder urgency: countdown + spots-remaining bar */}
          <div className="mt-6 mx-auto max-w-2xl text-left">
            <UrgencyBanner variant="card"/>
          </div>

          {/* Feature strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400"/> 7-day money-back</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#D4AF37]"/> Instant access</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-[#D4AF37]"/> Cancel anytime</span>
            <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-[#D4AF37]"/> 800 hand-verified premium scholarships</span>
          </div>

          {/* Regional pricing banner + selector */}
          {region && (
            <div className={`mt-8 mx-auto max-w-3xl rounded-2xl border px-5 py-3 flex flex-wrap items-center justify-between gap-3
              ${hasRegionalDiscount
                ? 'border-emerald-400/30 bg-emerald-500/[0.06]'
                : 'border-white/10 bg-white/[0.02]'}`}>
              <div className="flex items-center gap-2 text-sm">
                {hasRegionalDiscount ? (
                  <span className="text-emerald-300 font-medium">
                    Regional pricing applied — <span className="text-emerald-200">{discountPct}% off</span>
                    {region.detected_country ? <span className="text-white/60"> · detected: {region.detected_country}</span> : null}
                  </span>
                ) : (
                  <span className="text-white/70">
                    Standard pricing{region.detected_country ? ` · ${region.detected_country}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
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

        {/* PLAN CARDS — 4-column length-based grid */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SUBSCRIPTION_PLANS.map(p => {
              const accent = accentClasses(p.accent)
              const isActivating = activatingKey === p.key
              const isLifetime = p.tier_type === 'lifetime'
              const adjustedMonthly = priceFor(p.key, 'adjusted_monthly') ?? p.display_price
              const adjustedTotal   = priceFor(p.key, 'adjusted_total')   ?? p.total_charge
              const showStrike = hasRegionalDiscount && Math.abs(adjustedMonthly - p.display_price) > 0.01
              const billingText = isLifetime
                ? (hasRegionalDiscount ? `Pay once — $${adjustedTotal}. Keep forever.` : p.billing)
                : (hasRegionalDiscount
                    ? `billed $${adjustedTotal} every ${p.days} days`
                    : p.billing)
              const trialNote = isLifetime
                ? p.trial_note
                : (hasRegionalDiscount
                    ? `7 days free · then $${adjustedTotal} every ${p.days} days · cancel anytime`
                    : p.trial_note)
              return (
                <div
                  key={p.key}
                  className={`relative rounded-2xl border p-6 pt-7 transition-all flex flex-col
                    ${p.highlight
                      ? `bg-gradient-to-b from-white/[0.05] to-transparent border-white/25 ring-2 ${accent.ring} shadow-[0_20px_60px_-10px_rgba(212,175,55,0.25)] md:-my-3`
                      : 'bg-white/[0.03] border-white/10 hover:border-white/25'}`}
                >
                  {p.ribbon && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap ${accent.ribbon} shadow-lg`}>
                      {isLifetime ? <Crown className="inline h-3 w-3 mr-1 -mt-0.5"/> : <Star className="inline h-3 w-3 mr-1 -mt-0.5"/>}
                      {p.ribbon}
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-xl font-semibold text-white">{p.name}</div>
                    <p className="mt-1 text-xs text-white/55">{p.tagline}</p>
                    {showStrike && (
                      <div className="mt-3 text-xs text-white/40 line-through">${p.display_price}{p.unit}</div>
                    )}
                    <div className={`${showStrike ? 'mt-0' : 'mt-5'} flex items-baseline justify-center gap-1.5`}>
                      <span className="text-5xl font-bold text-white">${adjustedMonthly}</span>
                      <span className="text-white/50 text-sm">{p.unit}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/50">{billingText}</div>
                    {p.savings_label && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                        {p.savings_label}
                      </div>
                    )}
                    {showStrike && (
                      <div className="mt-1.5 text-[10px] uppercase tracking-widest text-emerald-300/80">
                        + {discountPct}% regional pricing
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => activate(p)}
                    disabled={isActivating}
                    className={`mt-6 w-full h-11 rounded-full font-semibold ${accent.btn} disabled:opacity-40`}
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

                  {/* 7-day money-back guarantee — under every plan CTA */}
                  <div className="mt-3">
                    <GuaranteeBadge variant="card"/>
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-white/5 pt-4 flex-1">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/80">
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
            <div className="mt-6 mx-auto max-w-xl flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4"/>{error}
            </div>
          )}

          {/* Trust row */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-[#D4AF37]"/> Card required to start trial — never charged before day 7</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400"/> 7-day money-back guarantee — no questions asked</span>
              <span className="inline-flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-[#D4AF37]"/> All major cards · secure processor</span>
            </div>
          </div>
        </div>

        {/* HOW BILLING WORKS */}
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-white">How the 7-day trial works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <TrialStep n="1" title="Pick a plan" body="Choose Monthly, Annual, or Lifetime. Bigger commitment = lower effective rate."/>
            <TrialStep n="2" title="Add your card" body="Card is captured but NOT charged. Required to prevent trial abuse."/>
            <TrialStep n="3" title="7 days of full access" body="Every match, every AI report, every feature — unlocked instantly."/>
            <TrialStep n="4" title="First charge on day 7" body="Cancel before day 7 from your Command Center — you pay nothing."/>
          </div>
          <p className="mt-6 text-center text-xs text-white/50">
            Lifetime VIP is a one-time $249 payment — instant activation, no trial, never renews.
          </p>
        </div>

        {/* FEATURE COMPARISON */}
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-white">All plans include everything</h2>
          <p className="mt-2 text-center text-white/60">Only difference is duration + effective monthly rate. Lifetime adds founder-only perks.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/60 border-b border-white/10">
                  <th className="p-4 md:p-5 font-medium">Feature</th>
                  <th className="p-4 md:p-5 font-medium text-center">Monthly</th>
                  <th className="p-4 md:p-5 font-medium text-center text-[#D4AF37]">Annual</th>
                  <th className="p-4 md:p-5 font-medium text-center text-[#D4AF37]">Lifetime</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-t [&>tr]:border-white/5">
                {[
                  ['Unlock all 800 hand-verified scholarships', '✓', '✓', '✓'],
                  ['Unlimited AI Match reports',       '✓', '✓', '✓'],
                  ['Application Readiness Score',      '✓', '✓', '✓'],
                  ['Cabinet + Tracker + PDF export',   '✓', '✓', '✓'],
                  ['Nova AI research assistant · 24/7 chat',       '✓', '✓', '✓'],
                  ['Deadline reminders (email)',       '✓', '✓', '✓'],
                  ['New scholarships every week',      '✓', '✓', '✓'],
                  ['Priority support',                 '✓', '✓', '✓'],
                  ['Founding-member badge',            '—', '—', '✓'],
                  ['Direct DM to founding team',       '—', '—', '✓'],
                  ['48h early access to new listings', '—', '—', '✓'],
                  ['1 essay professionally reviewed / yr', '—', '—', '✓'],
                  ['30% refer-a-friend for life',      '—', '—', '✓'],
                  ['Locked-in price forever',          '—', '—', '✓'],
                  ['Effective $/month',                '$14.99', '$7.42', '$0 after payoff'],
                ].map(([label, a, b, c], i) => (
                  <tr key={i} className="text-white/85">
                    <td className="p-4 md:p-5">{label}</td>
                    <td className="p-4 md:p-5 text-center">{a}</td>
                    <td className="p-4 md:p-5 text-center bg-[#D4AF37]/[0.05]">{b}</td>
                    <td className="p-4 md:p-5 text-center bg-[#D4AF37]/[0.08] text-[#D4AF37] font-medium">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-white">Frequently asked</h2>
          <div className="mt-10 space-y-3">
            {[
              ['Am I charged during the 7-day trial?',
               'No. We collect your card to prevent trial abuse but you\u2019re not charged until day 7. Cancel any time before day 7 from your Command Center and you owe nothing.'],
              ['Why is Lifetime the best long-term deal?',
               'A one-time $249 payment pays for itself vs. Annual in ~2.8 years — and you never renew again. It also unlocks founder-only perks (badge, direct DM to team, 48h early access, 1 essay review/yr).'],
              ['Can I switch plans later?',
               'Yes. You can upgrade Monthly → Annual → Lifetime any time from your Command Center. Downgrades apply at the next billing cycle.'],
              ['What happens after my Annual cycle ends?',
               'Auto-renews at the same $89/year rate. Cancel any time — access continues until the paid period ends.'],
              ['Which countries can pay?',
               'All 195+ countries supported by our payment processor. VAT/GST handled automatically. No hidden fees.'],
              ['What\u2019s the refund policy?',
               'Full refund within 14 days of your first paid charge — no interrogation. Just email support@scholarshipfit.com. See our full Refund Policy page for details.'],
              ['Do you offer regional pricing?',
               'Yes. We automatically detect your country and apply a Purchasing Power Parity (PPP) discount — up to 60% off in eligible regions. You can also override the region from the selector at the top of this page.'],
            ].map(([q, a], i) => (
              <details key={i} className="group rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 open:bg-white/[0.04] transition">
                <summary className="flex cursor-pointer items-center justify-between text-white font-medium">
                  {q}
                  <span className="ml-4 text-[#D4AF37] transition group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-white/70 leading-relaxed whitespace-pre-line">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <BottomCTA />
      <Footer />
      {/* Founder-reservation modal — active while NEXT_PUBLIC_PAYMENT_MODE=preorder */}
      <FounderReservationModal
        plan={reservePlan}
        source="pricing-page"
        onClose={() => setReservePlan(null)}
      />
    </div>
  )
}

function TrialStep({ n, title, body }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold">
            {n}
          </div>
          <div className="text-sm font-semibold text-white">{title}</div>
        </div>
        <p className="mt-2 text-xs text-white/60 leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  )
}

export default Pricing
