'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ServerCrash, MonitorSmartphone, Home } from 'lucide-react'

/*
  ================================================================
  /sentry-example-page \u2014 verification page for Sentry setup.
  ----------------------------------------------------------------
  Two buttons:
    1. Throw a client-side error   \u2192 confirms sentry.client.config.js
    2. Throw a server-side error   \u2192 hits /api/sentry-example-api which
                                     throws \u2192 confirms sentry.server.config.js
  Delete this page after you&apos;ve confirmed both work in your Sentry inbox.
  ================================================================
*/

export default function SentryExamplePage() {
  const [serverStatus, setServerStatus] = useState(null)

  const triggerServerError = async () => {
    setServerStatus('firing\u2026')
    try {
      const r = await fetch('/api/sentry-example-api')
      const j = await r.json().catch(() => ({}))
      setServerStatus(`server responded ${r.status} \u2014 check Sentry for the traceback`)
    } catch (e) {
      setServerStatus(`fetch failed: ${e.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#05070A] text-white grid place-items-center px-4">
      <div className="max-w-xl w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#E7C766] mb-6">
          <AlertTriangle className="h-3 w-3"/> Sentry verification page
        </div>

        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
          Sentry is <span className="bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">watching.</span>
        </h1>

        <p className="mt-4 text-white/60 leading-relaxed">
          Click a button below to intentionally throw an error. Then check your Sentry
          Issues inbox at <a href="https://sentry.io" className="text-[#F0D77A] underline decoration-white/20 hover:decoration-white">sentry.io</a>{' '}
          \u2014 the error should appear within ~30 seconds.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {/* Client error */}
          <button
            onClick={() => {
              // This deliberately throws \u2014 the error boundary + Sentry will catch it.
              throw new Error('Sentry client-side test error \u2014 you can safely resolve this.')
            }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left hover:border-[#D4AF37]/40 transition"
          >
            <MonitorSmartphone className="h-5 w-5 text-[#D4AF37]"/>
            <div className="mt-2 font-semibold text-white">Throw client error</div>
            <div className="mt-1 text-[13px] text-white/55 leading-relaxed">
              Verifies your browser SDK. You&apos;ll see the branded /error page \u2014 that means capture worked.
            </div>
          </button>

          {/* Server error */}
          <button
            onClick={triggerServerError}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left hover:border-[#D4AF37]/40 transition"
          >
            <ServerCrash className="h-5 w-5 text-[#D4AF37]"/>
            <div className="mt-2 font-semibold text-white">Throw server error</div>
            <div className="mt-1 text-[13px] text-white/55 leading-relaxed">
              Hits <code className="text-[11px] text-white/80 bg-black/40 px-1 py-0.5 rounded">/api/sentry-example-api</code>{' '}
              which throws. Verifies the Node SDK.
            </div>
            {serverStatus && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3 w-3"/> {serverStatus}
              </div>
            )}
          </button>
        </div>

        <div className="mt-8 text-xs text-white/40 leading-relaxed">
          <p><strong className="text-white/60">Cleanup:</strong> once you&apos;ve confirmed both errors show up in your Sentry Issues inbox, you can delete <code className="text-[11px] bg-black/40 px-1 py-0.5 rounded">/app/app/sentry-example-page</code> and <code className="text-[11px] bg-black/40 px-1 py-0.5 rounded">/app/app/api/sentry-example-api</code>.</p>
        </div>

        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <Home className="h-4 w-4"/> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
