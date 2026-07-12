'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ArrowRight, ShieldCheck, Clock, Star, Crown } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/pricing-plans'
import { useRegionalPricing } from '@/hooks/use-regional-pricing'

/* Compact landing-page pricing preview — 3 tiers (Monthly / Annual /
   Lifetime), with regional pricing auto-applied. */
export default function PricingPreview() {
  const router = useRouter()
  const { region, priceFor } = useRegionalPricing()
  const discountPct = region?.discount_pct || 0
  const hasRegionalDiscount = discountPct > 0

  return (
    <section id="pricing" className="relative">
      <div className="container mx-auto max-w-6xl px-4 py-20 md:py-28">
        {/* Section heading */}
        <div className="text-center" data-reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/60 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] backdrop-blur">
            <Clock className="h-3.5 w-3.5"/> 7-day free trial · Cancel anytime
          </div>
          <h2 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Pricing that <span className="text-gold-hi">rewards commitment</span>
          </h2>
          <p className="mt-3 mx-auto max-w-xl text-base text-white/60">
            Longer commitment = lower monthly rate. Lifetime is a one-time payment.
          </p>
          {hasRegionalDiscount && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/[0.08] px-3 py-1 text-xs text-emerald-300">
              <Sparkles className="h-3 w-3"/> Regional pricing — {discountPct}% off applied automatically
            </div>
          )}
        </div>

        {/* 3-card grid */}
        <div className="mt-10 grid gap-4 md:grid-cols-3" data-reveal data-reveal-delay="200">
          {SUBSCRIPTION_PLANS.map(p => {
            const accent = accentClasses(p.accent)
            const isLifetime = p.tier_type === 'lifetime'
            const adjustedMonthly = priceFor(p.key, 'adjusted_monthly') ?? p.display_price
            const adjustedTotal   = priceFor(p.key, 'adjusted_total')   ?? p.total_charge
            const showStrike = hasRegionalDiscount && Math.abs(adjustedMonthly - p.display_price) > 0.01
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
                  <div className="text-lg font-semibold text-white">{p.name}</div>
                  <p className="mt-1 text-xs text-white/55 line-clamp-1">{p.tagline}</p>
                  {showStrike && (
                    <div className="mt-3 text-xs text-white/40 line-through">${p.display_price}{p.unit}</div>
                  )}
                  <div className={`${showStrike ? 'mt-0' : 'mt-4'} flex items-baseline justify-center gap-1`}>
                    <span className="text-4xl font-bold text-white">${adjustedMonthly}</span>
                    <span className="text-white/50 text-sm">{p.unit}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    {isLifetime
                      ? (hasRegionalDiscount ? `Pay once — $${adjustedTotal}` : 'One-time payment')
                      : (hasRegionalDiscount ? `$${adjustedTotal}/${p.days}d billed` : p.billing)}
                  </div>
                  {p.savings_label && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      {p.savings_label}
                    </div>
                  )}
                </div>

                <ul className="mt-5 space-y-1.5 border-t border-white/5 pt-4 flex-1">
                  {p.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isLifetime ? 'text-[#D4AF37]' : 'text-emerald-400'}`}/>
                      <span>{f}</span>
                    </li>
                  ))}
                  {p.features.length > 4 && (
                    <li className="pl-5 text-[11px] text-white/45">+ {p.features.length - 4} more</li>
                  )}
                </ul>

                <Button
                  onClick={() => router.push(`/pricing?plan=${p.key}`)}
                  className={`mt-5 h-10 w-full rounded-full font-semibold text-sm ${accent.btn}`}
                >
                  {isLifetime ? 'Claim lifetime' : 'Start free trial'}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5"/>
                </Button>
              </div>
            )
          })}
        </div>

        {/* Trust + full-pricing link */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#D4AF37]"/> 7-day free trial · card required</span>
          <span className="inline-flex items-center gap-1.5">Cancel anytime</span>
          <Link href="/pricing" className="text-[#D4AF37] hover:underline">See full comparison →</Link>
        </div>
      </div>
    </section>
  )
}

function accentClasses(accent) {
  switch (accent) {
    case 'green':
      return { ring: 'ring-emerald-400/70', ribbon: 'bg-emerald-500 text-white', btn: 'bg-emerald-500 hover:bg-emerald-400 text-white' }
    case 'orange':
      return { ring: 'ring-orange-400/60', ribbon: 'bg-orange-500 text-white', btn: 'bg-orange-500 hover:bg-orange-400 text-white' }
    case 'gold':
    default:
      return { ring: 'ring-[#D4AF37]', ribbon: 'bg-[#D4AF37] text-black', btn: 'bg-[#D4AF37] hover:bg-[#B8941F] text-black' }
  }
}
