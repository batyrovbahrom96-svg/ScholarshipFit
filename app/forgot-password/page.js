import { Suspense } from 'react'
import ForgotPasswordClient from './forgot-password-client'

export const metadata = {
  title: 'Reset your password — ScholarshipFit',
  description: "Forgot your password? We'll email you a secure link to choose a new one.",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="dark-bg min-h-screen"/>}>
      <ForgotPasswordClient />
    </Suspense>
  )
}
