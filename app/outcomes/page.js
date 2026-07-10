'use client'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Globe2, Award, Sparkles, ArrowRight, Rocket } from 'lucide-react'
import { OUTCOMES } from '@/lib/outcomes-data'
import OutcomeVideoCard from '@/components/site/OutcomeVideoCard'

function Outcomes() {
  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.14),transparent_70%)]"/>

        <div className="container mx-auto max-w-6xl px-4 pt-10 pb-16 relative">
          <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">
            <ShieldCheck className="mr-1 h-3 w-3"/>Verified · Consent-based publishing
          </Badge>

          <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight text-white">
            Real students. Real scholarships. <span className="text-gold-hi">Real proof.</span>
          </h1>
          <p className="mt-3 text-white/60 max-w-2xl">
            These are verified outcomes from students who used ScholarshipFit to find, apply to, and win their scholarships.
            Every story has a video, a university, a scholarship, and explicit written consent from the student to publish.
          </p>

          {/* KPI strip */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Verified outcomes" value={OUTCOMES.length}/>
            <Stat label="Countries covered" value={new Set(OUTCOMES.map(o => o.country)).size} tone="cyan"/>
            <Stat label="Consent-based" value="100%" tone="emerald"/>
            <Stat label="Fake testimonials" value="0" tone="gold"/>
          </div>

          {/* Video grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OUTCOMES.map(o => <OutcomeVideoCard key={o.slug} o={o}/>)}
          </div>

          {/* Trust cards */}
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-6">
                <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                  <Award className="h-3 w-3"/> Every outcome must include
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-white/80">
                  <li className="flex items-start gap-2"><span className="text-[#D4AF37]">•</span>Student name and country</li>
                  <li className="flex items-start gap-2"><span className="text-[#D4AF37]">•</span>University and program</li>
                  <li className="flex items-start gap-2"><span className="text-[#D4AF37]">•</span>Scholarship / funding awarded</li>
                  <li className="flex items-start gap-2"><span className="text-[#D4AF37]">•</span>Direct video quote from the student</li>
                  <li className="flex items-start gap-2"><span className="text-[#D4AF37]">•</span>Explicit written consent to publish</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-6">
                <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3"/> Our commitment
                </p>
                <p className="mt-3 text-sm text-white/80 leading-relaxed">
                  ScholarshipFit will never fabricate testimonials, invent universities, or pretend to have outcomes we cannot prove.
                  If you spot a claim you cannot verify, please <Link className="text-[#D4AF37] underline" href="/contact">tell us</Link>.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  <ShieldCheck className="h-3 w-3"/> Individual results vary — we do NOT guarantee similar outcomes
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/12 via-[#0A0A0A] to-[#0A0A0A] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none"/>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Won a scholarship using ScholarshipFit?</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">Share your story. We&apos;ll verify + publish it here.</h2>
                <p className="mt-2 text-white/60 max-w-2xl text-sm">
                  Send us a 30-second video (selfie is fine), your admission letter, and your scholarship name.
                  If verified, we&apos;ll publish it here with full credit — with your written consent.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link href="/contact"><Button size="lg" className="btn-gold btn-pill h-12 px-6 font-semibold text-black">Submit my story</Button></Link>
                <Link href="/quiz"><Button size="lg" variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] h-12 px-6"><Rocket className="mr-2 h-4 w-4"/>Start my quiz</Button></Link>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-xs text-white/40 text-center max-w-3xl mx-auto">
            All videos published with explicit written consent from the student.
            ScholarshipFit provides informational scholarship research only. It does not guarantee admission, scholarships, visas, or funding.
            Individual results vary — do not expect the same outcomes.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Stat({ label, value, tone = 'white' }) {
  const toneCls = tone === 'cyan' ? 'text-cyan-300'
    : tone === 'emerald' ? 'text-emerald-300'
    : tone === 'gold' ? 'text-[#D4AF37]'
    : 'text-white'
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className={`text-3xl font-semibold ${toneCls}`}>{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  )
}

export default Outcomes
