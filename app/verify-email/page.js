import { Suspense } from 'react'
import VerifyEmailClient from './verify-email-client'

export const metadata = {
  title: 'Verify your email — ScholarshipFit',
  description: 'Enter the 6-digit code we sent to your email to activate your ScholarshipFit account.',
  robots: { index: false, follow: false },
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="dark-bg min-h-screen"/>}>
      <VerifyEmailClient />
    </Suspense>
  )
}
