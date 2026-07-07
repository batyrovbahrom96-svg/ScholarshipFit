import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'ScholarshipFit — AI-powered, source-linked scholarship research',
  description: 'Turn your academic profile into an AI-powered, source-linked scholarship shortlist. Real records, official sources, honest reasoning — no invented results.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="dark-bg text-white antialiased selection:bg-cyan-500/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
