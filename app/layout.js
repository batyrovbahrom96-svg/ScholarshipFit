import './globals.css'
import { Providers } from './providers'
import CookieBanner from '@/components/site/CookieBanner'
import PremiumEffects from '@/components/site/PremiumEffects'

export const metadata = {
  title: 'ScholarshipFit — AI-powered, source-linked scholarship research',
  description: 'Turn your academic profile into an AI-powered, source-linked scholarship shortlist. Real records, official sources, honest reasoning — no invented results.',
  metadataBase: new URL('https://scholarshipfit.com'),
  openGraph: {
    title: 'ScholarshipFit — AI-powered scholarship research',
    description: 'Real records, official sources, honest reasoning — no invented results.',
    images: ['/brand-logo-full.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScholarshipFit',
    description: 'AI-powered, source-linked scholarship research for international students.',
    images: ['/brand-logo-full.png'],
  },
  // icons auto-discovered from app/icon.png, app/apple-icon.png, app/favicon.ico
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="dark-bg text-white antialiased selection:bg-cyan-500/30 selection:text-white">
        <Providers>{children}</Providers>
        <PremiumEffects />
        <CookieBanner />
      </body>
    </html>
  )
}
