'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'

/**
 * TurnstileWidget — Cloudflare Turnstile challenge widget.
 *
 * Loads the CF script once, renders a widget, and calls onVerify(token) with
 * the resulting token (or null on expiry/error). Parent forms should keep the
 * submit button disabled until they have a non-null token.
 *
 * Props:
 *   - onVerify: (token: string | null) => void      // required
 *   - action:   string                                // optional, tags the challenge for analytics
 *   - theme:    'dark' | 'light' | 'auto'            // default: 'dark' (matches our site)
 *   - size:     'normal' | 'compact' | 'flexible'   // default: 'flexible'
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set (older dev), the widget
 * silently no-ops and reports back a mock 'skipped' token so the form flow
 * isn't broken — the backend then simply logs the skip.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise = null
function loadTurnstileScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.defer = true
    s.onload = () => resolve(window.turnstile)
    s.onerror = () => reject(new Error('Failed to load Turnstile script'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export default function TurnstileWidget({ onVerify, action, theme = 'dark', size = 'flexible' }) {
  const containerRef = useRef(null)
  const widgetIdRef  = useRef(null)
  const [state, setState] = useState('loading') // loading | ready | verified | error

  const emit = useCallback((token) => {
    try { onVerify?.(token) } catch { /* ignore */ }
  }, [onVerify])

  useEffect(() => {
    // No site key configured — silently emit a skip token and get out of the way.
    if (!SITE_KEY) {
      setState('verified')
      emit('__turnstile_skipped__')
      return
    }
    let cancelled = false

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          size,
          action: action || undefined,
          callback: (token) => {
            setState('verified')
            emit(token || null)
          },
          'expired-callback': () => {
            setState('ready')
            emit(null)
          },
          'error-callback': () => {
            setState('error')
            emit(null)
          },
        })
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
      try {
        if (window.turnstile && widgetIdRef.current != null) {
          window.turnstile.remove(widgetIdRef.current)
        }
      } catch { /* ignore */ }
    }
  }, [action, emit, size, theme])

  // If no site key configured, render an invisible pass-through hint.
  if (!SITE_KEY) {
    return (
      <div className="text-[10px] text-white/25 italic">
        (Turnstile not configured — dev-only bypass active)
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div ref={containerRef} className="cf-turnstile min-h-[65px]" />
      {state === 'loading' && (
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
          <Loader2 className="h-3 w-3 animate-spin"/> Loading security check…
        </div>
      )}
      {state === 'ready' && (
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
          <ShieldCheck className="h-3 w-3"/> Solve the check to enable submission
        </div>
      )}
      {state === 'error' && (
        <div className="text-[11px] text-red-300">Security check failed to load. Refresh the page.</div>
      )}
    </div>
  )
}
