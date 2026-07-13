'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Linkedin, ShieldCheck, ExternalLink, Sparkles, ArrowRight, Quote as QuoteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVerifiedTestimonials } from '@/lib/testimonials'

/**
 * TestimonialWall — the honest version.
 *
 * Renders ONLY entries from /lib/testimonials.js where verified === true
 * and linkedin_url is present. If the list is empty, we show a
 * transparent "we're a young company" section with a CTA for real
 * users to submit their own success story.
 *
 * No made-up personas. No stock-photo attributions. No "Marcus D."
 * Every visible testimonial links to a real LinkedIn profile that
 * anyone can click and verify.
 */
export default function TestimonialWall() {
  const items = getVerifiedTestimonials()

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/[0.03] to-transparent pointer-events-none"/>
      <div className="container mx-auto max-w-6xl px-4 relative">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-1 text-[11px] uppercase tracking-widest text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5"/> Verified stories only
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-white">
            {items.length > 0
              ? 'Real students. Real LinkedIn profiles. Real scholarships.'
              : "We only publish testimonials with verified identities."}
          </h2>
          <p className="mt-3 text-white/60 leading-relaxed">
            {items.length > 0
              ? 'Every quote below is from a verified user — click the LinkedIn icon on any card to check the profile yourself. No pseudonyms, no stock photos, no invented reviews.'
              : "No stock photos. No fake reviews. No invented winners. Every testimonial that appears on this wall is manually verified against a real LinkedIn profile and a real scholarship offer letter. As our first cohort receives their results, this space fills up — one honest story at a time."}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t}/>
            ))}
          </div>
        ) : (
          <div className="mt-12 mx-auto max-w-3xl grid gap-6 md:grid-cols-2">
            {/* Honest empty state — two side-by-side calls to action */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 md:p-7">
              <Sparkles className="h-6 w-6 text-[#D4AF37]"/>
              <h3 className="mt-3 text-lg font-semibold text-white">Our verification standard</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/70 leading-relaxed">
                <li className="flex items-start gap-2"><span className="text-[#D4AF37]">✓</span> Every testimonial links to a public LinkedIn profile you can inspect</li>
                <li className="flex items-start gap-2"><span className="text-[#D4AF37]">✓</span> Every &quot;$ won&quot; figure references the official scholarship award letter</li>
                <li className="flex items-start gap-2"><span className="text-[#D4AF37]">✓</span> No pseudonyms, no stock photos, no AI-generated personas on this wall</li>
                <li className="flex items-start gap-2"><span className="text-[#D4AF37]">✓</span> Full <Link href="/methodology" className="text-[#D4AF37] hover:underline">methodology</Link> published publicly</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.05] p-6 md:p-7">
              <QuoteIcon className="h-6 w-6 text-[#D4AF37]"/>
              <h3 className="mt-3 text-lg font-semibold text-white">Won something using ScholarshipFit?</h3>
              <p className="mt-3 text-sm text-white/75 leading-relaxed">
                Share your story and we&apos;ll feature it here after LinkedIn verification. We&apos;d rather show 3 real winners than 30 fake ones.
              </p>
              <Link href="/share-your-story" className="mt-4 inline-block">
                <Button className="btn-gold btn-pill h-10 px-5">
                  Share your verified story <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function TestimonialCard({ t }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 hover:border-[#D4AF37]/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex text-[#D4AF37]">
          {Array.from({ length: t.stars || 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current"/>
          ))}
        </div>
        <a
          href={t.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-[#0A66C2] transition-colors"
          aria-label={`Verify ${t.name} on LinkedIn`}
        >
          <Linkedin className="h-3.5 w-3.5"/> Verify <ExternalLink className="h-3 w-3"/>
        </a>
      </div>

      <blockquote className="mt-4 text-sm text-white/80 leading-relaxed">
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
        {t.photo_url ? (
          <div className="h-10 w-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
            <Image src={t.photo_url} alt={t.name} width={40} height={40}/>
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-semibold text-sm">
            {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{t.name}</div>
          <div className="text-xs text-white/50 truncate">
            {t.scholarship}{t.year ? ` · ${t.year}` : ''}
            {t.university ? ` · ${t.university}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
