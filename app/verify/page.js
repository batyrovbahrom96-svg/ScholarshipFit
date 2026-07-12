'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, ArrowRight, Search,
  Sparkles, Lock, ExternalLink, Info, AlertTriangle,
} from 'lucide-react'

/* ============================================================================
   /verify — Scholarship Verifier public tool.
   Paste any URL → traffic-light score with reasons.
   Free forever, no signup. This is a lead-magnet + SEO surface (search terms
   like "is X scholarship a scam" land here) + trust-building differentiator.
   ============================================================================ */

const EXAMPLES = [
  { label: 'A real .edu program',       url: 'https://scholarships.harvard.edu' },
  { label: 'Scam pattern (brand + .tk)',url: 'http://harvard-scholarship.tk/apply-now' },
  { label: 'Payment-fee pattern',       url: 'http://fulbright-grants.info/pay-now' },
]

const LEVEL = {
  green:  { color: 'emerald', icon: ShieldCheck, label: 'Looks legitimate',   bg: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' },
  yellow: { color: 'amber',   icon: ShieldAlert, label: 'Proceed with caution', bg: 'bg-amber-500/10 border-amber-400/30 text-amber-100' },
  red:    { color: 'red',     icon: ShieldX,     label: 'Likely unsafe',      bg: 'bg-red-500/10 border-red-400/30 text-red-100' },
}

export default function VerifyPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const check = async (target) => {
    const val = (target ?? url).trim()
    if (!val) return
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: val }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.message || d?.error || 'Verification failed')
      setResult(d)
      setUrl(val)
    } catch (e) {
      setError(e.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  const meta = result ? LEVEL[result.level] || LEVEL.yellow : null
  const Icon = meta?.icon

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-0 -z-0"/>
        <div className="container mx-auto max-w-3xl px-4 pt-16 pb-16 md:pt-20 md:pb-20">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <ShieldCheck className="h-3.5 w-3.5"/> Scholarship Scam Verifier
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
              Is that scholarship <span className="text-gold-hi">legit</span>?
            </h1>
            <p className="mt-3 mx-auto max-w-xl text-white/70">
              Paste any scholarship URL and we&apos;ll instantly flag scam signals — impersonation domains, payment-fee patterns, insecure connections, and more. Free forever. No signup.
            </p>
          </div>

          {/* Form */}
          <Card className="mt-8 border-white/10 bg-white/[0.03]">
            <CardContent className="p-5 md:p-6">
              <form onSubmit={(e) => { e.preventDefault(); check() }}>
                <label className="text-[11px] uppercase tracking-widest text-white/50">Scholarship URL</label>
                <div className="mt-1 flex flex-col md:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"/>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/scholarship-program"
                      className="pl-10 h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37]"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !url.trim()} className="h-12 px-6 btn-gold btn-pill font-semibold">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Checking…</> : <>Verify URL <ArrowRight className="ml-2 h-4 w-4"/></>}
                  </Button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-[11px] uppercase tracking-widest text-white/40">Try:</span>
                {EXAMPLES.map(ex => (
                  <button
                    key={ex.url}
                    onClick={() => check(ex.url)}
                    className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-[#D4AF37]/40"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {result && meta && (
            <Card className={`mt-6 border ${meta.bg}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 h-12 w-12 rounded-full border flex items-center justify-center ${meta.bg}`}>
                    <Icon className="h-6 w-6"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-widest opacity-70">{result.host}</div>
                    <h2 className="mt-1 text-2xl font-semibold">{meta.label}</h2>
                    <p className="mt-1 text-sm opacity-80 break-all">{result.normalized}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2 text-sm">
                  {(result.reasons || []).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {result.level === 'red' ? <ShieldX className="mt-0.5 h-4 w-4 shrink-0"/> :
                       result.level === 'yellow' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/> :
                       <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/>}
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-2">
                  <a href={result.normalized} target="_blank" rel="noopener noreferrer nofollow">
                    <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                      Open URL <ExternalLink className="ml-2 h-3.5 w-3.5"/>
                    </Button>
                  </a>
                  <Link href="/database">
                    <Button className="btn-gold btn-pill font-semibold">
                      See our verified DB (800+ scholarships) <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explainer */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/50">
              <Info className="h-3.5 w-3.5"/> What we check
            </div>
            <ul className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-white/75">
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0"/>HTTPS &amp; secure connection</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0"/>Institutional domain (.edu / .ac / .gov)</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0"/>Match against 800+ verified providers</li>
              <li className="flex items-start gap-2"><ShieldX className="mt-0.5 h-4 w-4 text-red-400 shrink-0"/>Payment / application-fee keywords</li>
              <li className="flex items-start gap-2"><ShieldX className="mt-0.5 h-4 w-4 text-red-400 shrink-0"/>Free / low-reputation TLDs (.tk .ml .ga …)</li>
              <li className="flex items-start gap-2"><ShieldX className="mt-0.5 h-4 w-4 text-red-400 shrink-0"/>Institution-name impersonation domains</li>
            </ul>
            <p className="mt-4 text-xs text-white/40">
              This tool is heuristic — it flags risk signals, not definitive fraud. Always verify on the official provider website before applying. Legitimate scholarships <span className="text-white">never</span> ask you to pay a fee to apply.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] p-5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
              <Sparkles className="h-3 w-3"/> Never again
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-white">Skip the scam-hunting. Get a shortlist of verified scholarships.</h3>
            <p className="mt-2 text-sm text-white/70 max-w-xl mx-auto">
              ScholarshipFit ships you 800+ source-linked, human-verified scholarships ranked by fit — in under 60 seconds.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Link href="/quiz">
                <Button className="h-11 px-6 btn-gold btn-pill font-semibold">Get my verified shortlist <ArrowRight className="ml-2 h-4 w-4"/></Button>
              </Link>
              <Link href="/vs-chatgpt" className="text-sm text-[#D4AF37] hover:underline self-center">Why we&apos;re better than ChatGPT →</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
