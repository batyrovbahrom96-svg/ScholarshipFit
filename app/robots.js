// Next.js built-in robots.txt generator.
const BASE = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://scholarshipfit.com'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/admin',
          '/admin/',
          '/api/',
          '/verify-email',
          '/reset-password',
          '/forgot-password',
          '/my-cabinet',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/blog/',
        disallow: '/',   // Let GPTBot read our blog only
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
