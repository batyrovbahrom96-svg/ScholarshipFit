'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function AiAdvisorLayout({ children }) {
  return <RequireAuth paid>{children}</RequireAuth>
}
