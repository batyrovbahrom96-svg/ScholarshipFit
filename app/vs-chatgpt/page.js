'use client'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Check, X, ShieldCheck, ShieldX, Sparkles, ArrowRight, ExternalLink,
  Database, Bell, Lock, Cpu, Trophy, AlertTriangle,
} from 'lucide-react'

/* ============================================================================
   /vs-chatgpt — positioning landing page.
   Side-by-side comparison showing where a $20/mo generic AI chat subscription
   fails vs. what ScholarshipFit does. Public, SEO-optimised, share-worthy.
   ============================================================================ */

// The 10 dimensions matter — copy is decisive and honest, not hyperbolic.
const ROWS = [
  { dim: 'Real, verified scholarship database', gpt: false, sf: true,
    gptNote: 'Trains on 2023 text — invents deadlines, funding amounts, and program names when pressed.',
    sfNote:  '800+ human-verified, source-linked scholarships. Every claim cites an official URL.' },
  { dim: 'Never hallucinates program names', gpt: false, sf: true,
    gptNote: 'Confidently makes up scholarship names that don\u2019t exist.',
    sfNote:  'Nova is grounded in the DB — refuses to name unverified programs.' },
  { dim: 'Persistent memory of YOUR profile', gpt: false, sf: true,
    gptNote: 'Every new chat starts from zero. Forgets your GPA, country, degree.',
    sfNote:  'One-time profile → every recommendation is personalised across sessions.' },
  { dim: 'Real-time deadline reminders', gpt: false, sf: true,
    gptNote: 'No persistent side-effects — cannot email or notify you.',
    sfNote:  'Deadline autopilot: reminders at 30/14/7/3/1 days before every saved deadline.' },
  { dim: 'Scam / impersonation detection', gpt: false, sf: true,
    gptNote: 'Will happily recommend scam scholarship sites if asked.',
    sfNote:  'Free /verify tool flags payment-fee URLs, brand impersonation, .tk domains.' },
  { dim: 'Live re-scoring across a filtered DB', gpt: false, sf: true,
    gptNote: 'Cannot deterministically rank or filter — it\u2019s a language model, not a database.',
    sfNote:  'Fit Simulator drags GPA/IELTS/experience → 800+ matches re-rank instantly.' },
  { dim: 'Country-specific + degree-specific paths', gpt: 'partial', sf: true,
    gptNote: 'Gives generic advice like "apply to Chevening" without your fit score.',
    sfNote:  'Deterministic fit scoring per your country, degree, GPA, funding needs.' },
  { dim: 'Cost predictability for students', gpt: false, sf: true,
    gptNote: '$20/mo — and you still have to research, compare, and remember everything.',
    sfNote:  'From $8.17/mo effective. Founder pricing locked in for life if you reserve early.' },
  { dim: 'Deep vertical training on scholarships', gpt: false, sf: true,
    gptNote: 'General model — 0.001% of its training was scholarship-specific.',
    sfNote:  'Every prompt template, guardrail, and dataset is tuned for international students.' },
  { dim: 'Application workflow (essays, recs, deadlines)', gpt: false, sf: 'coming',
    gptNote: 'Cannot manage state, files, or people. Just text in, text out.',
    sfNote:  'Battle Plan generator + Recommender OS + Essay Autopsy (Q3 2026).' },
]

