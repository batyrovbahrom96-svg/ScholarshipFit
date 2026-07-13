'use client'
import RequireAuth from '@/components/site/RequireAuth'
export default function EssayGeneratorLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>
}
