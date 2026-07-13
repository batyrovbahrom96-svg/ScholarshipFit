'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Globe2, Clock3, ShieldCheck } from 'lucide-react'

/*
  ================================================================
  LiveStats — real-time DB counters, live from /api/stats.
  ----------------------------------------------------------------
  Replaces hardcoded "800+" with the actual number of scholarships
  currently in the database, plus country coverage and freshness.
  ----------------------------------------------------------------
  Variants:
    • variant="hero"    — big pill row for landing hero
    • variant="inline"  — compact single-line for inline copy
    • variant="badge"   — small trust badge (for pricing / footer)
  ================================================================
*/

// Fallback values used until /api/stats resolves (or when it fails).
// These match the real DB state at implementation time so the initial
// paint matches what the visitor will see 300ms later.
const FALLBACK = {
  scholarships_total: 799,
  countries_count: 60,
  days_since_refresh: 0,
}

function useLiveStats() {
  const [data, setData] = useState(FALLBACK)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stats', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (cancelled || !j) return
        setData({
          scholarships_total: j.scholarships_total || FALLBACK.scholarships_total,
          countries_count:    j.countries_count    || FALLBACK.countries_count,
          days_since_refresh: (j.days_since_refresh ?? FALLBACK.days_since_refresh),
        })
        setLoaded(true)
      })
      .catch(() => { /* keep fallback */ })
    return () => { cancelled = true }
  }, [])

  return { ...data, loaded }
}

function humaniseRecency(days) {
  if (days == null) return 'updated regularly'
  if (days === 0)  return 'updated today'
  if (days === 1)  return 'updated yesterday'
  if (days <= 7)   return `updated ${days} days ago`
  if (days <= 14)  return 'updated this week'
  if (days <= 30)  return 'updated this month'
  return 'updated recently'
}

/* ---------- variant="hero" — landing hero pill row ---------- */
function HeroVariant() {
  const s = useLiveStats()
  return (
    <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/70">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-400"/>
        <span className="tabular-nums font-medium text-white">{s.scholarships_total}</span> hand-verified scholarships
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1">
        <Globe2 className="h-3 w-3 text-white/60"/>
        <span className="tabular-nums font-medium text-white">{s.countries_count}+</span> countries
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1">
        No dead links
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[#E7C766]">
        Every listing sourced from the official provider
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-white/50">
        <Clock3 className="h-3 w-3"/>
        {humaniseRecency(s.days_since_refresh)}
      </span>
    </div>
  )
}

/* ---------- variant="inline" — a short compact live line ---------- */
function InlineVariant() {
  const s = useLiveStats()
  return (
    <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/>
      <span>
        <span className="tabular-nums font-semibold text-white">{s.scholarships_total}</span>
        {' '}hand-verified scholarships across{' '}
        <span className="tabular-nums font-semibold text-white">{s.countries_count}+</span> countries
      </span>
      <span className="text-white/30">·</span>
      <span className="text-white/50">{humaniseRecency(s.days_since_refresh)}</span>
    </div>
  )
}

/* ---------- variant="badge" — small trust badge (footer / paywall) ---------- */
function BadgeVariant() {
  const s = useLiveStats()
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2.5 py-1 text-[11px] text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
      <span className="tabular-nums font-semibold text-white">{s.scholarships_total}</span>
      hand-verified · live count
    </div>
  )
}

/* ---------- variant="stat" — single big number for stat tiles ---------- */
function StatVariant({ label = 'Hand-verified premium scholarships' }) {
  const s = useLiveStats()
  return (
    <>
      <div className="tabular-nums text-3xl md:text-4xl font-semibold bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">
        {s.scholarships_total}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-widest text-white/45">{label}</div>
    </>
  )
}

export default function LiveStats({ variant = 'inline', label }) {
  switch (variant) {
    case 'hero':   return <HeroVariant />
    case 'badge':  return <BadgeVariant />
    case 'stat':   return <StatVariant label={label}/>
    case 'inline':
    default:       return <InlineVariant />
  }
}