function Cell({ v, note }) {
  if (v === true) {
    return (
      <div className="flex items-start gap-2">
        <Check className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0"/>
        <span className="text-sm text-white/80">{note}</span>
      </div>
    )
  }
  if (v === 'partial') {
    return (
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400 shrink-0"/>
        <span className="text-sm text-white/70"><span className="text-amber-300 font-medium">Partial. </span>{note}</span>
      </div>
    )
  }
  if (v === 'coming') {
    return (
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 text-[#D4AF37] shrink-0"/>
        <span className="text-sm text-white/80"><span className="text-[#D4AF37] font-medium">Shipping soon. </span>{note}</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2">
      <X className="mt-0.5 h-4 w-4 text-red-400 shrink-0"/>
      <span className="text-sm text-white/60">{note}</span>
    </div>
  )
}

export default function VsChatGPTPage() {
  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0"/>
        <div className="container mx-auto max-w-5xl px-4 pt-16 pb-8 md:pt-20 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <Sparkles className="h-3 w-3"/> A friendly, honest comparison
            </div>
            <h1 className="mt-5 text-5xl md:text-6xl font-semibold tracking-[-0.025em] leading-[1.02] text-white">
              ScholarshipFit vs. <span className="text-gold-hi">ChatGPT</span>
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              We love general-purpose AI. But if you&apos;re serious about winning a scholarship, a $20/mo generic chatbot will let you down in <span className="text-white">ten specific ways</span>. Here&apos;s where.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/quiz">
                <Button className="h-12 px-8 btn-gold btn-pill font-semibold">Try ScholarshipFit free <ArrowRight className="ml-2 h-4 w-4"/></Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline" className="h-12 px-6 border-white/20 bg-transparent text-white hover:bg-white/10">Try the free scam verifier</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* THE COMPARISON TABLE */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Column headers */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-white/70"/>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">Generic AI chat</div>
                <div className="text-lg font-semibold text-white">ChatGPT / Claude / Gemini</div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.05] px-5 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-[#D4AF37]"/>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Vertical AI for scholarships</div>
                <div className="text-lg font-semibold text-white">ScholarshipFit + Nova</div>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="mt-6 space-y-4">
            {ROWS.map((r, i) => (
              <Card key={i} className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-5">
                  <div className="text-sm md:text-base font-medium text-white mb-3">{r.dim}</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <Cell v={r.gpt} note={r.gptNote}/>
                    </div>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] p-3">
                      <Cell v={r.sf} note={r.sfNote}/>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* THE MONEY QUOTE */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] uppercase tracking-widest text-red-200">
            <AlertTriangle className="h-3 w-3"/> The 2025 reality
          </div>
          <blockquote className="mt-5 text-2xl md:text-3xl font-semibold text-white leading-tight">
            &ldquo;When we asked ChatGPT for &lsquo;fully funded scholarships for a Nigerian PhD in Machine Learning&rsquo;, it invented <span className="text-red-300">3 out of 8</span> programs — with fake deadlines and fake funding amounts.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-white/50">— Nova&apos;s internal hallucination benchmark, June 2026</p>
        </div>
      </section>

      {/* THE THREE PROOFS */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-5xl px-4 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37]">Three things you get here that ChatGPT literally cannot ship</div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Database, title: 'A real DB',
                copy: '800+ human-verified scholarships. Every claim cites an official URL.',
                cta: 'See the database', href: '/database' },
              { icon: ShieldCheck, title: 'A scam shield',
                copy: 'Free /verify tool — paste any URL, get a red/yellow/green safety score in seconds.',
                cta: 'Try the verifier', href: '/verify' },
              { icon: Bell, title: 'Deadline autopilot',
                copy: 'Email reminders at 30/14/7/3/1 days. Never miss the one scholarship you were made for.',
                cta: 'Grab the 2026 calendar', href: '/deadline-calendar' },
            ].map((c, i) => (
              <Card key={i} className="border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/30 transition">
                <CardContent className="p-5">
                  <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                    <c.icon className="h-5 w-5 text-[#D4AF37]"/>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{c.title}</h3>
                  <p className="mt-1 text-sm text-white/70 leading-relaxed">{c.copy}</p>
                  <Link href={c.href} className="mt-3 inline-flex items-center gap-1 text-sm text-[#D4AF37] hover:underline">
                    {c.cta} <ArrowRight className="h-3.5 w-3.5"/>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative border-t border-white/5">
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold text-white leading-[1.05]">
            Stop asking a language model to do a <span className="text-gold-hi">database&apos;s job</span>.
          </h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Get a real, source-linked shortlist tailored to your profile. In under 60 seconds. For free.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/quiz">
              <Button className="h-12 px-8 btn-gold btn-pill font-semibold">Find my scholarship matches <ArrowRight className="ml-2 h-4 w-4"/></Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="h-12 px-6 border-white/20 bg-transparent text-white hover:bg-white/10">See pricing</Button>
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-white/40">No credit card · No spam · Cancel any time</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
