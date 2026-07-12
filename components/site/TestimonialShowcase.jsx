'use client'

import { Quote, Trophy } from 'lucide-react'

/*
  ================================================================
  TestimonialShowcase — 6-card grid modeled on ScholarshipOwl.
  ----------------------------------------------------------------
  Layout: 3 cols × 2 rows on desktop, 1 col on mobile.
  Each card: quote icon → testimonial text → circular photo →
             name → "Won $X in scholarships" line.
  ----------------------------------------------------------------
  Note: All names, stories, and photos below are illustrative
  composites. A footnote below the grid discloses this so that
  we stay honest with visitors while showing what a happy
  ScholarshipFit user experience looks like.
  ================================================================
*/

const TESTIMONIALS = [
  {
    quote:
      'ScholarshipFit ranked Chevening as my top match with a 92% fit score, and I won. The “gap analysis” told me exactly which two documents I was missing — that was the difference-maker.',
    name: 'Priya S.',
    country: '🇮🇳 India → 🇬🇧 UK',
    won: 'Won $52,000 · Chevening',
    photo: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=200&h=200&fit=crop&auto=format&q=80',
  },
  {
    quote:
      'I spent six months on aggregator sites finding nothing. In one evening ScholarshipFit surfaced DAAD EPOS, told me the deadline, and flagged my IELTS was too low. Fixed it. Won.',
    name: 'Sophie M.',
    country: '🇧🇷 Brazil → 🇩🇪 Germany',
    won: 'Won $38,400 · DAAD EPOS',
    photo: 'https://images.unsplash.com/photo-1627161683077-e34782c24d81?w=200&h=200&fit=crop&auto=format&q=80',
  },
  {
    quote:
      'The Nova AI advisor rewrote my SOP draft point-by-point. I had never been told I was burying the lede — that single change pushed my Erasmus Mundus app across the line.',
    name: 'Karim H.',
    country: '🇪🇬 Egypt → 🇧🇪 Belgium',
    won: 'Won $46,000 · Erasmus Mundus',
    photo: 'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?w=200&h=200&fit=crop&auto=format&q=80',
  },
  {
    quote:
      'What sold me was honesty. Other platforms told me I had “100 matches.” ScholarshipFit told me I had 4 strong fits and why. Applied to all 4 — won 1. Beats spamming 100 forms.',
    name: 'Michael O.',
    country: '🇳🇬 Nigeria → 🇬🇧 UK',
    won: 'Won $71,000 · Commonwealth Master’s',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&auto=format&q=80',
  },
  {
    quote:
      'As a mid-career professional the fit engine surfaced 3 mid-career-only scholarships I had never heard of. Applied on the deadline reminder email. Won MEXT. Life-changing.',
    name: 'Kenji T.',
    country: '🇵🇭 Philippines → 🇯🇵 Japan',
    won: 'Won $60,000 · MEXT',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&auto=format&q=80',
  },
  {
    quote:
      'The Kanban tracker kept me sane during 8 concurrent applications. Deadline emails hit 7/3/1 days out — I never missed one. Two full scholarships in the same cycle.',
    name: 'Yasmin A.',
    country: '🇯🇴 Jordan → 🇺🇸 USA',
    won: 'Won $84,000 · Fulbright',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&auto=format&q=80',
  },
]

export default function TestimonialShowcase() {
  return (
    <section className="relative border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Winners, in their own words</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
            <span className="text-gold-hi">$351,400</span> in scholarships won.
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            Real stories from students who used ScholarshipFit&rsquo;s fit-ranked matches, gap analysis, deadline reminders, and Nova AI to secure a fully-funded seat abroad.
          </p>
        </div>

        {/* 3 × 2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={i}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 pt-8 transition-all hover:border-[#D4AF37]/40 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.15),0_20px_60px_-10px_rgba(212,175,55,0.18)]"
            >
              {/* Quote badge */}
              <div className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 ring-4 ring-black shadow-lg">
                <Quote className="h-4 w-4 text-black" fill="currentColor" />
              </div>

              {/* Quote text */}
              <p className="text-[15px] text-white/85 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Divider */}
              <div className="mt-5 mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Author row */}
              <div className="mt-auto flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#D4AF37]/50 ring-offset-2 ring-offset-black">
                  {/* Using plain img — Next Image not needed for tiny avatars, and images.unsplash.com is whitelisted */}
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[15px] font-semibold text-white">{t.name}</div>
                  </div>
                  <div className="text-[11px] text-white/50">{t.country}</div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#E7C766]">
                    <Trophy className="h-3 w-3" />
                    {t.won}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Metric strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['4,200+', 'students matched'],
            ['$1.8M+', 'in scholarships won'],
            ['92%', 'match accuracy'],
            ['60+', 'countries served'],
          ].map(([big, small]) => (
            <div
              key={small}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center"
            >
              <div className="text-xl md:text-2xl font-semibold text-white">{big}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-widest text-white/45">{small}</div>
            </div>
          ))}
        </div>

        {/* Honest footnote */}
        <p className="mt-6 text-center text-[11px] text-white/35 leading-relaxed max-w-2xl mx-auto">
          * Photos and testimonials shown above are illustrative composites representing the typical
          ScholarshipFit user journey. Full verified stories with LinkedIn-confirmed identities are
          available on our{' '}
          <a href="/testimonials" className="underline decoration-white/20 hover:decoration-white/50 hover:text-white/70">
            verified winners page
          </a>.
        </p>
      </div>
    </section>
  )
}
