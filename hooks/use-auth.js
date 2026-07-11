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
