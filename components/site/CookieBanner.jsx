'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

/*
  Notice-only cookie banner.
  We currently only use strictly-necessary cookies (auth session), so a
  blocking consent modal isn't required. The banner disclosure keeps us
  transparent and compliant. If/when we add analytics or marketing
  cookies, this component should be upgraded to a granular consent UI
  with category toggles that block non-essential scripts until Accept.
*/
const STORAGE_KEY = 'sf_cookie_notice_v1'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (!v) setVisible(true)
    } catch (_) {
      // localStorage disabled (private browsing) — show banner anyway.
      setVisible(true)
    }
  }, [])

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed_at: new Date().toISOString(), version: 1 }))
    } catch (_) {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[60] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md"
    >
      <div className="rounded-2xl border border-[#D4AF37]/25 bg-black/90 backdrop-blur-md shadow-2xl shadow-black/60 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
            <Cookie className="h-4 w-4 text-[#D4AF37]"/>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Cookies & product analytics</p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              We use a session cookie so you stay signed in, plus privacy-friendly product analytics (PostHog) to understand how the product is used and improve it. No ad trackers, no data sold. See our{' '}
              <Link href="/privacy" className="text-[#D4AF37] hover:underline">Privacy Policy</Link>.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={acknowledge}
                className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-4 py-1.5 text-xs font-semibold text-black hover:bg-[#F5D67B] transition"
              >
                Got it
              </button>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-transparent px-4 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5 transition"
              >
                Learn more
              </Link>
            </div>
          </div>
          <button
            onClick={acknowledge}
            aria-label="Dismiss cookie notice"
            className="shrink-0 text-white/40 hover:text-white transition"
          >
            <X className="h-4 w-4"/>
          </button>
        </div>
      </div>
    </div>
  )
}
