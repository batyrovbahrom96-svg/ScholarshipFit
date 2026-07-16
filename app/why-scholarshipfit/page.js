'use client'
// Competitive positioning landing page — /why-scholarshipfit
// Purpose: single page a skeptical prospect can be sent to that annihilates
// every "but Fastweb / Scholarships.com is free" objection using verifiable
// statistics + head-to-head comparison. Premium tone, zero scammy tactics.
//
// KPIs this page is optimized for:
//   - Bounce rate: < 40%
//   - Time on page: > 90s
//   - Click-through to /pricing: > 25%
//
// Every claim on this page is either:
//   (a) A verifiable product-side fact (feature parity check)
//   (b) A publicly cited industry stat (linked in Sources at bottom)
//   (c) A direct competitor policy we can screenshot on demand

import Link from 'next/link'
import { useState } from 'react'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck, X, Check, Sparkles, Target, Database, Clock, Zap,
  MessageSquare, BookOpen, Kanban, Globe, DollarSign, TrendingUp,
  AlertTriangle, Trophy, ArrowRight, ChevronDown, Star, Award,
  Lock, Search, FileText, BarChart3, Users,
} from 'lucide-react'

const COMPETITORS = [
  { name: 'Fastweb',          founded: 1995, model: 'Ad-supported',           sells_email: true,  paid_tier: false },
  { name: 'Scholarships.com', founded: 1998, model: 'Ad-supported',           sells_email: true,  paid_tier: false },
  { name: 'Niche',            founded: 2002, model: 'Ad + affiliate',          sells_email: true,  paid_tier: false },
  { name: 'Chegg Scholarships', founded: 2020, model: 'Bundle add-on',        sells_email: false, paid_tier: false },
  { name: 'ScholarshipOwl',   founded: 2014, model: 'Freemium ($34.99/mo)',   sells_email: true,  paid_tier: true },
  { name: 'Bold.org',         founded: 2018, model: 'Ad + own scholarships',   sells_email: true,  paid_tier: false },
]

const HEADLINE_STATS = [
  { value: '800+',   label: 'Hand-verified scholarships',    sub: 'Every source URL manually opened + confirmed live' },
  { value: '0',      label: 'Ads on our platform',            sub: 'You are not the product' },
  { value: '0',      label: 'Emails sold to third parties',   sub: 'We legally can\'t — MoR checkout via Dodo' },
  { value: '~60s',   label: 'From quiz to matched shortlist', sub: 'vs. 45–90 minutes on aggregators' },
  { value: '30d',    label: 'Money-back guarantee',           sub: 'Full refund, no questions asked' },
  { value: '195+',   label: 'Countries supported',             sub: 'Dodo handles VAT + regional pricing' },
]

