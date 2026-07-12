'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, Check, ArrowRight, ShieldCheck, Lock, Loader2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { track } from '@/lib/analytics'

/* ============================================================================
   FounderReservationModal — payment-gateway-safe pre-launch reservation.
   Used while NEXT_PUBLIC_PAYMENT_MODE === 'preorder' (i.e. before Stripe /
   LemonSqueezy approval is granted). Captures email + preferred plan into
   /api/preorder — NO charges, NO fake subscription activation. Once payment
   goes live this modal is replaced with the real checkout flow.
   ============================================================================ */
export default function FounderReservationModal({ plan, source = 'paywall', onClose }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user?.email]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!plan
  const eff = (email || user?.email || '').trim()

  const isLifetime = plan?.tier_type === 'lifetime'
  const priceLine = isLifetime
    ? `$${plan?.total_charge} one-time · locked-in founder price`
    : `$${plan?.total_charge} every ${plan?.days} days · effective $${plan?.display_price}/mo`

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
          tier:  plan.key,             // 'monthly' | 'annual' | 'lifetime'
          cycle: plan.key,
          founder_price_monthly: plan.display_price,
          founder_price_yearly:  plan.total_charge,
          source,
        }),
      })
      const data = await r.json()
      if (!r.ok) { toast.error(data.error || 'Could not reserve'); return }
      setDone(true)
      track.founderReservation({
        plan: plan?.key,
        tier_type: plan?.tier_type,
        total_charge: plan?.total_charge,
        source,
        email_domain: eff.split('@')[1] || '',
      })
      toast.success("You're on the founder list", {
        description: "We'll email your locked-in checkout link the moment payments open."
      })
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const close = () => { setDone(false); setEmail(''); onClose?.() }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="border-[#D4AF37]/30 bg-black/95 backdrop-blur-xl text-white max-w-md p-0 overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/15 blur-3xl" aria-hidden/>
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-[#D4AF37]/8 blur-3xl" aria-hidden/>

        <div className="relative p-6">
          {!done ? (
            <>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                  {isLifetime ? <Crown className="h-6 w-6 text-[#D4AF37]"/> : <Sparkles className="h-6 w-6 text-[#D4AF37]"/>}
                </div>
                <DialogTitle className="text-center text-2xl font-semibold text-white pt-3">
                  Reserve <span className="text-[#D4AF37]">{plan?.name}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-1 mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
                <Lock className="h-3 w-3"/> Payments opening soon
              </div>

              <p className="mt-4 text-center text-sm text-white/75 leading-relaxed">
                We&apos;re finalising our payment provider. Reserve your spot now to lock in your founder pricing —{' '}
                <span className="text-[#D4AF37] font-medium">{priceLine}</span>.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37] shrink-0"/> No card required today — no charges</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37] shrink-0"/> Founder price locked in for life</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#D4AF37] shrink-0"/> One launch email — that&apos;s it, no spam</li>
              </ul>

              <div className="mt-5">
                <label className="text-[11px] uppercase tracking-widest text-white/50">Your email</label>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && reserve()}
                  className="mt-1 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF37]"
                  autoFocus={!user?.email}
                />
              </div>

              <Button
                onClick={reserve}
                disabled={saving}
                className="mt-5 h-12 w-full btn-gold btn-pill font-semibold disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Reserving…</>
                ) : (
                  <>Reserve my founder spot <ArrowRight className="ml-2 h-4 w-4"/></>
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                <ShieldCheck className="h-3 w-3"/> No charges today · Cancel any time before launch
              </p>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                <Check className="h-8 w-8 text-[#D4AF37]"/>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">You&apos;re on the founder list.</h3>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">
                We&apos;ve reserved your <span className="text-[#D4AF37]">{plan?.name}</span> spot at{' '}
                <span className="text-[#D4AF37]">{priceLine}</span>. We&apos;ll email your locked-in checkout link the day we launch.
              </p>
              <Button onClick={close} className="mt-6 h-11 px-6 btn-pill bg-white/10 hover:bg-white/15 text-white">Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
