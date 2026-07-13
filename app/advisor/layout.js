'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function AdvisorLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>
}
