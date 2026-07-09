'use client'
import { Suspense } from 'react'
import { AuthForm } from '../login/page'

export default function SignupPage() {
  return <Suspense fallback={<div className="dark-bg min-h-screen"/>}><AuthForm mode="signup"/></Suspense>
}