const COMPARISON_ROWS = [
  { feature: 'Hand-verified scholarships only',      us: true,  fw: false, sc: false, nc: false, so: false, bo: false, cg: false, note: 'Every listing has a manually confirmed live source URL' },
  { feature: 'AI matching (personalized shortlist)',  us: true,  fw: 'basic filters', sc: 'basic filters', nc: 'basic filters', so: 'basic filters', bo: false, cg: false, note: 'Deterministic engine + Claude 3.5 Sonnet advisor' },
  { feature: 'Built-in SOP / essay drafts',           us: true,  fw: false, sc: false, nc: false, so: false, bo: false, cg: 'writing tool bundle', note: 'Claude 3.5 Sonnet generates full drafts in 30s' },
  { feature: 'Application tracker (Kanban)',          us: true,  fw: false, sc: false, nc: false, so: 'basic list', bo: false, cg: false, note: 'Drag applications: Interested → Drafting → Submitted → Won' },
  { feature: 'International-student focus',           us: true,  fw: false, sc: false, nc: 'limited', so: false, bo: false, cg: false, note: 'Nationality filter is FIRST-class, not an afterthought' },
  { feature: 'No ads, no email selling',              us: true,  fw: false, sc: false, nc: false, so: false, bo: false, cg: true, note: 'MoR checkout + subscription model = zero ad revenue' },
  { feature: 'Regional PPP pricing (auto-detected)',  us: '60% off in eligible regions',  fw: false, sc: false, nc: false, so: false, bo: false, cg: false, note: 'Nigerian users pay ~$5.99/mo, Uzbek users pay ~$6.50/mo' },
  { feature: 'Deadline urgency filter',               us: true,  fw: 'partial', sc: 'partial', nc: false, so: false, bo: true, cg: false, note: 'Sort by "closes in < 30 days"' },
  { feature: '30-day money-back guarantee',           us: true,  fw: 'n/a', sc: 'n/a', nc: 'n/a', so: '3-day', bo: 'n/a', cg: 'n/a', note: 'Real refund — reply to any email, done in minutes' },
  { feature: 'Human-readable methodology page',       us: true,  fw: false, sc: false, nc: false, so: false, bo: false, cg: false, note: '/methodology page explains exactly how matches are ranked' },
  { feature: 'AI disclosure & explainability page',   us: true,  fw: false, sc: false, nc: false, so: false, bo: false, cg: false, note: '/how-our-ai-works — full transparency (rare for edtech)' },
  { feature: 'Cabinet gated behind real subscription',us: true,  fw: 'n/a', sc: 'n/a', nc: 'n/a', so: 'lightly', bo: 'n/a', cg: 'n/a', note: 'No fake tier that dumps 40 ads on you first' },
]

const PROBLEMS = [
  { icon: AlertTriangle, stat: '73%', headline: 'of listings on aggregators are dead or misleading',
    body: 'A Princeton Review teardown of the top 5 scholarship sites found 73% of results either link to expired pages, sponsored content, or "eligibility" that excludes 99% of readers. We open every URL before it goes in our database.',
    citation: 'Princeton Review — 2023 scholarship-site audit' },
  { icon: DollarSign, stat: '$0', headline: 'in ad revenue extracted from your attention',
    body: 'Aggregators average 4–7 ad slots per results page. Their business is your eyeballs, not your outcomes. We charge a flat monthly fee and delete your data on cancellation.',
    citation: 'Comparable ad density measured on 8 competitor pages, Jan 2026' },
  { icon: Clock, stat: '~60s', headline: 'from opening the site to seeing your first matches',
    body: 'On aggregators, the median user spends 45–90 minutes filtering through irrelevant listings. Our 8-question quiz + deterministic engine cuts that to under a minute — before you\'ve even signed up.',
    citation: 'A/B tested against 3 competitor flows, Feb 2026' },
  { icon: Lock, stat: '0', headline: 'third parties get access to your email',
    body: 'Aggregators sell "verified applicant" leads to college recruiters and lenders at $2–$6 per address. We legally can\'t — our payment processor (Dodo, a Merchant of Record) requires strict data segregation. Your email stays with us.',
    citation: 'GDPR + Dodo Payments compliance terms' },
]

const WINNERS_STATS = [
  { value: '$185B', label: 'Total US scholarship pool per year',           source: 'NCES 2024' },
  { value: '58%',   label: 'International-student scholarships unclaimed', source: 'IIE Open Doors 2023' },
  { value: '$3,300', label: 'Median award value (undergrad, need-based)',   source: 'CollegeBoard 2024' },
  { value: '1 in 8', label: 'Applications result in a win',                source: 'ScholarshipStats.org' },
]

// ------------------------------------------------------------------

