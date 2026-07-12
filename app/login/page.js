'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth, buildSignInUrl } from '@/hooks/use-auth'
import { track } from '@/lib/analytics'
import TurnstileWidget from '@/components/site/TurnstileWidget'

/* Reusable email + password auth form.
   Handles both /login and /signup depending on `mode` prop. */
export function AuthForm({ mode = 'login' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('return') || '/dashboard'
  const { refresh } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')
  const [turnstileToken, setTurnstileToken] = useState(null)  // null until Turnstile solved (signup only)

  const isSignup = mode === 'signup'

  const submit = async (e) => {
    e?.preventDefault()
    setErr('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Please enter a valid email')
    if (password.length < 8) return setErr('Password must be at least 8 characters')
    if (isSignup && !turnstileToken) return setErr('Please complete the security check to continue')
    setBusy(true)
    try {
      const url = mode === 'signup' ? '/api/auth/register' : '/api/auth/login'
      const r = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(mode === 'signup' ? { name, turnstile_token: turnstileToken } : {}),
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        // Login attempt for an unverified account → send them to /verify-email
        if (data?.needs_verification && data?.email) {
          try { track.trackEvent && track.trackEvent('login_blocked_unverified', { email_domain: data.email.split('@')[1] }) } catch { /* ignore */ }
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}&next=${encodeURIComponent(returnTo)}`)
          return
        }
        setErr(data.error || 'Something went wrong'); return
      }
      // Signup path — if backend says needs_verification, redirect to /verify-email
      if (isSignup && data?.needs_verification && data?.email) {
        try { track.signup({ method: 'email', requires_verification: true }) } catch { /* ignore */ }
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}&next=${encodeURIComponent(returnTo)}`)
        return
      }
      try {
        if (isSignup) track.signup({ method: 'email' })
        else track.login({ method: 'email' })
      } catch { /* ignore */ }
      await refresh()
      router.push(returnTo)
    } catch (err) {
      setErr('Network error — please try again')
    } finally { setBusy(false) }
  }

  const googleSignIn = () => {
    if (typeof window !== 'undefined') window.location.href = buildSignInUrl(returnTo)
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-md px-4 py-16 md:py-24">
        <Card className="border-[#D4AF37]/25 bg-black/60 backdrop-blur">
          <CardContent className="p-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              <Lock className="h-6 w-6 text-[#D4AF37]"/>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white text-center">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-center text-sm text-white/60">
              {isSignup ? 'Save your cabinet across devices.' : 'Sign in to access your ScholarshipFit cabinet.'}
            </p>

            {/* Google button */}
            <Button
              onClick={googleSignIn}
              type="button"
              className="mt-6 w-full h-11 rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow"
            >
              <GoogleG className="mr-2 h-5 w-5"/> Continue with Google
            </Button>

            <div className="mt-5 mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-white/40">
              <div className="flex-1 h-px bg-white/10"/> OR EMAIL <div className="flex-1 h-px bg-white/10"/>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {isSignup && (
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">Name</label>
                  <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ashley Wong"
                    className="mt-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"/>
                </div>
              )}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-white/50">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"/>
                  <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
                    placeholder="you@email.com" autoComplete="email"
                    className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"/>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-widest text-white/50">Password</label>
                  {!isSignup && (
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-[#D4AF37] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"/>
                  <Input type={showPw ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)}
                    placeholder={isSignup ? 'at least 8 characters' : '••••••••'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className="pl-9 pr-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"/>
                  <button type="button" onClick={()=>setShowPw(v=>!v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                    {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>

              {err && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/><span>{err}</span>
                </div>
              )}

              {isSignup && (
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-2.5">
                  <TurnstileWidget action="signup" onVerify={setTurnstileToken}/>
                </div>
              )}

              <Button type="submit" disabled={busy || (isSignup && !turnstileToken)}
                className="w-full h-11 btn-gold btn-pill font-semibold disabled:opacity-60">
                {busy ? 'Please wait…' : (isSignup ? 'Create account' : 'Sign in')}
                {!busy && <ArrowRight className="ml-2 h-4 w-4"/>}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-white/60">
              {isSignup ? (
                <>Already have an account? <Link href={`/login${returnTo!=='/dashboard'?'?return='+encodeURIComponent(returnTo):''}`} className="text-[#D4AF37] hover:underline">Sign in</Link></>
              ) : (
                <>New here? <Link href={`/signup${returnTo!=='/dashboard'?'?return='+encodeURIComponent(returnTo):''}`} className="text-[#D4AF37] hover:underline">Create an account</Link></>
              )}
            </p>
            <p className="mt-3 text-center text-[11px] text-white/40">
              By continuing you agree to our <Link href="/terms" className="underline hover:text-white/60">Terms</Link> and <Link href="/privacy" className="underline hover:text-white/60">Privacy</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div className="dark-bg min-h-screen"/>}><AuthForm mode="login"/></Suspense>
}

function GoogleG({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
