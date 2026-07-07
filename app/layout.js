import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'ScholarshipFit — AI-powered, source-linked scholarship research',
  description: 'Turn your academic profile into an AI-powered, source-linked scholarship shortlist. Real records, official sources, honest reasoning — no invented results.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="paper-bg text-[#0A0A0A] antialiased selection:bg-black selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
