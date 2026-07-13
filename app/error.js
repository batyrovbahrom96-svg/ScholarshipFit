'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, GraduationCap } from 'lucide-react'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error so it's visible in browser devtools + shows up in PostHog if wired
    console.error('[ScholarshipFit] client error boundary caught:', error)
    // Sentry capture — automatic if sentry.client.config.js is loaded
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs').then(Sentry => {
        try { Sentry.captureException(error) } catch (_) { /* ignore */ }
      }).catch(() => { /* Sentry not installed */ })
    }
    // PostHog exception capture — safe even if PH is not loaded yet
    if (typeof window !== 'undefined' && window.posthog?.captureException) {
      try { window.posthog.captureException(error) } catch (_) { /* swallow */ }
    }
  }, [error])

  return (
    <div className="relative min-h-screen bg-[#05070A] text-white overflow-hidden">
      {/* Ambient red-gold glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full bg-red-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[#D4AF37]/12 blur-[120px]" />

      <div className="relative container mx-auto max-w-3xl px-4 py-20 md:py-28">
        {/* Top brand row */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-amber-700">
            <GraduationCap className="h-4 w-4 text-black"/>
          </div>
          <span className="text-white/80 group-hover:text-white transition">ScholarshipFit</span>
        </Link>

        <div className="mt-14 md:mt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/[0.08] px-3 py-1 text-[11px] uppercase tracking-widest text-red-300">
            <AlertTriangle className="h-3.5 w-3.5"/> Unexpected error
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Something broke on{' '}
            <span className="bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">our end.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
            Not your fault — we&apos;ve been notified automatically. Give it another try, or head
            back to safety. If this keeps happening, ping us and we&apos;ll fix it fast.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#E7C766] transition"
            >
              <RefreshCw className="h-4 w-4"/> Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white hover:border-[#D4AF37]/60 hover:text-[#F0D77A] transition"
            >
              <Home className="h-4 w-4"/> Back to home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/25 transition"
            >
              Report this issue
            </Link>
          </div>

          {/* Debug details — only in dev */}
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <details className="mt-10 rounded-xl border border-red-400/20 bg-red-500/[0.03] p-4 text-xs text-red-200/70">
              <summary className="cursor-pointer text-red-300 font-medium">Developer details</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words">{error.message}
{error.digest ? `Digest: ${error.digest}` : ''}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
