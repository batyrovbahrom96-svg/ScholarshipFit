'use client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/use-auth'
import PostHogProvider from '@/components/site/PostHogProvider'
import ReferralCapture from '@/components/site/ReferralCapture'

export function Providers({ children }) {
  return (
    <PostHogProvider>
      <AuthProvider>
        <ReferralCapture />
        {children}
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </AuthProvider>
    </PostHogProvider>
  )
}
