import { Suspense } from 'react'
import './globals.css'
import { Providers } from './providers'
import CookieBanner from '@/components/site/CookieBanner'
import PremiumEffects from '@/components/site/PremiumEffects'
import ExitIntentModal from '@/components/site/ExitIntentModal'
import PostHogPageView from '@/components/site/PostHogPageView'
import UrgencyBanner from '@/components/site/UrgencyBanner'

export const metadata = {
  title: 'ScholarshipFit — 800+ hand-verified scholarships, ranked by fit',
  description: '800+ hand-verified, premium scholarships. No dead links. No aggregator spam. Turn your academic profile into an AI-powered, source-linked shortlist ranked by fit — every listing sourced from the official provider.',
  metadataBase: new URL('https://scholarshipfit.com'),
  openGraph: {
    title: 'ScholarshipFit — 800+ hand-verified scholarships, ranked by fit',
    description: '800+ hand-verified premium scholarships. No dead links. No aggregator spam. Every listing sourced from the official provider.',
    images: ['/brand-logo-full.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScholarshipFit',
    description: '800+ hand-verified premium scholarships for international students. No dead links. No aggregator spam.',
    images: ['/brand-logo-full.png'],
  },
  // icons auto-discovered from app/icon.png, app/apple-icon.png, app/favicon.ico
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="dark-bg text-white antialiased selection:bg-cyan-500/30 selection:text-white">
        <Providers>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {/* Site-wide founder-launch urgency strip (auto-hides when campaign ends) */}
          <UrgencyBanner variant="strip"/>
          {children}
        </Providers>
        <PremiumEffects />
        <CookieBanner />
        <ExitIntentModal />
      </body>
    </html>
  )
}
