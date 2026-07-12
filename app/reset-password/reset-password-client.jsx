'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { trackEvent } from '@/lib/analytics'

export default function ResetPasswordClient() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()

  const token = params.get('token') || ''
  const email = (params.get('email') || '').trim()

  const [pw1, setPw1]     = useState('')
  const [pw2, setPw2]     = useState('')
  const [show, setShow]   = useState(false)
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')
  const [done, setDone]   = useState(false)

  // Track arrival
  useEffect(() => {
    if (token && email) trackEvent('password_reset_page_view', { email_domain: email.split('@')[1] })
  }, [token, email])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (pw1.length < 8) { setErr('Password must be at least 8 characters'); return }
    if (pw1 !== pw2)    { setErr('Passwords do not match'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, new_password: pw1 }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErr(data.error || 'Could not reset password')
        try { trackEvent('password_reset_failed', { reason: data.error }) } catch { /* ignore */ }
        return
      }
      setDone(true)
      try { trackEvent('password_reset_success', {}) } catch { /* ignore */ }
      await refresh()
      setTimeout(() => router.push('/dashboard'), 900)
    } catch (_e) {
      setErr('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  // Missing token or email → show error
  if (!token || !email) {
    return (
      <div className="dark-bg min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-md px-4 py-24 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400"/>
          <h1 className="mt-4 text-2xl font-semibold text-white">Invalid reset link</h1>
          <p className="mt-2 text-white/60">This link is missing information. Please request a new one.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/forgot-password"><Button className="btn-gold btn-pill">Request new link</Button></Link>
            <Link href="/login"><Button variant="outline" className="btn-pill">Sign in</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-md px-4 py-16 md:py-20">
        <Card className="border-[#D4AF37]/25 bg-black/60 backdrop-blur">
          <CardContent className="p-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              {done ? <CheckCircle2 className="h-7 w-7 text-emerald-400"/> : <KeyRound className="h-6 w-6 text-[#D4AF37]"/>}
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white text-center">
              {done ? 'Password updated' : 'Choose a new password'}
            </h1>
            <p className="mt-2 text-center text-sm text-white/60">
              {done ? (
                <>You're signed in — redirecting to your Command Center…</>
              ) : (
                <>For <span className="text-white/90 font-medium">{email}</span></>
              )}
            </p>

            {!done && (
              <form onSubmit={submit} className="mt-6 space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"/>
                  <Input
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="New password (min 8 characters)"
                    value={pw1}
                    onChange={e => setPw1(e.target.value)}
                    disabled={busy}
                    className="pl-9 pr-10 h-11 bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"/>
                  <Input
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    disabled={busy}
                    className="pl-9 h-11 bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus:border-[#D4AF37]"
                  />
                </div>

                {err && (
                  <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0"/> {err}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={busy || !pw1 || !pw2}
                  className="h-11 w-full btn-gold btn-pill font-semibold disabled:opacity-50"
                >
                  {busy ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Updating…</>
                  ) : (
                    <>Update password <ArrowRight className="ml-2 h-4 w-4"/></>
                  )}
                </Button>

                <p className="text-center text-xs text-white/40">
                  For your security, this link can only be used once.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white/50">
          <Link href="/login" className="text-[#D4AF37] hover:underline">Back to sign in</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
