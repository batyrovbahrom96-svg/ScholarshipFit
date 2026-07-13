// Dynamic SEO landing page.
// One file drives all 50 /scholarships/[slug] URLs (nationality, destination,
// degree, field). Statically generated at build time via generateStaticParams
// so Google crawls fully-rendered HTML with rich metadata.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MongoClient } from 'mongodb'
import { SEO_LANDING_PAGES, getLandingPage, getRelatedPages, allSlugs } from '@/lib/seo-slugs'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, ExternalLink, ArrowRight, ShieldCheck, Sparkles, Trophy, Globe2, DollarSign } from 'lucide-react'

export const dynamic = 'force-static'
export const revalidate = 3600  // ISR: re-render at most once per hour

/* ---------- Static params (all 50 slugs) ---------- */
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }))
}

/* ---------- Metadata (title / description / OG) ---------- */
export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = getLandingPage(slug)
  if (!page) return { title: 'Not found' }
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'}/scholarships/${page.slug}`
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.seoKeywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      siteName: 'ScholarshipFit',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
    robots: { index: true, follow: true },
  }
}

/* ---------- Data fetch (server-side) ---------- */
let _client
async function getDb() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
  }
  return _client.db(process.env.DB_NAME)
}

async function loadScholarships(page) {
  try {
    const db = await getDb()
    // Fetch a broad set and filter in-JS (avoids brittle Mongo query construction
    // per slug — the filter function is a plain predicate defined per landing page).
    const all = await db.collection('scholarships')
      .find({ public_status: { $ne: 'hidden' } })
      .project({ _id: 0 })
      .limit(2000)
      .toArray()
    return all.filter(page.filter).slice(0, 60)
  } catch (_e) {
    return []
  }
}

/* ---------- Rendering ---------- */
export default async function Page({ params }) {
  const { slug } = await params
  const page = getLandingPage(slug)
  if (!page) notFound()
  const scholarships = await loadScholarships(page)
  const related = getRelatedPages(page.slug, 8)
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'}/scholarships/${page.slug}`

  // JSON-LD structured data — ItemList of scholarships (Google rich results)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    'name':     page.h1,
    'description': page.metaDescription,
    'url':      url,
    'numberOfItems': scholarships.length,
    'itemListElement': scholarships.slice(0, 20).map((s, i) => ({
      '@type':    'ListItem',
      'position': i + 1,
      'item': {
        '@type':      'EducationalOccupationalProgram',
        'name':       s.scholarship_name,
        'provider':   { '@type': 'EducationalOrganization', 'name': s.university_name },
        'url':        s.source_url || s.application_link,
        'description': s.funding_summary || '',
        'offers':     { '@type': 'Offer', 'category': s.funding_type || 'Scholarship' },
      },
    })),
  }

  return (
    <div className="dark-bg min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto max-w-5xl px-4 pt-14 pb-8 md:pt-20">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#D4AF37]">
          <GraduationCap className="h-3.5 w-3.5"/> Scholarship Directory
        </div>
        <h1 className="mt-3 text-3xl md:text-5xl font-semibold text-white leading-tight">
          {page.h1}
        </h1>
        <p className="mt-4 text-white/70 text-base md:text-lg max-w-3xl">{page.intro}</p>

        {/* Trust row */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/50">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400"/>Every source verified</span>
          <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-[#D4AF37]"/>{scholarships.length} programs on this page</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-cyan-400"/>Ranked by fit + funding</span>
        </div>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/quiz"><Button className="btn-gold btn-pill h-11 px-6 font-semibold">
            Get my personalised matches <ArrowRight className="ml-2 h-4 w-4"/>
          </Button></Link>
          <Link href="/database" className="text-sm text-white/70 hover:text-white underline">
            or browse the full database →
          </Link>
        </div>
      </section>

      {/* Scholarship list */}
      <section className="container mx-auto max-w-5xl px-4 py-8">
        {scholarships.length === 0 ? (
          <Card className="border-white/10 bg-black/40">
            <CardContent className="p-8 text-center">
              <p className="text-white/60">
                We're growing this category — check back next week, or {' '}
                <Link href="/quiz" className="text-[#D4AF37] hover:underline">run the quiz</Link>
                {' '}for personalised matches across all 800 hand-verified programs.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scholarships.map((s, idx) => (
              <Card key={s.slug || idx} className="border-white/10 bg-black/40 hover:border-[#D4AF37]/30 transition-colors">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70">
                        {s.university_name}
                      </div>
                      <h2 className="mt-1 text-lg md:text-xl font-semibold text-white leading-snug">
                        <Link href={`/scholarships/${page.slug}#${s.slug || idx}`} className="hover:text-[#D4AF37]">
                          {s.scholarship_name}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm text-white/70 line-clamp-2">
                        {s.funding_summary || s.eligibility_summary || ''}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/50">
                        {s.country && (
                          <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5"/>{s.country}</span>
                        )}
                        {s.funding_amount && (
                          <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5"/>{s.funding_amount.slice(0, 60)}{s.funding_amount.length > 60 ? '…' : ''}</span>
                        )}
                        {s.deadline_status && (
                          <span className="inline-flex items-center gap-1 text-white/60">📅 {s.deadline_status}</span>
                        )}
                      </div>
                    </div>
                    {s.source_url && (
                      <a
                        href={s.source_url}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 hover:border-[#D4AF37]/40 hover:text-white"
                      >
                        Official page <ExternalLink className="h-3 w-3"/>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Related landing pages — internal linking */}
      {related.length > 0 && (
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-xl font-semibold text-white">Related pages</h2>
          <p className="mt-1 text-sm text-white/50">Explore more curated scholarship lists.</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/scholarships/${r.slug}`}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80 hover:border-[#D4AF37]/40 hover:text-white transition-colors"
              >
                {r.h1.replace(' (2026)', '').replace(' (Fully & Partially Funded)', '')}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">Stop scrolling. Get your personalised shortlist.</h2>
        <p className="mt-3 text-white/60">
          Answer 8 quick questions and we&apos;ll rank all 800 hand-verified scholarships against your profile — showing exactly what you qualify for, what you&apos;re borderline on, and what to skip.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/quiz"><Button className="btn-gold btn-pill h-12 px-8 font-semibold">
            Match me now — free <ArrowRight className="ml-2 h-4 w-4"/>
          </Button></Link>
          <Link href="/sample-report"><Button variant="outline" className="btn-pill h-12 px-6">
            See a sample report
          </Button></Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
