import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BlogBody from '@/components/site/BlogBody'
import { getPostBySlug, getRelatedPosts, getAllPosts } from '@/lib/blog-posts'
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-static'
export const revalidate = 86400  // ISR: re-render daily

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Not found' }
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'}/blog/${post.slug}`
  return {
    title: `${post.title} — ScholarshipFit`,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'ScholarshipFit',
      publishedTime: post.publishedAt,
      modifiedTime:  post.updatedAt,
      authors: [post.author?.name || 'ScholarshipFit'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    robots: { index: true, follow: true },
  }
}

export default async function Page({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  const related = getRelatedPosts(post.slug, 3)
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'}/blog/${post.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.description,
    'datePublished': post.publishedAt,
    'dateModified':  post.updatedAt || post.publishedAt,
    'author': { '@type': 'Organization', 'name': post.author?.name || 'ScholarshipFit' },
    'publisher': { '@type': 'Organization', 'name': 'ScholarshipFit', 'url': 'https://scholarshipfit.com' },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
    'url': url,
    'keywords': (post.tags || []).join(', '),
  }

  return (
    <div className="dark-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <article className="container mx-auto max-w-3xl px-4 pt-10 pb-8 md:pt-16">
        <Link href="/blog" className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
          <ArrowLeft className="h-3.5 w-3.5"/> All posts
        </Link>

        <div className="mt-6 text-[11px] uppercase tracking-widest text-[#D4AF37]">{post.category}</div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-white leading-tight">{post.title}</h1>
        <p className="mt-3 text-lg text-white/70 leading-relaxed">{post.description}</p>

        <div className="mt-5 flex items-center gap-4 text-xs text-white/50">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{post.readingMinutes} min read</span>
          <span className="text-white/40">· by {post.author?.name || 'ScholarshipFit Editorial'}</span>
        </div>

        <div className="mt-8">
          <BlogBody body={post.body} />
        </div>

        {/* Inline CTA */}
        <Card className="my-10 border-[#D4AF37]/30 bg-[#D4AF37]/[0.06]">
          <CardContent className="p-6 md:p-8">
            <div className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Next step</div>
            <h3 className="mt-2 text-xl font-semibold text-white">Get your personalised shortlist in 3 minutes.</h3>
            <p className="mt-2 text-sm text-white/70">Answer 8 quick questions. We rank all 800+ hand-verified scholarships against your profile — highlighting the ones you&rsquo;re a fit for, borderline on, or should skip.</p>
            <div className="mt-4">
              <Link href="/quiz"><Button className="btn-gold btn-pill h-11 px-6 font-semibold">
                Start the match quiz <ArrowRight className="ml-2 h-4 w-4"/>
              </Button></Link>
            </div>
          </CardContent>
        </Card>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-semibold text-white">Related reading</h2>
            <div className="mt-4 grid gap-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="block rounded-lg border border-white/10 bg-black/30 p-4 hover:border-[#D4AF37]/40 hover:bg-black/40 transition-colors">
                  <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70">{r.category}</div>
                  <div className="mt-1 text-white font-medium">{r.title}</div>
                  <div className="mt-1 text-xs text-white/50">{r.description}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </div>
  )
}
