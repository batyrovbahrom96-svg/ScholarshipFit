'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Loader2, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import TurnstileWidget from '@/components/site/TurnstileWidget'

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')
  const [sent, setSent]   = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const clean = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setErr('Please enter a valid email address'); return
    }
    if (!turnstileToken) {
      setErr('Please complete the security check to continue'); return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, turnstile_token: turnstileToken }),
      })
      const data = await r.json()
      if (!r.ok) { setErr(data.error || 'Something went wrong'); return }
      setSent(true)
      try { trackEvent('password_reset_requested_ui', { email_domain: clean.split('@')[1] }) } catch { /* ignore */ }
    } catch (_e) {
      setErr('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-md px-4 py-16 md:py-20">
        <Card className="border-[#D4AF37]/25 bg-black/60 backdrop-blur">
          <CardContent className="p-8">
            {/* Header */}
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              {sent ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-400"/>
              ) : (
                <KeyRound className="h-6 w-6 text-[#D4AF37]"/>
              )}
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white text-center">
              {sent ? 'Check your inbox' : 'Reset your password'}
            </h1>
            <p className="mt-2 text-center text-sm text-white/60">
              {sent ? (
                <>If an account exists for<br/><span className="text-white/90 font-medium">{email}</span><br/>we&apos;ve sent a secure reset link. It expires in 60 minutes.</>
              ) : (
                <>Enter your email and we&apos;ll send you a secure link to choose a new password.</>
              )}
            </p>

            {!sent ? (
              <form onSubmit={submit} className="mt-6 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"/>
                  <Input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@school.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={busy}
                    className="pl-9 h-11 bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus:border-[#D4AF37]"
                  />
                </div>

                {err && (
                  <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0"/> {err}
                  </div>
                )}

                <div className="rounded-md border border-white/10 bg-white/[0.02] p-2.5">
                  <TurnstileWidget action="forgot_password" onVerify={setTurnstileToken}/>
                </div>

                <Button
                  type="submit"
                  disabled={busy || !turnstileToken}
                  className="h-11 w-full btn-gold btn-pill font-semibold disabled:opacity-50"
                >
                  {busy ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Sending…</>
                  ) : (
                    <>Send reset link <ArrowRight className="ml-2 h-4 w-4"/></>
                  )}
                </Button>
              </form>
            ) : (
              <div className="mt-6 text-center">
                <p className="text-xs text-white/40">
                  Tip: check your spam folder. If it doesn&apos;t arrive within 5 minutes, try again.
                </p>
                <Button
                  onClick={() => { setSent(false); setEmail('') }}
                  variant="outline"
                  className="mt-4 btn-pill"
                >
                  Send to a different email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white/50">
          Remembered it?{' '}
          <Link href="/login" className="text-[#D4AF37] hover:underline">Sign in</Link>
          {' · '}
          <Link href="/signup" className="text-[#D4AF37] hover:underline">Create account</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
