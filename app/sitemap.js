// Next.js built-in sitemap generator — runs at build time and serves
// /sitemap.xml. Includes: home, static pages, 50 SEO landing pages,
// and all blog posts.
import { SEO_LANDING_PAGES } from '@/lib/seo-slugs'
import { getAllPosts } from '@/lib/blog-posts'

const BASE = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://scholarshipfit.com'

export default function sitemap() {
  const now = new Date().toISOString()

  const staticRoutes = [
    '',                     // home
    '/pricing',
    '/quiz',
    '/sample-report',
    '/database',
    '/scholarships',
    '/blog',
    '/advisor',
    '/simulator',
    '/rejection-debugger',
    '/verify',
    '/vs-chatgpt',
    '/about',
    '/testimonials',
    '/terms',
    '/privacy',
    '/refunds',
    '/dmca',
    '/legal',
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }))

  const scholarshipRoutes = SEO_LANDING_PAGES.map((p) => ({
    url: `${BASE}/scholarships/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const blogRoutes = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updatedAt || p.publishedAt || now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...scholarshipRoutes, ...blogRoutes]
}
