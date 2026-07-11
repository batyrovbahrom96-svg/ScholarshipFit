'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, ArrowRight, ShieldCheck, RotateCcw, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { trackEvent } from '@/lib/analytics'

/*
  /verify-email — 6-digit OTP entry screen.

  Query params:
    ?email=xxx@yyy   the account we're verifying (required)
    ?next=/dashboard  where to send them after success (default /dashboard)

  UX:
    - 6 individual boxes; auto-advance on digit; backspace to previous;
      paste-anywhere pastes across all boxes.
    - "Resend code" button with 60-second cooldown.
    - Shows attempts remaining after a wrong code (max 5).
    - Success: brief green flash + push to `next`.
*/
export default function VerifyEmailClient() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()

  const email  = (params.get('email') || '').trim()
  const next   = params.get('next') || '/dashboard'

  const [digits, setDigits]     = useState(['', '', '', '', '', ''])
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')
  const [done, setDone]         = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputs = useRef([])

  // Track page arrival
  useEffect(() => {
    if (email) trackEvent('verify_email_page_view', { email_domain: email.split('@')[1] })
  }, [email])

  // Auto-focus first empty box on mount
  useEffect(() => {
    if (inputs.current[0]) inputs.current[0].focus()
  }, [])

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const code = digits.join('')

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '').slice(0, 1)
    setDigits(prev => {
      const next = [...prev]
      next[i] = clean
      return next
    })
    if (clean && i < 5) {
      // Move to next
      setTimeout(() => inputs.current[i + 1]?.focus(), 0)
    }
    // Auto-submit when the last box is filled
    if (clean && i === 5) {
      const full = [...digits.slice(0, 5), clean].join('')
      if (full.length === 6) verify(full)
    }
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
      setDigits(prev => {
        const next = [...prev]
        next[i - 1] = ''
        return next
      })
    } else if (e.key === 'Enter' && code.length === 6) {
      e.preventDefault()
      verify(code)
    }
  }

  const onPaste = (e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const arr = pasted.padEnd(6, '').split('').slice(0, 6)
    while (arr.length < 6) arr.push('')
    setDigits(arr)
    if (pasted.length === 6) {
      setTimeout(() => verify(pasted), 30)
    } else {
      inputs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const verify = async (theCode) => {
    setErr('')
    setBusy(true)
    try {
      const r = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: theCode }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErr(data.error || 'Invalid code')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputs.current[0]?.focus(), 30)
        trackEvent('verify_email_failed', { reason: data.error, email_domain: email.split('@')[1] })
        return
      }
      trackEvent('verify_email_success', { email_domain: email.split('@')[1] })
      setDone(true)
      await refresh()
      setTimeout(() => router.push(next), 900)
    } catch (e) {
      setErr('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0 || busy) return
    setErr('')
    try {
      const r = await fetch('/api/auth/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await r.json()
      if (r.status === 429) {
        setCooldown(data.retry_in_seconds || 60)
        setErr(data.error || 'Please wait before requesting a new code.')
        return
      }
      if (!r.ok) {
        setErr(data.error || 'Could not resend code')
        return
      }
      setCooldown(60)
      trackEvent('verify_email_resend', { email_domain: email.split('@')[1] })
    } catch (e) {
      setErr('Network error — please try again')
    }
  }

  // No email in URL → send user home
  if (!email) {
    return (
      <div className="dark-bg min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-md px-4 py-24 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400"/>
          <h1 className="mt-4 text-2xl font-semibold text-white">Missing email address</h1>
          <p className="mt-2 text-white/60">Please sign up or sign in again to receive a fresh code.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/signup"><Button className="btn-gold btn-pill">Sign up</Button></Link>
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
            {/* Header */}
            <div className="mx-auto h-14 w-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              {done ? (
                <ShieldCheck className="h-7 w-7 text-emerald-400"/>
              ) : (
                <Mail className="h-6 w-6 text-[#D4AF37]"/>
              )}
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white text-center">
              {done ? 'Email verified!' : 'Check your inbox'}
            </h1>
            <p className="mt-2 text-center text-sm text-white/60">
              {done ? (
                <>Redirecting you to your Command Center…</>
              ) : (
                <>We sent a 6-digit code to<br/>
                  <span className="text-white/90 font-medium">{email}</span>
                </>
              )}
            </p>

            {!done && (
              <>
                {/* Code boxes */}
                <div
                  onPaste={onPaste}
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => inputs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={d}
                      disabled={busy}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      className="h-14 w-11 md:h-16 md:w-12 rounded-lg bg-white/[0.04] border border-white/15 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 outline-none text-center text-2xl font-semibold text-white transition-colors"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Error */}
                {err && (
                  <div className="mt-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0"/> {err}
                  </div>
                )}

                {/* Submit */}
                <Button
                  disabled={busy || code.length !== 6}
                  onClick={() => verify(code)}
                  className="mt-5 h-11 w-full btn-gold btn-pill font-semibold disabled:opacity-50"
                >
                  {busy ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Verifying…</>
                  ) : (
                    <>Verify email <ArrowRight className="ml-2 h-4 w-4"/></>
                  )}
                </Button>

                {/* Resend */}
                <div className="mt-4 text-center text-sm text-white/50">
                  Didn't get it?{' '}
                  {cooldown > 0 ? (
                    <span className="text-white/40">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={resend}
                      className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline"
                    >
                      <RotateCcw className="h-3.5 w-3.5"/> Resend code
                    </button>
                  )}
                </div>

                <p className="mt-6 text-center text-xs text-white/40">
                  Tip: check your spam folder. Codes expire in 10 minutes.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white/50">
          Wrong email?{' '}
          <Link href="/signup" className="text-[#D4AF37] hover:underline">Start over</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
