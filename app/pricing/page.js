'use client'
import { useState } from 'react'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import BottomCTA from '@/components/site/BottomCTA'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, Sparkles, ArrowRight, Phone, ShieldCheck, Clock, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

/* ==========================================================================
   /pricing — Pre-launch pricing panel (Free / Pro / Elite)
   Payments are NOT activated. Clicking "Get Started" on paid plans opens a
   Founder Access modal that captures email + tier choice into MongoDB via
   POST /api/preorder. When LemonSqueezy activates, one env flag flips this
   to a real checkout URL.
   ========================================================================== */

import { PLANS, LIFETIME_DEAL } from '@/lib/pricing-plans'

function Pricing() {
  const { user } = useAuth()
  const [cycle, setCycle] = useState('monthly') // monthly | yearly
  const [openPlan, setOpenPlan] = useState(null) // plan being reserved

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      <section className="relative">
        <div className="container mx-auto max-w-6xl px-4 pt-16 pb-4 md:pt-24 text-center">
          {/* Launch-mode banner */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/60 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] backdrop-blur">
            <Clock className="h-3.5 w-3.5"/> Founder pricing · Locked forever
          </div>

          <h1 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight text-white">Pricing</h1>
          <p className="mt-3 mx-auto max-w-xl text-base md:text-lg text-white/60">
            Pick a plan that matches your preparation goals and budget.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-black/60 p-1">
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

        {/* ============ 3-column plan cards ============ */}
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
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
                  <div
                    className={`
                      flex-1 rounded-3xl p-8 md:p-9 flex flex-col
                      ${plan.highlighted
                        ? 'bg-gradient-to-b from-[#131313] to-black border-2 border-[#D4AF37]/60 shadow-[0_20px_60px_-10px_rgba(212,175,55,0.25)]'
                        : 'bg-white/[0.03] border border-white/10'
                      }
                    `}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      {plan.highlighted && <Sparkles className="h-5 w-5 text-[#D4AF37]"/>}
                      <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                    </div>
                    <p className="mt-1.5 text-sm text-white/55">{plan.tagline}</p>

                    {/* Features */}
                    <ul className="mt-8 space-y-3.5 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/85">
                          <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlighted ? 'text-[#D4AF37]' : 'text-white/60'}`}/>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Price */}
                    <div className="mt-10">
                      {showFounder && (
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/80 mb-1.5">Founder price</p>
                      )}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl md:text-5xl font-semibold text-white">
                          {showFounder ? founder : price}
                        </span>
                        <span className="text-white/55">{unit}</span>
                      </div>
                      {showFounder && (
                        <p className="mt-1 text-xs text-white/50">
                          Regular <span className="line-through">{price}</span> · locked for life
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => {
                        if (plan.key === 'free') {
                          window.location.href = '/onboarding'
                        } else if (plan.key === 'elite') {
                          setOpenPlan({ ...plan, cycle })
                        } else {
                          setOpenPlan({ ...plan, cycle })
                        }
                      }}
                      className={`
                        mt-6 h-12 w-full rounded-full font-semibold text-base
                        ${plan.ctaVariant === 'gold'
                          ? 'btn-gold animate-gold-pulse'
                          : plan.highlighted
                            ? 'bg-white text-black hover:bg-white/90'
                            : 'bg-white/[0.06] text-white border border-white/15 hover:bg-white/[0.10]'
                        }
                      `}
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

          {/* Trust row under plans */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#D4AF37]"/> 14-day money-back guarantee</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-[#D4AF37]"/> Cancel anytime</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#D4AF37]"/> Setup in under 2 minutes</span>
          </div>

          {/* ============ LIFETIME FOUNDER DEAL — cash-flow booster ============ */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/[0.10] via-black to-black p-6 md:p-10 shadow-[0_0_80px_-20px_rgba(212,175,55,0.35)]">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#D4AF37]/25 blur-3xl"/>
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl"/>
              <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
                    <Sparkles className="h-3 w-3"/>Limited to first {LIFETIME_DEAL.limitedTo} signups
                  </div>
                  <h3 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
                    {LIFETIME_DEAL.name}
                  </h3>
                  <p className="mt-2 text-white/70 text-base md:text-lg">{LIFETIME_DEAL.tagline}</p>
                  <ul className="mt-5 space-y-2">
                    {LIFETIME_DEAL.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                        <Check className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5"/>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[11px] text-white/45">{LIFETIME_DEAL.disclaimer}</p>
                </div>
                <div className="rounded-2xl border border-[#D4AF37]/30 bg-black/50 backdrop-blur p-6 text-center">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/80 font-semibold">Founder price</p>
                  <div className="mt-2 flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl font-semibold text-white">{LIFETIME_DEAL.price}</span>
                    <span className="text-sm text-white/50">{LIFETIME_DEAL.unit}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/50">vs {LIFETIME_DEAL.originalValue}</p>
                  <Button
                    onClick={() => { setSelectedPlan({ ...LIFETIME_DEAL, key: 'lifetime', ctaVariant: 'gold' }); setCycle('lifetime'); setOpen(true) }}
                    className="btn-gold btn-pill font-semibold w-full mt-5 h-11"
                  >
                    {LIFETIME_DEAL.cta}
                  </Button>
                  <p className="mt-3 text-[10px] text-white/40">One-time · No renewals · No surprises</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Feature comparison ============ */}
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-white">Compare features</h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/60 border-b border-white/10">
                  <th className="p-4 md:p-5 font-medium">What you get</th>
                  <th className="p-4 md:p-5 font-medium text-center">Free</th>
                  <th className="p-4 md:p-5 font-medium text-center text-[#D4AF37]">Pro</th>
                  <th className="p-4 md:p-5 font-medium text-center">Elite</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-t [&>tr]:border-white/5">
                {[
                  ['AI scholarship matches', '1 / week', 'Unlimited', 'Unlimited'],
                  ['AI advisor messages',    '10 / lifetime', 'Unlimited', 'Unlimited + Opus'],
                  ['Cabinet favourites',     '3', 'Unlimited', 'Unlimited'],
                  ['Deadline calendar',      '—', '✓', '✓ + hand-checked'],
                  ['Email reminders',        'Weekly digest', 'Personalized', 'Personalized + SMS'],
                  ['PDF match report',       '—', '✓', '✓'],
                  ['Essay review (expert)',  '—', '—', '2 / month'],
                  ['1:1 strategy call',      '—', '—', '30 min / month'],
                  ['Priority support',       '—', '✓', '24-hour response'],
                ].map(([label, a, b, c], i) => (
                  <tr key={i} className="text-white/80">
                    <td className="p-4 md:p-5">{label}</td>
                    <td className="p-4 md:p-5 text-center">{a}</td>
                    <td className="p-4 md:p-5 text-center text-[#D4AF37] font-medium bg-[#D4AF37]/[0.03]">{b}</td>
                    <td className="p-4 md:p-5 text-center">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ FAQ ============ */}
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-white">Frequently asked</h2>
          <div className="mt-10 space-y-3">
            {[
              ['When will payments actually go live?',
               'Very soon. We\'re in the final review stage with our payment processor. If you reserve now with founder pricing, we\'ll email you a checkout link the day we launch — your locked-in price is guaranteed forever, even if we later raise regular prices.'],
              ['Is my card charged today?',
               'No. Reserving your spot only saves your email + chosen plan. You\'ll receive a checkout link when payments open, and only pay then.'],
              ['Can I cancel later?',
               'Yes — cancel any time from your cabinet. If you cancel within the 14 days after your first paid subscription cycle, you get a full refund, no questions asked. See our refund policy for details.'],
              ['Do I keep founder pricing forever?',
               'Yes. If you\'re one of the first 200 users to reserve, your monthly/annual rate is locked for life. Even if we raise regular prices to $19/month, you keep yours.'],
              ['Which countries can pay?',
               'All 195+ countries supported by our payment processor. We handle VAT/GST automatically. No hidden fees.'],
              ['Can I switch plans later?',
               'Yes — upgrade or downgrade any time. Pro-rated automatically.'],
              ['What\'s the money-back guarantee?',
               'Full refund within 7 days of your first paid charge. Just email support and we send the refund — no interrogation.'],
            ].map(([q, a], i) => (
              <details key={i} className="group rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 open:bg-white/[0.04] transition">
                <summary className="flex cursor-pointer items-center justify-between text-white font-medium">
                  {q}
                  <span className="ml-4 text-[#D4AF37] transition group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-white/70 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <BottomCTA />
      <Footer />

      <FounderModal plan={openPlan} onClose={() => setOpenPlan(null)} defaultEmail={user?.email} />
    </div>
  )
}

/* ============ Founder reservation modal ============ */
function FounderModal({ plan, onClose, defaultEmail }) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Reset when plan changes
  const open = !!plan
  const eff = email || defaultEmail || ''

  const reserve = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eff)) return toast.error('Please enter a valid email')
    setSaving(true)
    try {
      const r = await fetch('/api/preorder', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: eff,
          tier: plan.key,
          cycle: plan.cycle,
          founder_price_monthly: plan.founderPrice,
          founder_price_yearly:  plan.founderYearly,
          source: 'pricing-page',
        }),
      })
      const data = await r.json()
      if (!r.ok) { toast.error(data.error || 'Could not reserve'); return }
      setDone(true)
      toast.success('You\'re on the founder list', { description: 'We\'ll email your checkout link the day we launch.' })
    } catch (e) {
      toast.error('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const priceLabel = plan?.cycle === 'yearly'
    ? `${plan?.founderYearly}/year (regularly ${plan?.yearlyPrice})`
    : `${plan?.founderPrice}/month (regularly ${plan?.price})`

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (setDone(false), setEmail(''), onClose())}>
      <DialogContent className="border-[#D4AF37]/30 bg-black/95 backdrop-blur text-white max-w-md">
        {!done ? (
          <>
            <DialogHeader>
              <div className="mx-auto h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#D4AF37]"/>
              </div>
              <DialogTitle className="text-center text-2xl font-semibold text-white pt-3">
                Reserve <span className="text-[#D4AF37]">{plan?.name}</span>
              </DialogTitle>
            </DialogHeader>

            <p className="text-center text-sm text-white/70">
              Payments launch in ~2 weeks. Reserve now to lock in <span className="text-[#D4AF37] font-medium">{priceLabel}</span> forever.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37]"/> No card required today</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37]"/> Founder price locked for life</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37]"/> Cancel any time before charge</li>
            </ul>

            <div className="mt-4">
              <label className="text-[11px] uppercase tracking-widest text-white/50">Your email</label>
              <Input
                type="email"
                placeholder="you@email.com"
                value={eff}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && reserve()}
                className="mt-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
                autoFocus
              />
            </div>

            <Button
              onClick={reserve}
              disabled={saving}
              className="mt-4 h-12 w-full btn-gold btn-pill font-semibold disabled:opacity-60"
            >
              {saving ? 'Reserving…' : 'Reserve founder spot'}
              {!saving && <ArrowRight className="ml-2 h-4 w-4"/>}
            </Button>
            <p className="text-center text-[11px] text-white/40 mt-2">
              We won\u2019t spam you. One launch email. That\u2019s it.
            </p>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              <Check className="h-8 w-8 text-[#D4AF37]"/>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">You\u2019re in.</h3>
            <p className="mt-2 text-sm text-white/70">
              We\u2019ve reserved your <span className="text-[#D4AF37]">{plan?.name}</span> founder spot at <span className="text-[#D4AF37]">{priceLabel}</span>. We\u2019ll email your checkout link the day we launch.
            </p>
            <Button onClick={onClose} className="mt-6 h-11 px-6 btn-pill bg-white/10 hover:bg-white/15 text-white">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default Pricing
