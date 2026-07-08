'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

/* Founder Access modal — shared between /pricing and homepage.
   Captures a pre-order reservation. Payments are NOT charged today. */
export default function FounderModal({ plan, onClose }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const open = !!plan
  const eff = email || user?.email || ''

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
          cycle: plan.cycle || 'monthly',
          founder_price_monthly: plan.founderPrice,
          founder_price_yearly:  plan.founderYearly,
          source: plan.source || 'pricing-modal',
        }),
      })
      const data = await r.json()
      if (!r.ok) { toast.error(data.error || 'Could not reserve'); return }
      setDone(true)
      toast.success("You're on the founder list", { description: "We'll email your checkout link the day we launch." })
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
              We won’t spam you. One launch email. That’s it.
            </p>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              <Check className="h-8 w-8 text-[#D4AF37]"/>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">You’re in.</h3>
            <p className="mt-2 text-sm text-white/70">
              We’ve reserved your <span className="text-[#D4AF37]">{plan?.name}</span> founder spot at <span className="text-[#D4AF37]">{priceLabel}</span>. We’ll email your checkout link the day we launch.
            </p>
            <Button onClick={onClose} className="mt-6 h-11 px-6 btn-pill bg-white/10 hover:bg-white/15 text-white">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
