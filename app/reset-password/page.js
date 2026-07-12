import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

export const metadata = {
  title: 'Set a new password — ScholarshipFit',
  description: 'Choose a new password for your ScholarshipFit account.',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="dark-bg min-h-screen"/>}>
      <ResetPasswordClient />
    </Suspense>
  )
}
