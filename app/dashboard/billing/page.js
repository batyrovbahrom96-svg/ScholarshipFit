'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Crown, Sparkles, ShieldCheck, Loader2, ExternalLink, ArrowRight,
  Calendar, CreditCard, AlertCircle, CheckCircle2, XCircle, Clock,
} from 'lucide-react'

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'preorder'
const IS_PREORDER = PAYMENT_MODE !== 'live'

const PLAN_LABEL = {
  monthly:     'Monthly',
  annual:      'Annual',
  lifetime:    'Lifetime VIP',
  // Legacy — kept so old subscribers still see a nice label in billing history
  quarterly:   'Quarterly (legacy)',
  half_yearly: 'Half-Yearly (legacy)',
  pro:         'Pro (legacy)',
  elite:       'Elite (legacy)',
}

function StatusBadge({ status }) {
  const map = {
    active:    { color: 'emerald', icon: CheckCircle2, label: 'Active' },
    trialing:  { color: 'gold',    icon: Sparkles,     label: 'Free trial' },
    cancelled: { color: 'amber',   icon: Clock,        label: 'Cancelled — access until period ends' },
    expired:   { color: 'red',     icon: XCircle,      label: 'Expired' },
    past_due:  { color: 'red',     icon: AlertCircle,  label: 'Payment failed' },
    paused:    { color: 'white',   icon: Clock,        label: 'Paused' },
  }
  const m = map[status] || { color: 'white', icon: AlertCircle, label: status || 'Inactive' }
  const cls = {
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    gold:    'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]',
    amber:   'bg-amber-500/15 border-amber-400/30 text-amber-300',
    red:     'bg-red-500/15 border-red-400/30 text-red-300',
    white:   'bg-white/10 border-white/20 text-white/70',
  }[m.color]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
      <m.icon className="h-3.5 w-3.5"/> {m.label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return '—' }
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState(null)
  const [user,   setUser]     = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [meRes, subRes] = await Promise.all([
        fetch('/api/auth/me',              { credentials: 'include' }),
        fetch('/api/subscription/status',  { credentials: 'include' }),
      ])
      const me  = await meRes.json().catch(() => ({}))
      const sub = await subRes.json().catch(() => ({}))
      setUser(me?.user || null)
      setStatus(sub || null)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const cancel = async () => {
    if (!confirm('Cancel your subscription? You\'ll keep access until the end of your current billing period.')) return
    setCancelling(true)
    try {
      const r = await fetch('/api/subscription/cancel', { method: 'POST', credentials: 'include' })
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Cancel failed') }
      toast.success('Subscription cancelled', { description: 'You keep access until the end of the current period.' })
      await load()
    } catch (e) {
      toast.error(e?.message || 'Cancel failed')
    } finally { setCancelling(false) }
  }

  const sub    = status?.subscription
  const active = !!status?.active
  const plan   = sub?.plan || null
  const isLifetime = plan === 'lifetime'

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
          <CreditCard className="h-3.5 w-3.5"/> Billing & Subscription
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white tracking-tight">Your subscription</h1>
        <p className="mt-2 text-white/60 max-w-2xl">
          Manage your ScholarshipFit plan, review billing history, or cancel any time. Cancelling stops future
          charges — you keep full access until the end of your current period.
        </p>

        {loading ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-10 flex items-center gap-3 text-white/60">
            <Loader2 className="h-5 w-5 animate-spin"/> Loading your subscription…
          </div>
        ) : !user ? (
          <Card className="mt-10 border-white/10 bg-white/[0.03]">
            <CardContent className="p-8 text-center">
              <p className="text-white/70">Please sign in to view your billing details.</p>
              <Link href="/login" className="mt-4 inline-block">
                <Button className="btn-gold btn-pill h-11 px-6 font-semibold">Sign in</Button>
              </Link>
            </CardContent>
          </Card>
        ) : !sub ? (
          <Card className="mt-10 border-white/10 bg-white/[0.03]">
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white font-semibold text-lg">No active subscription</div>
                  <p className="mt-1 text-sm text-white/60 max-w-xl">
                    You&apos;re using the free tier. {IS_PREORDER
                      ? 'Payments are launching soon — reserve founder pricing to lock in the lowest rate for life.'
                      : 'Pick a plan to unlock 800 hand-verified premium scholarships, unlimited AI reports, and Nova AI research assistant.'}
                  </p>
                </div>
                <Link href="/pricing">
                  <Button className="btn-gold btn-pill h-11 px-6 font-semibold">
                    {IS_PREORDER ? 'Reserve founder pricing' : 'View plans'} <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 space-y-4">
            {/* Current plan card */}
            <Card className="border-[#D4AF37]/25 bg-gradient-to-br from-white/[0.04] to-transparent">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
                      {isLifetime ? <><Crown className="h-3.5 w-3.5"/> Founding member</> : <><ShieldCheck className="h-3.5 w-3.5"/> Current plan</>}
                    </div>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl md:text-3xl font-semibold text-white">{PLAN_LABEL[plan] || plan}</h2>
                      <StatusBadge status={sub.status}/>
                      {active && <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-300">Full access</Badge>}
                    </div>
                    {sub.price_usd != null && (
                      <p className="mt-2 text-sm text-white/60">
                        {isLifetime
                          ? `$${sub.price_usd} — one-time payment · never renews`
                          : `$${sub.price_usd}${sub.billing_cycle_days ? ` every ${sub.billing_cycle_days} days` : ''}`}
                        {sub.monthly_rate_usd ? <> · effective ${sub.monthly_rate_usd}/mo</> : null}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {!isLifetime && (
                      <Button
                        onClick={cancel}
                        disabled={cancelling || sub.status === 'cancelled' || sub.status === 'expired'}
                        variant="outline"
                        className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                      >
                        {cancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Cancelling…</> : 'Cancel subscription'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Billing timeline */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3 border-t border-white/5 pt-6">
                  <TimelineCell label="Activated"      value={formatDate(sub.activated_at)}      icon={CheckCircle2}/>
                  {sub.trial_end && sub.status === 'trialing'
                    ? <TimelineCell label="Trial ends"    value={formatDate(sub.trial_end)}     icon={Clock} accent/>
                    : <TimelineCell label="First charge"  value={formatDate(sub.first_charge_at || sub.activated_at)} icon={Calendar}/>}
                  {isLifetime
                    ? <TimelineCell label="Access expires" value="Never — lifetime"             icon={Crown} accent/>
                    : <TimelineCell label={sub.status === 'cancelled' ? 'Access until' : 'Next renewal'}
                                    value={formatDate(sub.renews_at || sub.expires_at)}
                                    icon={sub.status === 'cancelled' ? Clock : Calendar}
                                    accent={sub.status === 'cancelled'}/>}
                </div>
              </CardContent>
            </Card>

            {/* Change plan */}
            {!isLifetime && sub.status !== 'expired' && (
              <Card className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-white font-medium">Want a longer commitment for a lower monthly rate?</div>
                    <p className="mt-1 text-sm text-white/60">Upgrade to Annual ($7.42/mo — save 51%) or Lifetime VIP ($249 one-time).</p>
                  </div>
                  <Link href="/pricing">
                    <Button className="btn-gold btn-pill h-11 px-6 font-semibold">Change plan <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Billing portal link — shown once a Paddle/LemonSqueezy subscription exists */}
            {(sub.paddle_customer_id || sub.ls_customer_id) && (
              <Card className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-white/70">
                    Update your payment method, download invoices, or view your full billing history in your billing portal.
                  </div>
                  <a
                    href={sub.paddle_customer_id
                      ? 'https://customer-portal.paddle.com'
                      : 'https://app.lemonsqueezy.com/my-orders'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#D4AF37] hover:underline"
                  >
                    Open billing portal <ExternalLink className="h-3.5 w-3.5"/>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Legal footer strip */}
        <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-xs text-white/50">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>Recurring subscriptions auto-renew. Cancel any time.</span>
            <span><Link className="text-[#D4AF37] hover:underline" href="/refunds">14-day refund policy</Link></span>
            <span><Link className="text-[#D4AF37] hover:underline" href="/terms">Terms</Link></span>
            <span><Link className="text-[#D4AF37] hover:underline" href="/privacy">Privacy</Link></span>
            <span><a className="text-[#D4AF37] hover:underline" href="mailto:support@scholarshipfit.com">Contact billing support</a></span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function TimelineCell({ label, value, icon: Icon, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.04]' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] ${accent ? 'text-[#D4AF37]' : 'text-white/40'}`}>
        <Icon className="h-3 w-3"/>{label}
      </div>
      <div className="mt-1 text-sm text-white">{value}</div>
    </div>
  )
}
