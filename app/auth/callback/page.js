'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useAuth()
  const [state, setState] = useState({ status: 'checking', error: '' })

  useEffect(() => {
    // Emergent Google Auth returns via URL fragment OR search params, depending
    // on the deployment. We check both.
    let sessionId = searchParams.get('session_id')
    if (!sessionId && typeof window !== 'undefined' && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      sessionId = params.get('session_id')
    }
    const returnTo = searchParams.get('return') || '/'

    if (!sessionId) {
      setState({ status: 'error', error: 'Missing session id from provider' })
      return
    }
    ;(async () => {
      try {
        const r = await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
          body: JSON.stringify({ session_id: sessionId }),
        })
        const data = await r.json()
        if (!r.ok) { setState({ status: 'error', error: data.error || 'Sign-in failed' }); return }
        setState({ status: 'success', error: '' })
        await refresh()
        setTimeout(() => router.replace(returnTo), 600)
      } catch (e) {
        setState({ status: 'error', error: 'Network error' })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="dark-bg min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-[#D4AF37]/25 bg-black/60 backdrop-blur p-10">
        {state.status === 'checking' && (<>
          <Loader2 className="mx-auto h-10 w-10 text-[#D4AF37] animate-spin"/>
          <h1 className="mt-4 text-2xl font-semibold text-white">Signing you in…</h1>
          <p className="mt-1 text-white/60 text-sm">Setting up your personal cabinet.</p>
        </>)}
        {state.status === 'success' && (<>
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#D4AF37]"/>
          <h1 className="mt-4 text-2xl font-semibold text-white">Welcome!</h1>
          <p className="mt-1 text-white/60 text-sm">Redirecting…</p>
        </>)}
        {state.status === 'error' && (<>
          <XCircle className="mx-auto h-10 w-10 text-red-400"/>
          <h1 className="mt-4 text-2xl font-semibold text-white">Sign-in failed</h1>
          <p className="mt-1 text-red-300 text-sm">{state.error}</p>
          <button onClick={() => router.replace('/')} className="mt-6 h-10 px-4 rounded-full bg-white/10 text-white hover:bg-white/15">Back to home</button>
        </>)}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return <Suspense fallback={<div className="dark-bg min-h-screen"/>}><CallbackInner/></Suspense>
}
