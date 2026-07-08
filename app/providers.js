'use client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/use-auth'

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </AuthProvider>
  )
}
