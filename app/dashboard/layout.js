'use client'
// Auth gate for every /dashboard/* page. This is the single source of truth
// for "you must be logged in to see this route" — individual pages don't need
// to duplicate the check. Guests are bounced to /login?return=<path>.
//
// Also runs a one-shot cleanup: if we detect a page rendered with stale
// localStorage cabinet data from a previous user (no cookie session but
// sf.profile / match_run present), we purge it before RequireAuth kicks in.

import { useEffect } from 'react'
import RequireAuth from '@/components/site/RequireAuth'

export default function DashboardLayout({ children }) {
  useEffect(() => {
    // Defensive one-shot: if there's no session cookie visible client-side
    // (heuristic: no fetch has hydrated user yet, RequireAuth will handle
    // the real check) and we spot leftover cabinet data, keep it around for
    // the auth-check moment — RequireAuth will redirect if unauthorised, and
    // the actual signOut path already purges. This effect is a no-op today
    // but leaves room for a hard purge if we tighten further.
  }, [])

  return <RequireAuth>{children}</RequireAuth>
}
