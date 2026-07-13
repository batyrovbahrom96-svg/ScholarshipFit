'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { store } from '@/lib/client-store'
import { identifyUser, resetAnalytics, trackEvent } from '@/lib/analytics'

const AuthCtx = createContext({ user: null, loading: true, refresh: () => {}, signOut: () => {} })

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await r.json()
      setUser(data.user || null)

      // PostHog: identify the user for funnel/segment analytics
      if (data.user) {
        identifyUser(data.user.id, data.user.email, {
          name: data.user.name,
          plan: data.user?.subscription?.plan || 'free',
          subscription_status: data.user?.subscription?.status || 'inactive',
        })
      }

      // One-shot migration of localStorage cabinet into DB after first login
      if (data.user && typeof window !== 'undefined' && !localStorage.getItem('sf.cabinetMigratedFor_' + data.user.id)) {
        try {
          const localCabinet = {
            favorites: store.getFavorites(),
            recent_searches: store.getRecentSearches(),
            profile: store.getProfile() || {},
          }
          if (localCabinet.favorites.length || localCabinet.recent_searches.length || Object.keys(localCabinet.profile || {}).length) {
            await fetch('/api/cabinet/sync', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localCabinet),
            })
          }
          localStorage.setItem('sf.cabinetMigratedFor_' + data.user.id, '1')
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const signOut = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } catch { /* ignore */ }
    try { trackEvent('logout') } catch { /* ignore */ }
    try { resetAnalytics() } catch { /* ignore */ }
    // SECURITY: purge all cached cabinet/profile/match data so the next visitor
    // on this browser does NOT see the previous user's data on /dashboard etc.
    // Referral capture (sf_ref) is preserved so users completing signup after a
    // logout can still credit their referrer.
    if (typeof window !== 'undefined') {
      try {
        const preserve = new Set(['sf_ref', 'sf_ref_at', 'sf_boot_seen', 'sf.cookieConsent'])
        const kill = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (!k) continue
          if (k.startsWith('sf.') && !preserve.has(k)) kill.push(k)
          if (k === 'match_run' || k === 'match_result' || k === 'onboarding_profile') kill.push(k)
        }
        kill.forEach(k => localStorage.removeItem(k))
        // Also clear the boot splash so next fresh visit shows the intro
        sessionStorage.removeItem('sf_boot_seen')
      } catch { /* storage may be blocked */ }
    }
    setUser(null)
    if (typeof window !== 'undefined') window.location.href = '/'
  }, [])

  return <AuthCtx.Provider value={{ user, loading, refresh, signOut }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)

// Build the Emergent Google Auth redirect URL. Callback returns to our
// /auth/callback page which exchanges session_id → cookie via /api/auth/session.
export function buildSignInUrl(returnTo = '/') {
  if (typeof window === 'undefined') return '#'
  const cb = new URL('/auth/callback', window.location.origin)
  cb.searchParams.set('return', returnTo)
  return `https://auth.emergentagent.com/?redirect=${encodeURIComponent(cb.toString())}`
}
