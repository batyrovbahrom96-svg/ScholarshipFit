'use client'

import { useEffect } from 'react'

/**
 * Root-level error boundary — used only when the root layout itself throws.
 * Must include its own <html> and <body> since it *replaces* the layout.
 * Keep this dependency-free (no shadcn / no lucide) so it always renders.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[ScholarshipFit] global error boundary caught:', error)
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs').then(Sentry => {
        try { Sentry.captureException(error) } catch (_) { /* ignore */ }
      }).catch(() => { /* Sentry not installed */ })
    }
    if (typeof window !== 'undefined' && window.posthog?.captureException) {
      try { window.posthog.captureException(error) } catch (_) { /* swallow */ }
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        background: '#05070A',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 999,
            border: '1px solid rgba(248,113,113,0.35)',
            background: 'rgba(239,68,68,0.08)',
            color: '#fca5a5',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            Critical error
          </div>
          <h1 style={{
            margin: '20px 0 12px',
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 1.1,
            background: 'linear-gradient(180deg, #ffffff 0%, #F0D77A 60%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Something broke deep down.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            ScholarshipFit had a hiccup. Try refreshing — if it keeps happening,
            we&apos;ll want to hear from you.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#D4AF37',
                color: 'black',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 999,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '10px 22px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
