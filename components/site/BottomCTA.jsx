'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

/* ScholarshipOwl-style bottom conversion banner. Repeats the primary
   CTA with a strong stat and free-to-use reassurance. */
export default function BottomCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto max-w-5xl px-4 py-20 md:py-28">
        <div className="relative rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-b from-white/[0.04] to-black p-8 md:p-14 text-center overflow-hidden"
             style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 40px 80px -20px rgba(0,0,0,0.7)' }}>
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[600px] rounded-full bg-[#D4AF37]/15 blur-3xl"/>
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]">
              <Sparkles className="h-3.5 w-3.5"/> No credit card · No spam
            </div>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight text-white">
              1 out of 8 students win scholarships.<br className="hidden md:block"/>
              <span className="text-gold-hi"> Let’s get you in that group.</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto">
              Build your profile once. Our AI surfaces scholarships that match your profile filters to source-linked scholarships you can actually win — no fake promises, no wasted applications.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/onboarding">
                <Button size="lg" className="btn-gold btn-pill h-12 px-7 text-base font-semibold">
                  Get Started for Free <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <Link href="/database">
                <Button size="lg" variant="outline" className="btn-pill h-12 px-6 border-white/15 bg-transparent text-white hover:bg-white/5">
                  Browse the database
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-white/50">It’s easy and free · Takes 2 minutes · Personalized cabinet included</p>
          </div>
        </div>
      </div>
    </section>
  )
}
