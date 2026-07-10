'use client'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { OUTCOMES } from '@/lib/outcomes-data'
import OutcomeVideoCard from '@/components/site/OutcomeVideoCard'

// -----------------------------------------------------------------------------
// OutcomesPreview — homepage section showing 4 video testimonials + link
// to the full /outcomes page.  Videos are lazy-loaded (preload="none")
// via OutcomeVideoCard so the ~80MB payload only downloads on user Play.
// -----------------------------------------------------------------------------
export default function OutcomesPreview() {
  return (
    <section id="outcomes" className="relative border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              <ShieldCheck className="h-3.5 w-3.5"/> Verified · Consent-based publishing
            </div>
            <h2 className="mt-3 text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-white">
              Real students. <span className="text-gold-hi">Real scholarships.</span> Real proof.
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-xl">
              Four students who used ScholarshipFit to win real scholarships at real universities.
              Every video is published with their explicit written consent.
            </p>
          </div>
          <Link href="/outcomes" className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white hover:bg-white/[0.08] hover:border-white/30 transition">
            See all outcomes <ArrowRight className="h-3.5 w-3.5"/>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.slice(0, 4).map(o => (
            <OutcomeVideoCard key={o.slug} o={o} compact/>
          ))}
        </div>

        <p className="mt-6 text-xs text-white/40 max-w-2xl">
          Individual results vary. ScholarshipFit does not guarantee similar outcomes.
        </p>
      </div>
    </section>
  )
}
