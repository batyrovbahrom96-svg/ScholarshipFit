'use client'
// Founder-launch urgency banner: live countdown + spots-remaining bar.
//
// - Fetches /api/urgency once, then ticks locally every second so the
//   countdown feels alive without hammering the server.
// - Re-fetches every 60 seconds to refresh spot count (in case new preorders
//   land while the visitor is on the page).
// - Auto-hides when the campaign has ended (is_over === true).
// - Three variants — 'inline' (compact single-line), 'card' (rich card),
//   'strip' (thin top-of-page strip).
import { useEffect, useMemo, useState } from 'react'
import { Timer, Flame } from 'lucide-react'

export default function UrgencyBanner({ variant = 'card', className = '' }) {
  const [data, setData] = useState(null)
  const [tickSec, setTickSec] = useState(0)

  // Fetch server truth (schedule + spots). Refresh every 60s.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const r = await fetch('/api/urgency', { cache: 'no-store' })
        const d = await r.json()
        if (alive) setData(d)
      } catch (_e) { /* ignore */ }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  // Local tick every second so the timer feels live.
  useEffect(() => {
    const iv = setInterval(() => setTickSec((n) => n + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // Compute displayed countdown from server epoch + local drift.
  const timer = useMemo(() => {
    if (!data?.countdown?.end_iso) return null
    const end = new Date(data.countdown.end_iso).getTime()
    const now = Date.now()
    const secs = Math.max(0, Math.floor((end - now) / 1000))
    return {
      is_over: secs <= 0,
      seconds_left: secs,
      days:  Math.floor(secs / 86400),
      hours: Math.floor((secs % 86400) / 3600),
      mins:  Math.floor((secs % 3600) / 60),
      secs:  secs % 60,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tickSec])

  if (!data || !timer || timer.is_over) return null
  const s = data.spots || {}
  const pad = (n) => String(n).padStart(2, '0')

  if (variant === 'strip') {
    return (
      <div className={`w-full bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/5 to-[#D4AF37]/15 border-b border-[#D4AF37]/25 ${className}`}>
        <div className="container mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[#D4AF37] font-medium">
            <Flame className="h-3.5 w-3.5"/> Founder pricing ends in
          </span>
          <span className="font-mono text-white">
            {timer.days > 0 && `${timer.days}d `}{pad(timer.hours)}:{pad(timer.mins)}:{pad(timer.secs)}
          </span>
          <span className="text-white/60">
            · <span className="text-white">{s.claimed}</span>/{s.total} founder spots claimed
            <span className="text-[#D4AF37]"> ({s.remaining} left)</span>
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-3 text-xs ${className}`}>
        <span className="inline-flex items-center gap-1 text-[#D4AF37]"><Flame className="h-3 w-3"/> Ends in</span>
        <span className="font-mono text-white">{timer.days > 0 ? `${timer.days}d ` : ''}{pad(timer.hours)}:{pad(timer.mins)}:{pad(timer.secs)}</span>
        <span className="text-white/60">{s.remaining} spots left</span>
      </div>
    )
  }

  // Default: 'card'
  return (
    <div className={`rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/[0.05] p-4 md:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5"/> Founder pricing ends in
          </div>
          <div className="mt-1 flex items-baseline gap-2 md:gap-3 font-mono">
            <TimeCell n={timer.days}  label="days"/>
            <TimeSep/>
            <TimeCell n={timer.hours} label="hrs"/>
            <TimeSep/>
            <TimeCell n={timer.mins}  label="min"/>
            <TimeSep/>
            <TimeCell n={timer.secs}  label="sec" pulse/>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/60">Spots claimed</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {s.claimed}<span className="text-white/40 text-sm"> / {s.total}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D573] transition-all duration-700 ease-out"
          style={{ width: `${s.percent || 0}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-white/60">
        <span><span className="text-[#D4AF37] font-medium">{s.remaining}</span> founder spots left</span>
        <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5"/>Lock in your price now</span>
      </div>
    </div>
  )
}

function TimeCell({ n, label, pulse }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-2xl md:text-3xl font-bold text-white leading-none tabular-nums ${pulse ? 'animate-pulse' : ''}`}>
        {String(n).padStart(2, '0')}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-white/50 mt-1">{label}</div>
    </div>
  )
}
function TimeSep() {
  return <div className="text-2xl md:text-3xl text-white/25 font-bold leading-none">:</div>
}