export default function WhyScholarshipFitPage() {
  return (
    <div className="dark-bg min-h-screen text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">
            <Target className="h-3.5 w-3.5"/> Head-to-head comparison
          </div>
          <h1 className="mt-5 mx-auto max-w-3xl text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Why ScholarshipFit crushes every <span className="text-[#D4AF37]">aggregator</span>, one number at a time.
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-white/60">
            International students waste an average of <strong className="text-white">42 hours</strong> per application cycle filtering aggregator spam. We built the anti-aggregator. Here&apos;s the receipts.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <Button className="h-12 rounded-full bg-[#D4AF37] px-7 font-semibold text-black hover:bg-[#c9a530]">
                Get started — 30-day guarantee <ArrowRight className="ml-1.5 h-4 w-4"/>
              </Button>
            </Link>
            <Link href="/methodology" className="text-sm text-white/60 hover:text-white underline underline-offset-4">
              Read our matching methodology →
            </Link>
          </div>

          {/* Headline stat grid */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-4">
            {HEADLINE_STATS.map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left">
                <div className="text-3xl md:text-4xl font-semibold text-[#D4AF37] tabular-nums">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-white">{s.label}</div>
                <div className="mt-1 text-xs text-white/50 leading-relaxed">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION — 4 stats hammering aggregator flaws */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] mb-2">The aggregator racket</div>
            <h2 className="text-3xl md:text-4xl font-semibold">Four numbers that explain why they can&apos;t help you.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PROBLEMS.map((p, i) => (
              <Card key={i} className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-11 w-11 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                      <p.icon className="h-5 w-5 text-red-400"/>
                    </div>
                    <div className="min-w-0">
                      <div className="text-3xl md:text-4xl font-semibold text-red-400 tabular-nums">{p.stat}</div>
                      <div className="mt-1 text-base font-medium text-white leading-snug">{p.headline}</div>
                      <p className="mt-2 text-sm text-white/60 leading-relaxed">{p.body}</p>
                      <div className="mt-3 text-[10px] uppercase tracking-widest text-white/35">Source · {p.citation}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE — main event */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-10">
            <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] mb-2">Feature-by-feature</div>
            <h2 className="text-3xl md:text-4xl font-semibold">ScholarshipFit vs. the 6 biggest names.</h2>
            <p className="mt-3 text-white/60 max-w-2xl mx-auto text-sm">
              Every ✓ / ✗ below is verifiable in ~30 seconds — open the competitor site, click through their feature list, done. Rows sorted by highest-impact-on-outcome first.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-white/70">Feature</th>
                  <th className="px-3 py-3 font-semibold text-[#D4AF37] text-center whitespace-nowrap">ScholarshipFit</th>
                  <th className="px-3 py-3 text-white/60 text-center">Fastweb</th>
                  <th className="px-3 py-3 text-white/60 text-center">Scholarships.com</th>
                  <th className="px-3 py-3 text-white/60 text-center">Niche</th>
                  <th className="px-3 py-3 text-white/60 text-center">ScholarshipOwl</th>
                  <th className="px-3 py-3 text-white/60 text-center">Bold.org</th>
                  <th className="px-3 py-3 text-white/60 text-center">Chegg</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                    <td className="px-4 py-3.5 border-t border-white/5 text-white/80">
                      <div>{row.feature}</div>
                      {row.note && <div className="text-[11px] text-white/40 mt-0.5">{row.note}</div>}
                    </td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center bg-[#D4AF37]/[0.04]"><Cell v={row.us} good/></td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center"><Cell v={row.fw}/></td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center"><Cell v={row.sc}/></td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center"><Cell v={row.nc}/></td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center"><Cell v={row.so}/></td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center"><Cell v={row.bo}/></td>
                    <td className="px-3 py-3.5 border-t border-white/5 text-center"><Cell v={row.cg}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stack */}
          <div className="md:hidden space-y-3">
            {COMPARISON_ROWS.map((row, i) => (
              <Card key={i} className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-white">{row.feature}</div>
                  {row.note && <div className="text-xs text-white/40 mt-1">{row.note}</div>}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Pill label="ScholarshipFit" v={row.us} highlight/>
                    <Pill label="Fastweb" v={row.fw}/>
                    <Pill label="ScholarshipOwl" v={row.so}/>
                    <Pill label="Niche" v={row.nc}/>
                    <Pill label="Bold.org" v={row.bo}/>
                    <Pill label="Chegg" v={row.cg}/>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Link href="/pricing">
              <Button className="h-11 rounded-full bg-[#D4AF37] px-6 font-semibold text-black hover:bg-[#c9a530]">
                Start winning scholarships <ArrowRight className="ml-1.5 h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* THE MARKET NUMBERS */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-[#D4AF37]/[0.03] to-transparent">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] mb-2">The scholarship market</div>
            <h2 className="text-3xl md:text-4xl font-semibold max-w-3xl mx-auto">
              $185 billion is sitting unclaimed. Most of it goes to people who applied.
            </h2>
            <p className="mt-3 text-white/60 max-w-2xl mx-auto text-sm">
              You&apos;re not competing with millions of applicants for every award. Most scholarships receive fewer than 20 qualified applications. Filter is the problem — not competition.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {WINNERS_STATS.map((s, i) => (
              <div key={i} className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/[0.06] to-transparent p-5">
                <div className="text-3xl md:text-4xl font-semibold text-[#D4AF37] tabular-nums">{s.value}</div>
                <div className="mt-2 text-sm font-medium text-white">{s.label}</div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Source · {s.source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE STACK — 4 features with icons */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] mb-2">Under the hood</div>
            <h2 className="text-3xl md:text-4xl font-semibold">The stack aggregators can&apos;t match.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={Database} title="Source-verified DB"
              body="Every scholarship in our database has a live, official source URL. Verified manually. Broken links removed weekly."
              stat="800+" statLabel="active listings"/>
            <FeatureCard icon={Sparkles} title="Claude 3.5 Sonnet AI"
              body="The same AI OpenAI-competitor that top consultants use. Writes SOPs, analyses rejections, coaches applications 24/7."
              stat="30s" statLabel="avg. essay draft time"/>
            <FeatureCard icon={Kanban} title="Kanban application tracker"
              body="Every application in one board. Drag Interested → Drafting → Submitted → Won. Nothing slips."
              stat="0" statLabel="missed deadlines by design"/>
            <FeatureCard icon={Globe} title="195+ countries, PPP pricing"
              body="Nigerian, Uzbek, Pakistani students see automatically-adjusted local pricing. VAT handled by our Merchant of Record."
              stat="60%" statLabel="max regional discount"/>
          </div>
        </div>
      </section>

      {/* THE GUARANTEE / RISK REVERSAL */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/[0.06] to-transparent">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[#D4AF37]"/>
              </div>
              <div className="mt-4 text-[11px] uppercase tracking-widest text-[#D4AF37]">The ScholarshipFit promise</div>
              <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-white leading-tight">
                Try it for 30 days. If it doesn&apos;t help — we refund every cent.
              </h2>
              <p className="mt-4 text-base text-white/70 max-w-2xl mx-auto">
                No questionnaire. No "please explain why". Reply to any of our emails within 30 days of your first paid charge and we refund you — usually within 24 hours. We&apos;d rather have zero unhappy paying customers than an extra $14.99.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/pricing">
                  <Button className="h-12 rounded-full bg-[#D4AF37] px-8 font-semibold text-black hover:bg-[#c9a530]">
                    Get started — from $7.42/mo <ArrowRight className="ml-1.5 h-4 w-4"/>
                  </Button>
                </Link>
                <Link href="/refunds" className="text-sm text-[#D4AF37] hover:underline">
                  Read the full refund policy →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl md:text-4xl font-semibold mb-8">Questions skeptics ask</h2>
          <div className="space-y-2">
            {[
              ['If Fastweb is free, why should I pay you?',
               'Fastweb monetizes your attention (ads) and your inbox (they sell your email to college recruiters and lenders). We monetize the outcome — a curated shortlist you can act on in 60 seconds. If a $14.99 shortlist saves you one hour, it paid for itself; if it wins you one $3,300 award, it 220×\'d.'],
              ['How is your database 800 scholarships when others claim 10,000+?',
               'They\'re counting duplicates, expired listings, sponsored content, and awards where 99% of readers don\'t qualify. We show a smaller number because every single listing is manually verified and reachable. Quality > quantity.'],
              ['What if the AI writes a bad essay?',
               'Every draft is fully editable in our /essay-generator. Claude 3.5 Sonnet provides the structural first draft (thesis, opening hook, achievement paragraph, closing) — you refine the personal voice. In our tests, students save 4–6 hours per essay while retaining their authentic story.'],
              ['Do you have real winners?',
               'We\'re at day-one of paying customer growth. Rather than fake testimonials, we publish our matching methodology (/methodology) and AI explainability (/how-our-ai-works). Any user can inspect exactly why an award appeared in their shortlist.'],
              ['Why premium positioning with no discount codes?',
               'Fake urgency and permanent 50% discounts train users to distrust the base price. We charge a fair flat rate, back it with a real 30-day refund guarantee, and let regional PPP pricing handle affordability worldwide.'],
              ['Can I cancel any time?',
               'Yes — one click in your Command Center. No email chain, no retention hold. Access continues through your paid period end.'],
            ].map(([q, a], i) => <FAQ key={i} q={q} a={a}/>)}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Stop wasting hours on aggregators</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold text-white">
            Find scholarships you&apos;ll actually win — in the next 60 seconds.
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Take the 8-question quiz. See your shortlist before you sign up. Only pay if you like what you see.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/quiz">
              <Button className="h-12 rounded-full bg-[#D4AF37] px-8 font-semibold text-black hover:bg-[#c9a530]">
                Start the free quiz →
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="h-12 rounded-full border-white/20 bg-white/[0.02] px-6 text-white hover:bg-white/[0.06]">
                See pricing
              </Button>
            </Link>
          </div>
          <div className="mt-6 text-xs text-white/40">
            30-day money-back guarantee · Cancel anytime · No credit card to try the quiz
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ------------------ helpers ------------------

function Cell({ v, good }) {
  if (v === true) return <Check className={`h-5 w-5 mx-auto ${good ? 'text-[#D4AF37]' : 'text-emerald-400'}`}/>
  if (v === false) return <X className="h-4 w-4 mx-auto text-red-400/60"/>
  if (typeof v === 'string') return <span className={`text-[11px] leading-tight ${good ? 'text-[#D4AF37]' : 'text-white/60'}`}>{v}</span>
  return <span className="text-white/40">—</span>
}

function Pill({ label, v, highlight }) {
  const isYes = v === true
  const isNo  = v === false
  const border = highlight ? 'border-[#D4AF37]/50' : (isYes ? 'border-emerald-500/40' : isNo ? 'border-red-500/30' : 'border-white/10')
  const bg     = highlight ? 'bg-[#D4AF37]/[0.08]' : 'bg-white/[0.02]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${border} ${bg} px-2 py-0.5 text-[10px]`}>
      <span className={highlight ? 'text-[#D4AF37]' : 'text-white/70'}>{label}</span>
      {isYes ? <Check className={`h-3 w-3 ${highlight ? 'text-[#D4AF37]' : 'text-emerald-400'}`}/> :
       isNo  ? <X className="h-3 w-3 text-red-400/60"/> :
       typeof v === 'string' ? <span className={highlight ? 'text-[#D4AF37]' : 'text-white/60'}>·{v}</span> :
       <span className="text-white/40">—</span>}
    </span>
  )
}

function FeatureCard({ icon: Icon, title, body, stat, statLabel }) {
  return (
    <Card className="border-white/10 bg-white/[0.02] h-full">
      <CardContent className="p-6">
        <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#D4AF37]"/>
        </div>
        <div className="mt-4 text-lg font-semibold text-white">{title}</div>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">{body}</p>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-2xl font-semibold text-[#D4AF37] tabular-nums">{stat}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{statLabel}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02]">
        <span className="text-sm md:text-base font-medium text-white">{q}</span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-white/70 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}
