'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ArrowRight, Phone, ShieldCheck, Clock } from 'lucide-react'
import { PLANS } from '@/lib/pricing-plans'
import FounderModal from './FounderModal'

/* Landing-page pricing preview — compact 3-tier layout with the same
   founder-modal flow as /pricing. Keeps the same visual language:
   Free (outline) | Pro (gold-glow "Recommended") | Elite (outline). */
export default function PricingPreview() {
  const [cycle, setCycle] = useState('monthly')
  const [openPlan, setOpenPlan] = useState(null)

  return (
    <section id="pricing" className="relative">
      <div className="container mx-auto max-w-6xl px-4 py-20 md:py-28">

        {/* Section heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/60 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] backdrop-blur">
            <Clock className="h-3.5 w-3.5"/> Founder pricing · Locked forever
          </div>
          <h2 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Simple, transparent <span className="text-gold-hi">pricing</span>
          </h2>
          <p className="mt-3 mx-auto max-w-xl text-base text-white/60">
            Start free. Upgrade when you’re ready. Cancel anytime.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-7 inline-flex items-center rounded-full border border-white/10 bg-black/60 p-1">
            {[
              { key: 'monthly', label: 'Monthly' },
              { key: 'yearly',  label: 'Yearly',  extra: 'save 33%' },
            ].map(t => (
              <button key={t.key} onClick={() => setCycle(t.key)}
                className={`relative h-9 px-4 rounded-full text-sm transition ${cycle===t.key ? 'bg-[#D4AF37] text-black font-semibold' : 'text-white/70 hover:text-white'}`}>
                {t.label}
                {t.extra && cycle !== t.key && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">{t.extra}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3-card grid */}
        <div className="mt-10 grid gap-5 md:grid-cols-3 md:items-stretch">
          {PLANS.map(plan => {
            const isYearly = cycle === 'yearly' && plan.yearlyPrice
            const price     = isYearly ? plan.yearlyPrice : plan.price
            const unit      = isYearly ? plan.yearlyUnit  : plan.unit
            const founder   = isYearly ? plan.founderYearly : plan.founderPrice
            const showFounder = !!founder && plan.key !== 'free'
            return (
              <div key={plan.key} className={`relative flex ${plan.highlighted ? 'md:-my-3' : ''}`}>
                {plan.badge && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black text-white text-[11px] font-medium px-3 py-1.5 border border-[#D4AF37]/60 shadow-lg">
                      <Sparkles className="h-3 w-3 text-[#D4AF37]"/> {plan.badge}
                    </span>
                  </div>
                )}
                <div className={`flex-1 rounded-3xl p-7 md:p-8 flex flex-col ${plan.highlighted
                    ? 'bg-gradient-to-b from-[#131313] to-black border-2 border-[#D4AF37]/60 shadow-[0_20px_60px_-10px_rgba(212,175,55,0.25)]'
                    : 'bg-white/[0.03] border border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    {plan.highlighted && <Sparkles className="h-5 w-5 text-[#D4AF37]"/>}
                    <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                  </div>
                  <p className="mt-1.5 text-sm text-white/55">{plan.tagline}</p>

                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/85">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlighted ? 'text-[#D4AF37]' : 'text-white/60'}`}/>
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="pl-6.5 text-xs text-white/50">+ {plan.features.length - 4} more</li>
                    )}
                  </ul>

                  <div className="mt-7">
                    {showFounder && (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/80 mb-1">Founder price</p>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl md:text-4xl font-semibold text-white">
                        {showFounder ? founder : price}
                      </span>
                      <span className="text-white/55 text-sm">{unit}</span>
                    </div>
                    {showFounder && (
                      <p className="mt-1 text-xs text-white/50">
                        Regular <span className="line-through">{price}</span> · locked for life
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      if (plan.key === 'free') {
                        window.location.href = '/onboarding'
                      } else {
                        setOpenPlan({ ...plan, cycle, source: 'landing-pricing' })
                      }
                    }}
                    className={`mt-5 h-11 w-full rounded-full font-semibold text-sm ${
                      plan.ctaVariant === 'gold'
                        ? 'btn-gold animate-gold-pulse'
                        : 'bg-white/[0.06] text-white border border-white/15 hover:bg-white/[0.10]'
                    }`}
                  >
                    {plan.key === 'elite'
                      ? (<><Phone className="mr-2 h-4 w-4"/>{plan.cta}</>)
                      : (<>{plan.cta}<ArrowRight className="ml-2 h-4 w-4"/></>)}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust + full-pricing link */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#D4AF37]"/> 7-day money-back guarantee</span>
          <span className="inline-flex items-center gap-1.5">Cancel anytime</span>
          <Link href="/pricing" className="text-[#D4AF37] hover:underline">See full comparison →</Link>
        </div>
      </div>

      <FounderModal plan={openPlan} onClose={() => setOpenPlan(null)}/>
    </section>
  )
}
