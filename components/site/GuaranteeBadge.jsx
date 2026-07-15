'use client'
// Reusable "30-day money-back guarantee" badge.
//
// Variants:
//   'inline'  → tiny single-line pill under a CTA button (~10-11px text)
//   'card'    → larger badge with icon + short body (fits inside a pricing card)
//   'stack'   → 3-benefit vertical stack (used near primary CTA blocks)
//
// The wording adapts to payment mode:
//   - Pre-order  → focuses on "no charge today"; still promises 30-day refund at charge-time
//   - Live       → the classic "30-day money-back, no questions asked"
import { ShieldCheck, Lock, Undo2 } from 'lucide-react'

const IS_PREORDER = (process.env.NEXT_PUBLIC_PAYMENT_MODE || 'preorder') !== 'live'

export default function GuaranteeBadge({ variant = 'inline', className = '' }) {
  if (variant === 'card') {
    return (
      <div className={`rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2.5 ${className}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0"/>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-emerald-300 font-medium">
              30-day money-back guarantee
            </div>
            <div className="mt-0.5 text-[11px] text-white/60 leading-snug">
              {IS_PREORDER
                ? "Not charged today. When payments open, cancel within 30 days for a full refund — no questions asked."
                : "Not a fit? Get a full refund within 30 days — no questions asked."}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'stack') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/60 ${className}`}>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400"/> 30-day money-back
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Undo2 className="h-4 w-4 text-emerald-400"/> Cancel any time
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-emerald-400"/> Secure checkout
        </span>
      </div>
    )
  }

  // Default: 'inline'
  return (
    <div className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-300 ${className}`}>
      <ShieldCheck className="h-3 w-3"/>
      30-day money-back guarantee
    </div>
  )
}
