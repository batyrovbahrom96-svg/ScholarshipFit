'use client'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, TrendingUp, Sparkles, Loader2, ShieldCheck, Zap, XCircle, HelpCircle } from 'lucide-react'
import { store } from '@/lib/client-store'

/* ================================================================
   Application Readiness Score
   - Trigger button (compact pill) — click to open the modal
   - Modal fetches /api/readiness for {profile, scholarship}
   - Renders: big score ring · bucket · headline · eligibility ·
     strengths · gaps (with impact chips) · actions (ordered by ROI)
   ================================================================ */

const BUCKETS = {
  'Strong':      { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  label: 'Strong candidate' },
  'Competitive': { color: '#D4AF37', bg: 'rgba(212,175,55,0.15)', label: 'Competitive' },
  'Reach':       { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Reach — needs work' },
  'Long-shot':   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  label: 'Long-shot — high effort' },
}
const ELIG_ICON = {
  'Eligible':               <CheckCircle2 className="h-4 w-4 text-emerald-400"/>,
  'Likely eligible':        <CheckCircle2 className="h-4 w-4 text-[#D4AF37]"/>,
  'Ineligible':             <XCircle className="h-4 w-4 text-red-400"/>,
  'Unclear from source':    <HelpCircle className="h-4 w-4 text-white/50"/>,
}
const WASTE_STYLE = {
  Low:    { color: '#22c55e', label: '🟢 Low effort waste' },
  Medium: { color: '#D4AF37', label: '🟡 Some effort risk' },
  High:   { color: '#ef4444', label: '🔴 High effort risk' },
}

function Ring({ score = 0, color = '#D4AF37' }) {
  const R = 44
  const C = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(100, score)) / 100
  const dash = C * pct
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5D67B"/>
          <stop offset="1" stopColor={color}/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none"/>
      <circle
        cx="50" cy="50" r={R}
        stroke="url(#ring-grad)" strokeWidth="8" fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="52" textAnchor="middle" dominantBaseline="middle"
            fontSize="26" fontWeight="600" fill="#ffffff">{score}</text>
      <text x="50" y="72" textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="rgba(255,255,255,0.55)" letterSpacing="1.5">/ 100</text>
    </svg>
  )
}

/* ---------- Pill trigger (used on scholarship cards) ---------- */
export function ReadinessPill({ scholarshipId, scholarshipName }) {
  const [open, setOpen] = useState(false)
  const profile = typeof window !== 'undefined' ? store.getProfile() : null
  const eligible = !!(profile && profile.degree_level && profile.intended_major)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={eligible ? 'Get your readiness score for this scholarship' : 'Build your profile first — takes 2 minutes'}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/20 transition"
      >
        <TrendingUp className="h-3.5 w-3.5"/>
        {eligible ? 'Am I ready?' : 'Score me'}
      </button>
      <ReadinessDialog open={open} onClose={() => setOpen(false)} scholarshipId={scholarshipId} scholarshipName={scholarshipName}/>
    </>
  )
}

/* ---------- The dialog with full analysis ---------- */
export function ReadinessDialog({ open, onClose, scholarshipId, scholarshipName }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)

  useEffect(() => {
    if (!open) return
    const profile = store.getProfile()
    if (!profile || !profile.degree_level) {
      setError('Complete your profile first (takes 2 minutes) — then come back for a personalized readiness score.')
      return
    }
    if (!scholarshipId) return
    setLoading(true); setError(''); setData(null)
    fetch('/api/readiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, scholarship_id: scholarshipId }),
    })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || ''
        if (!ct.includes('application/json')) {
          throw new Error('Analysis service is warming up — try again in a moment.')
        }
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || j.detail || 'Analysis failed')
        setData(j.readiness); setCached(!!j.cached)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, scholarshipId])

  const bucket = data ? BUCKETS[data.bucket] || BUCKETS['Competitive'] : null
  const wasteStyle = data ? WASTE_STYLE[data.waste_risk] : null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl border-[#D4AF37]/25 bg-black/95 backdrop-blur text-white p-0 overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/80">
              <Sparkles className="h-3 w-3"/> Application Readiness Score
            </div>
            <DialogTitle className="text-xl md:text-2xl font-semibold text-white pt-1">
              {scholarshipName || 'Your readiness'}
            </DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="mt-8 flex flex-col items-center gap-4 py-10">
              <Loader2 className="h-10 w-10 text-[#D4AF37] animate-spin"/>
              <p className="text-sm text-white/70">Claude Sonnet 4.5 is analysing your fit…</p>
              <p className="text-xs text-white/40">This takes up to a minute the first time · instant after</p>
            </div>
          )}

          {error && !loading && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-300">{error}</p>
              {error.includes('profile') && (
                <a href="/onboarding" className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">Complete profile →</a>
              )}
            </div>
          )}

          {data && (
            <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr] items-start">
              <div className="flex flex-col items-center gap-3">
                <Ring score={data.score} color={bucket?.color}/>
                <Badge className="px-3 py-1 font-medium border" style={{ color: bucket?.color, borderColor: bucket?.color + '80', background: bucket?.bg }}>
                  {bucket?.label}
                </Badge>
                {wasteStyle && (
                  <span className="text-[11px] text-white/60">{wasteStyle.label}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white/85 leading-relaxed">{data.headline}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                  {ELIG_ICON[data.eligibility_status] || <HelpCircle className="h-4 w-4 text-white/50"/>}
                  <span className="text-white/90 font-medium">{data.eligibility_status}</span>
                </div>
                {data.eligibility_reason && (
                  <p className="mt-2 text-xs text-white/60 leading-relaxed">{data.eligibility_reason}</p>
                )}
              </div>
            </div>
          )}

          {data?.strengths?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400/80 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>Your strengths</h3>
              <ul className="mt-3 space-y-2.5">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-xs text-white/65 mt-0.5">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data?.gaps?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/80 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5"/>Where to close the gap</h3>
              <ul className="mt-3 space-y-2.5">
                {data.gaps.map((g, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-3.5">
                    <AlertTriangle className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">{g.label}</p>
                        <Badge className="shrink-0 bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/25">+{g.impact_points} pts</Badge>
                      </div>
                      <p className="text-xs text-white/65 mt-0.5">{g.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data?.actions?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/80 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-[#D4AF37]"/>Prioritised action plan</h3>
              <ol className="mt-3 space-y-2.5">
                {data.actions.map((a, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-[#D4AF37] text-black text-xs font-semibold flex items-center justify-center">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{a.step}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37]">+{a.impact_points} pts</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/70">{a.effort} effort</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {data && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <div className="text-[11px] text-white/40">
                <ShieldCheck className="inline h-3 w-3 mr-1"/>
                Powered by Claude Sonnet 4.5 · {cached ? 'Cached · ~100ms' : 'Fresh analysis'} · Not a guarantee of admission
              </div>
              <Button onClick={onClose} variant="outline" className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-9">Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
