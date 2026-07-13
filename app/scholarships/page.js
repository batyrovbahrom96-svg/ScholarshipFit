import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { SEO_LANDING_PAGES } from '@/lib/seo-slugs'
import { GraduationCap, Globe2, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Scholarship Directory · Browse by Country, Field, and Degree — ScholarshipFit',
  description: '800 hand-verified international scholarships. No dead links. No aggregator spam. Browse by nationality, destination country, degree level, and field of study — every listing sourced from the official provider.',
  alternates: { canonical: 'https://scholarshipfit.com/scholarships' },
  openGraph: {
    type: 'website',
    title: 'Scholarship Directory — ScholarshipFit',
    description: '800 hand-verified international scholarships. No dead links. No aggregator spam.',
    url: 'https://scholarshipfit.com/scholarships',
  },
}

const CATS = [
  { key: 'nationality',  label: 'By nationality',        icon: GraduationCap, desc: 'Find scholarships open to citizens of your country.' },
  { key: 'destination',  label: 'By destination',        icon: Globe2,        desc: 'Scholarships to study in a specific country.' },
  { key: 'degree',       label: 'By degree level',       icon: BookOpen,      desc: 'Master\'s, PhD, MBA, undergraduate, postdoc.' },
  { key: 'field',        label: 'By field of study',     icon: Sparkles,      desc: 'STEM, medicine, business, arts, and more.' },
]

export default function ScholarshipsHub() {
  const byCat = CATS.map((c) => ({
    ...c,
    pages: SEO_LANDING_PAGES.filter((p) => p.category === c.key),
  }))

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      <section className="container mx-auto max-w-6xl px-4 pt-14 pb-6 md:pt-20">
        <div className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Scholarship Directory</div>
        <h1 className="mt-3 text-3xl md:text-5xl font-semibold text-white leading-tight">
          Browse 800 hand-verified scholarships
        </h1>
        <p className="mt-4 text-white/70 text-base md:text-lg max-w-3xl">
          Every scholarship in our database is <span className="text-white font-medium">hand-verified</span> and source-linked to the official provider — <span className="text-white">no dead links, no aggregator spam, no middlemen</span>.
          Browse by nationality, destination country, degree level, or field of study.
        </p>
        <div className="mt-6">
          <Link href="/quiz">
            <Button className="btn-gold btn-pill h-11 px-6 font-semibold">
              Get personalised matches <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          </Link>
        </div>
      </section>

      {byCat.map((c) => (
        <section key={c.key} className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center gap-2">
            <c.icon className="h-5 w-5 text-[#D4AF37]"/>
            <h2 className="text-xl md:text-2xl font-semibold text-white">{c.label}</h2>
          </div>
          <p className="mt-1 text-sm text-white/50">{c.desc}</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {c.pages.map((p) => (
              <Link
                key={p.slug}
                href={`/scholarships/${p.slug}`}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80 hover:border-[#D4AF37]/40 hover:text-white transition-colors"
              >
                {p.h1.replace(' (2026)', '').replace(' (Fully & Partially Funded)', '')}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <Footer />
    </div>
  )
}
