'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function RejectionDebuggerLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>
}
