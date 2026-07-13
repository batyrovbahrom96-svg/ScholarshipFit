'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function OnboardingLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>
}
