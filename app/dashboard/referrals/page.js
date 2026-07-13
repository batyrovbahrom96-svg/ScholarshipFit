'use client'
// Referral dashboard — user's unique code, stats, share buttons, prewritten posts.
// Uses /api/referrals/me (auto-creates the record on first hit).

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users, Share2, Copy, Check, Gift, Twitter, MessageCircle,
  Mail as MailIcon, DollarSign, Trophy, Sparkles, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ReferralsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await fetch('/api/referrals/me', { credentials: 'include' })
        if (r.status === 401) {
          window.location.href = '/login?return=/dashboard/referrals'
          return
        }
        const j = await r.json()
        if (!ignore) {
          if (!r.ok) setError(j?.error || 'Could not load referral data')
          else setData(j)
        }
      } catch (e) {
        if (!ignore) setError('Network error')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(''), 1500)
    } catch {
      toast.error('Could not copy — try selecting the text')
    }
  }

  const shareTwitter = () => {
    if (!data?.payload?.twitter) return
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(data.payload.twitter)}`, '_blank')
  }
  const shareWhatsapp = () => {
    if (!data?.payload?.whatsapp) return
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(data.payload.whatsapp)}`, '_blank')
  }
  const shareEmail = () => {
    if (!data?.payload) return
    window.open(`mailto:?subject=${encodeURIComponent(data.payload.email_subject)}&body=${encodeURIComponent(data.payload.email_body)}`, '_self')
  }
  const shareNative = async () => {
    if (!data?.share_url) return
    if (navigator.share) {
      try { await navigator.share({ title: 'ScholarshipFit', text: 'AI scholarship matcher for international students', url: data.share_url }) } catch {}
    } else {
      copy(data.share_url, 'native')
    }
  }

  const paidReferrals = data?.paid || 0
  const creditsDays = data?.credits_earned_days || 0
  const progressPct = Math.min(100, (paidReferrals % 3) * 100 / 3)
  const nextMilestone = paidReferrals < 3 ? 3 - paidReferrals : (paidReferrals % 3 === 0 ? 3 : 3 - (paidReferrals % 3))

  return (
    <div className="dark-bg min-h-screen text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center gap-2">
            <Gift className="h-4 w-4" /> Referral program
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Share ScholarshipFit — earn free Pro.</h1>
          <p className="mt-2 text-white/60 max-w-2xl">
            Every friend who signs up with your link gets <strong className="text-white">20% off</strong> any plan. You earn <strong className="text-[#D4AF37]">30 days of Pro credit</strong> per paid referral. Three paid friends = 3 months of Pro absolutely free.
          </p>
        </div>

        {loading ? (
          <div className="text-white/50">Loading your referral link…</div>
        ) : error ? (
          <Card className="border-red-500/30 bg-red-500/[0.05]"><CardContent className="p-6 text-red-300">{error}</CardContent></Card>
        ) : data && (
          <>
            {/* Share link box */}
            <Card className="border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 via-transparent to-transparent">
              <CardContent className="p-6 md:p-8">
                <div className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Your unique link</div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[260px] rounded-lg border border-white/20 bg-black/40 px-4 py-3 font-mono text-white text-sm md:text-base break-all">
                    {data.share_url}
                  </div>
                  <Button onClick={() => copy(data.share_url, 'link')} className="bg-[#D4AF37] hover:bg-[#c9a530] text-black">
                    {copied === 'link' ? <><Check className="h-4 w-4 mr-2"/> Copied</> : <><Copy className="h-4 w-4 mr-2"/> Copy link</>}
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="text-xs text-white/50 mr-1">Share directly:</div>
                  <Button size="sm" variant="outline" className="border-white/15 bg-white/[0.02] hover:bg-white/[0.06]" onClick={shareTwitter}><Twitter className="h-3.5 w-3.5 mr-1.5"/> Twitter/X</Button>
                  <Button size="sm" variant="outline" className="border-white/15 bg-white/[0.02] hover:bg-white/[0.06]" onClick={shareWhatsapp}><MessageCircle className="h-3.5 w-3.5 mr-1.5"/> WhatsApp</Button>
                  <Button size="sm" variant="outline" className="border-white/15 bg-white/[0.02] hover:bg-white/[0.06]" onClick={shareEmail}><MailIcon className="h-3.5 w-3.5 mr-1.5"/> Email</Button>
                  <Button size="sm" variant="outline" className="border-white/15 bg-white/[0.02] hover:bg-white/[0.06]" onClick={shareNative}><Share2 className="h-3.5 w-3.5 mr-1.5"/> More</Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <StatCard icon={Users} label="Clicks" value={data.clicks || 0} />
              <StatCard icon={ArrowRight} label="Signups" value={data.signups || 0} />
              <StatCard icon={DollarSign} label="Paid referrals" value={paidReferrals} />
              <StatCard icon={Trophy} label="Free Pro days earned" value={creditsDays} accent />
            </div>

            {/* Progress to next reward */}
            <Card className="mt-6 border-white/10 bg-white/[0.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white/70">Next milestone: <span className="text-white">3 paid referrals = 1 month Pro free</span></div>
                  <div className="text-xs text-[#D4AF37]">{nextMilestone} more to unlock</div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#e8c85a] transition-all duration-500" style={{ width: `${progressPct}%` }}/>
                </div>
              </CardContent>
            </Card>

            {/* Ready-made posts */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#D4AF37]"/>
                <div className="text-sm font-medium text-white">Copy-paste posts</div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <PostBox title="Twitter / X" text={data.payload?.twitter} onCopy={() => copy(data.payload.twitter, 'twitter')} copied={copied === 'twitter'}/>
                <PostBox title="WhatsApp / iMessage" text={data.payload?.whatsapp} onCopy={() => copy(data.payload.whatsapp, 'whatsapp')} copied={copied === 'whatsapp'}/>
                <PostBox title="Email — subject" text={data.payload?.email_subject} onCopy={() => copy(data.payload.email_subject, 'esub')} copied={copied === 'esub'}/>
                <PostBox title="Email — body" text={data.payload?.email_body} onCopy={() => copy(data.payload.email_body, 'ebody')} copied={copied === 'ebody'} multiline/>
              </div>
            </div>

            {/* How it works */}
            <Card className="mt-8 border-white/10 bg-white/[0.02]">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-white mb-3">How it works</div>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>→ Share your link. Anyone who signs up through it gets <strong className="text-white">20% off</strong> any paid plan.</li>
                  <li>→ Every time a referred friend upgrades to a paid plan, you earn <strong className="text-[#D4AF37]">30 days of Pro credit</strong>.</li>
                  <li>→ Credits apply automatically on your next renewal. Lifetime members can gift them to friends — email <Link href="/contact" className="text-[#D4AF37] underline underline-offset-2">support</Link>.</li>
                  <li>→ Cash-out is available at 5+ paid referrals ($20 per additional referral, PayPal). Contact support for eligibility.</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-xl border ${accent ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.06]' : 'border-white/10 bg-white/[0.02]'} p-4`}>
      <div className={`text-xs uppercase tracking-widest ${accent ? 'text-[#D4AF37]' : 'text-white/50'} flex items-center gap-1.5`}>
        <Icon className="h-3.5 w-3.5"/> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}

function PostBox({ title, text, onCopy, copied, multiline }) {
  if (!text) return null
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-widest text-white/50">{title}</div>
        <button onClick={onCopy} className="text-xs text-[#D4AF37] hover:text-[#e8c85a] flex items-center gap-1">
          {copied ? <><Check className="h-3 w-3"/> Copied</> : <><Copy className="h-3 w-3"/> Copy</>}
        </button>
      </div>
      <div className={`text-sm text-white/80 ${multiline ? 'whitespace-pre-line' : ''} leading-relaxed`}>{text}</div>
    </div>
  )
}
