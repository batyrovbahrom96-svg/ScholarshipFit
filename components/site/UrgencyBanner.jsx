'use client'
// Premium guarantee bar. Replaced the previous "Founder pricing ends in
// [countdown]" urgency banner, which felt like a low-tier scarcity tactic.
// This one is calm, confidence-forward, and matches ScholarshipFit's premium
// positioning: source-verified scholarships, real refund guarantee, MoR-backed
// checkout.
//
// Kept as `UrgencyBanner` (same export name + `variant` prop) so all existing
// mount points continue to work without any refactor.

import { ShieldCheck, Sparkles, BadgeCheck } from 'lucide-react'

export default function UrgencyBanner({ variant = 'card', className = '' }) {
  if (variant === 'strip') {
    return (
      <div className={`w-full bg-gradient-to-r from-[#D4AF37]/10 via-white/[0.02] to-[#D4AF37]/10 border-b border-white/10 ${className}`}>
        <div className="container mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[#D4AF37] font-medium">
            <ShieldCheck className="h-3.5 w-3.5"/> 30-day money-back guarantee
          </span>
          <span className="hidden md:inline text-white/60">
            · Source-verified scholarships · No aggregator spam · Cancel anytime
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 text-xs text-white/70 ${className}`}>
        <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]"/>
        <span>30-day money-back guarantee</span>
      </div>
    )
  }

  // Default: 'card' — used on marketing/CTA sections that expected a hero banner
  return (
    <div className={`rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/[0.06] to-transparent p-6 md:p-7 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 h-11 w-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]"/>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]">The ScholarshipFit promise</div>
            <div className="mt-1 text-lg md:text-xl font-semibold text-white">30-day money-back guarantee. No questions asked.</div>
            <div className="mt-1 text-sm text-white/60">If ScholarshipFit doesn't help you match, apply, and submit — we refund every cent within 30 days.</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-5 shrink-0">
          <TrustPill icon={BadgeCheck} label="Source-verified" />
          <TrustPill icon={Sparkles}   label="No aggregator spam" />
          <TrustPill icon={ShieldCheck} label="Cancel anytime" />
        </div>
      </div>
    </div>
  )
}

function TrustPill({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-white/70">
      <Icon className="h-3.5 w-3.5 text-[#D4AF37]"/> {label}
    </div>
  )
}
