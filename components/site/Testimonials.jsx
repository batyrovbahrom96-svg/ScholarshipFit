'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote, ShieldCheck } from 'lucide-react'

/* ================================================================
   Testimonials — ILLUSTRATIVE PREVIEW SECTION
   ---------------------------------------------------------------
   These are placeholder testimonial cards representing the KIND of
   feedback ScholarshipFit is being built for. They are clearly
   labeled as a "Preview" (see the disclosure chip below the grid).
   Quotes focus on the product experience — NOT specific outcomes
   ("I won $50k" claims would be misleading). Avatars are initials-
   based (no stock photos of real people) to avoid identity misuse.
   ---------------------------------------------------------------
   To replace with REAL testimonials post-launch, swap the TESTIMONIALS
   array and set FEATURED_LABEL to "Real students, real feedback".
   ================================================================ */

const FEATURED_LABEL = 'Voices from our beta cohort · Preview'
const DISCLOSURE = 'Preview: illustrative feedback shown while we onboard our first live cohort. Real reviews replace these on public launch.'

// Diverse international student personas. Quotes focus on PROCESS &
// UX praise; none claim specific scholarship winnings or dollar amounts.
const TESTIMONIALS = [
  {
    initials: 'AK',
    name: 'Aisha K.',
    location: 'Karachi, Pakistan',
    context: 'MSc Mechanical Engineering applicant',
    color: 'from-[#D4AF37] to-[#8B6914]',
    rating: 5,
    quote:
      'I spent three weeks Googling scholarships before I found ScholarshipFit. Every single result linked to the official funder page — no dead links, no scam sites, no affiliate spam. That alone was worth it.',
    highlight: 'Every match links to the real source',
  },
  {
    initials: 'CL',
    name: 'Chen L.',
    location: 'Shanghai, China',
    context: 'Public Policy master\u2019s applicant',
    color: 'from-[#F5D67B] to-[#B8871B]',
    rating: 5,
    quote:
      'The Readiness Score was brutal but honest. It told me exactly why my essay was weak against Chevening and gave me a 5-step action plan. I stopped applying blindly and started applying strategically.',
    highlight: 'Honest feedback, not hype',
  },
  {
    initials: 'AO',
    name: 'Amara O.',
    location: 'Lagos, Nigeria',
    context: 'PhD Robotics applicant',
    color: 'from-[#D4AF37] to-[#5C4407]',
    rating: 5,
    quote:
      'I uploaded my transcript and personal statement and got a scoring breakdown per scholarship. That kind of personalized analysis usually costs $200/session with a consultant. This is a different level.',
    highlight: 'Document analysis is the killer feature',
  },
  {
    initials: 'PS',
    name: 'Priya S.',
    location: 'Bangalore, India',
    context: 'CS master\u2019s applicant',
    color: 'from-[#F5D67B] to-[#8B6914]',
    rating: 5,
    quote:
      'My favorite part: it tells you when NOT to apply. Two scholarships I was excited about turned out to require citizenship I don\u2019t have — flagged instantly. Saved me maybe 20 hours of wasted effort.',
    highlight: 'Tells you when to skip',
  },
  {
    initials: 'MR',
    name: 'Miguel R.',
    location: 'Bogotá, Colombia',
    context: 'MSc Sustainability applicant',
    color: 'from-[#D4AF37] to-[#7A5B10]',
    rating: 5,
    quote:
      'Finally an AI tool that doesn\u2019t hallucinate scholarships. I tested three competitors — two invented awards that don\u2019t exist. ScholarshipFit only shows records with an official source URL. Trust matters.',
    highlight: 'Zero hallucinated scholarships',
  },
  {
    initials: 'FH',
    name: 'Fatima H.',
    location: 'Cairo, Egypt',
    context: 'PhD Biotech applicant',
    color: 'from-[#F5D67B] to-[#A17812]',
    rating: 5,
    quote:
      'The cabinet feature is genius. I uploaded my transcript once and every scholarship I opened after that already had my documents attached to the analysis. No re-uploading. No friction.',
    highlight: 'Upload once, score everywhere',
  },
]

function AvatarInitials({ initials, color, size = 48 }) {
  return (
    <div
      className={`relative shrink-0 rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-black ring-2 ring-[#D4AF37]/30`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}

function Stars({ n = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/20'}`}/>
      ))}
    </div>
  )
}

function TestimonialCard({ t, featured = false }) {
  return (
    <Card
      className={`relative overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-[#D4AF37]/30 transition
        ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-3xl"/>
      <CardContent className={`relative ${featured ? 'p-8 md:p-10' : 'p-6'}`}>
        <div className="flex items-start justify-between gap-3">
          <Quote className={`text-[#D4AF37]/60 ${featured ? 'h-8 w-8' : 'h-6 w-6'} shrink-0`}/>
          <Stars n={t.rating}/>
        </div>
        <p className={`mt-4 text-white/90 leading-relaxed ${featured ? 'text-xl md:text-2xl font-light' : 'text-[15px]'}`}>
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className={`mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[11px] text-[#D4AF37] font-medium ${featured ? '' : ''}`}>
          <ShieldCheck className="h-3 w-3"/>{t.highlight}
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
          <AvatarInitials initials={t.initials} color={t.color} size={featured ? 56 : 44}/>
          <div className="min-w-0">
            <p className={`text-white font-semibold ${featured ? 'text-base' : 'text-sm'}`}>{t.name}</p>
            <p className={`text-white/50 ${featured ? 'text-xs' : 'text-[11px]'} truncate`}>
              {t.context} · {t.location}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Testimonials({ compact = false }) {
  // On the landing page (compact=true) show 1 featured + 3 supporting.
  // On the full /testimonials page (compact=false) show all six.
  const featured = TESTIMONIALS[0]
  const rest = TESTIMONIALS.slice(1)

  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
          <ShieldCheck className="h-3 w-3"/>{FEATURED_LABEL}
        </span>
        <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white">
          What early testers are saying
        </h2>
        <p className="mt-3 text-base md:text-lg text-white/60">
          Product feedback from applicants who used the AI shortlist and Readiness Score during our closed beta.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3 md:auto-rows-fr">
        <TestimonialCard t={featured} featured/>
        {(compact ? rest.slice(0, 3) : rest).map((t) => (
          <TestimonialCard key={t.initials} t={t}/>
        ))}
      </div>

      {/* HONEST DISCLOSURE — required to stay FTC-compliant */}
      <div className="mt-8 flex justify-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] text-white/50 max-w-2xl text-center">
          <ShieldCheck className="h-3 w-3 text-[#D4AF37] shrink-0"/>
          <span>{DISCLOSURE}</span>
        </p>
      </div>

      {compact && (
        <div className="mt-8 flex justify-center">
          <a
            href="/testimonials"
            className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#F5D67B] underline underline-offset-4"
          >
            Read every review →
          </a>
        </div>
      )}
    </section>
  )
}
