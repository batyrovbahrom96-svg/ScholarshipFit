import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'ScholarshipFit — AI-powered scholarship research for international students',
  description: 'Turn your academic profile into an AI-powered, source-linked scholarship shortlist. ScholarshipFit analyzes your degree, field, scores, budget, and deadlines to recommend real scholarships with official source links and clear next steps.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-[#05070d] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
