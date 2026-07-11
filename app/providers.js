'use client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/use-auth'
import PostHogProvider from '@/components/site/PostHogProvider'

export function Providers({ children }) {
  return (
    <PostHogProvider>
      <AuthProvider>
        {children}
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </AuthProvider>
    </PostHogProvider>
  )
}
