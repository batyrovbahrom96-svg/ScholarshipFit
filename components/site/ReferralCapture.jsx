'use client'
// Captures ?ref=CODE from any inbound URL, persists it in localStorage for 30
// days, and fires a click event to /api/referrals/track-click so the referrer
// sees their share activity. Mounted globally via app/providers.js.
import { useEffect } from 'react'

export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const code = (params.get('ref') || '').toUpperCase().slice(0, 20)
      if (!code) return

      const now = Date.now()
      const existing = localStorage.getItem('sf_ref')
      const existingAt = Number(localStorage.getItem('sf_ref_at') || 0)
      const stale = !existingAt || (now - existingAt > 30 * 24 * 3600 * 1000)

      if (!existing || stale) {
        localStorage.setItem('sf_ref', code)
        localStorage.setItem('sf_ref_at', String(now))
        // Fire click track — best-effort, ignore failures
        fetch('/api/referrals/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }).catch(() => {})
      }
    } catch { /* ignore */ }
  }, [])
  return null
}
