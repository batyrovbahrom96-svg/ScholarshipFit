'use client'
// Reusable auth-guard. Wraps a page/section and forces a redirect to
// /login?return=<current> for guests. Shows a subtle "checking auth" state
// while the /api/auth/me round-trip is in flight (~150ms typical).
//
// Usage:
//   'use client'
//   import RequireAuth from '@/components/site/RequireAuth'
//   export default function Page() {
//     return <RequireAuth><YourPageContent/></RequireAuth>
//   }
//
// If you also need paid-only content, pass `paid` — this checks
// user.subscription.status ∈ {active, trialing, lifetime}. Otherwise the user
// is redirected to /pricing?return=<current>.

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function RequireAuth({ children, paid = false, fallback = null }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (loading) return
    if (!user) {
      const ret = encodeURIComponent(pathname)
      router.replace(`/login?return=${ret}`)
      return
    }
    if (paid) {
      const s = user?.subscription?.status
      const isPaid = s === 'active' || s === 'trialing' || s === 'lifetime' || user?.plan === 'lifetime'
      if (!isPaid) {
        router.replace(`/pricing?return=${encodeURIComponent(pathname)}&reason=upgrade_required`)
      }
    }
  }, [loading, user, paid, router, pathname])

  if (loading || !user) {
    return fallback || (
      <div className="dark-bg min-h-screen flex items-center justify-center text-white/40 text-sm">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="uppercase tracking-widest text-xs">Checking session…</span>
        </div>
      </div>
    )
  }

  if (paid) {
    const s = user?.subscription?.status
    const isPaid = s === 'active' || s === 'trialing' || s === 'lifetime' || user?.plan === 'lifetime'
    if (!isPaid) {
      return fallback || (
        <div className="dark-bg min-h-screen flex items-center justify-center text-white/40 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="uppercase tracking-widest text-xs">Redirecting to upgrade…</span>
          </div>
        </div>
      )
    }
  }

  return children
}
