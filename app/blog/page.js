import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAllPosts } from '@/lib/blog-posts'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Scholarship Blog · Guides, Strategies, and Program Reviews — ScholarshipFit',
  description: 'In-depth guides on Chevening, DAAD, Commonwealth, Fulbright, motivation letters, IELTS/TOEFL, and every part of the scholarship journey.',
  alternates: { canonical: 'https://scholarshipfit.com/blog' },
  openGraph: {
    type: 'website',
    title: 'Scholarship Blog — ScholarshipFit',
    description: 'Guides, strategies, and program reviews for scholarship applicants.',
    url: 'https://scholarshipfit.com/blog',
  },
}

const CATEGORY_LABELS = {
  strategy:  'Strategy',
  guides:    'Guides',
  writing:   'Writing',
  programs:  'Programs',
  'test-prep': 'Test prep',
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      <section className="container mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-20">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#D4AF37]">
          <BookOpen className="h-3.5 w-3.5"/> ScholarshipFit Blog
        </div>
        <h1 className="mt-3 text-3xl md:text-5xl font-semibold text-white leading-tight">
          Scholarship playbooks, from people who’ve read the small print.
        </h1>
        <p className="mt-4 text-white/70 text-base md:text-lg max-w-3xl">
          Real, actionable advice on winning scholarships — no fluff, no generic listicles.
          Every post is written by editors who’ve read the fine print on hundreds of scholarships.
        </p>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-4 md:gap-5 md:grid-cols-2">
          {posts.map((p) => (
            <Card key={p.slug} className="border-white/10 bg-black/40 hover:border-[#D4AF37]/40 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#D4AF37]/80">
                  {CATEGORY_LABELS[p.category] || p.category}
                </div>
                <h2 className="mt-2 text-lg md:text-xl font-semibold text-white leading-snug group-hover:text-[#D4AF37]">
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </h2>
                <p className="mt-2 text-sm text-white/65 line-clamp-2">{p.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>{new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{p.readingMinutes} min read</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">Reading is step 1. Applying is step 2.</h2>
        <p className="mt-3 text-white/60">Once you know the strategy, run the quiz — we’ll rank all 800+ scholarships against your profile in seconds.</p>
        <div className="mt-6">
          <Link href="/quiz"><Button className="btn-gold btn-pill h-12 px-8 font-semibold">
            Get my matches — free <ArrowRight className="ml-2 h-4 w-4"/>
          </Button></Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
