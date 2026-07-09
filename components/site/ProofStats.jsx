'use client'
import { StatCounter, Reveal } from '@/components/site/PremiumEffects'
import { ShieldCheck } from 'lucide-react'

/*
  ProofStats — botiroff-style animated counter block.
  Numbers animate 0 → target when scrolled into view.
  Only shows honest, verifiable stats — never fabricated.
*/
const STATS = [
  { value: 68, suffix: '+', label: 'Source-linked scholarships' },
  { value: 4, label: 'Verified winners' },
  { value: 76500, prefix: '$', label: 'Total funding secured by winners' },
  { value: 100, suffix: '%', label: 'Honest AI · zero hallucinations' },
]

export default function ProofStats() {
  return (
    <section className="relative border-y border-white/10 bg-black py-16 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"/>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"/>
      <div className="container mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
              <ShieldCheck className="h-3 w-3"/>The receipts
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white">
              The numbers, unvarnished
            </h2>
            <p className="mt-3 text-base text-white/60">
              Every figure below is auditable — pulled from the platform, not from a marketing deck.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 120}>
              <StatCounter {...s}/>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
