'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function DashboardLayout({ children }) {
  // Cabinet is paid-only. Signed-out → /login; signed-in without active
  // subscription → /pricing. Applies to /dashboard, /dashboard/tracker,
  // /dashboard/deadlines, /dashboard/billing, /dashboard/referrals.
  return <RequireAuth paid>{children}</RequireAuth>
}
