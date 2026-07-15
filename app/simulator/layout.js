'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function SimulatorLayout({ children }) {
  return <RequireAuth paid>{children}</RequireAuth>
}
