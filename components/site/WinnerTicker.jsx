'use client'
import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'

/* Small floating pill in the corner showing recent "winners" —
   modeled on ScholarshipOwl's live-winner ticker. Content is
   sourced from a static illustrative list (this is aspirational
   social proof, not real user data — kept obviously demo). */
const WINNERS = [
  { name: 'Amelia K.',  amount: 25000, scholarship: 'Rhodes Trust' },
  { name: 'Marcus D.',  amount: 40000, scholarship: 'DAAD Scholarship' },
  { name: 'Priya S.',   amount: 22000, scholarship: 'Chevening' },
  { name: 'Kenji T.',   amount: 18000, scholarship: 'MIT Presidential' },
  { name: 'Sofia R.',   amount: 32000, scholarship: 'Erasmus Mundus' },
  { name: 'Liam O.',    amount: 15000, scholarship: 'Fulbright' },
]

export default function WinnerTicker() {
  const [i, setI]  = useState(0)
  const [on, setOn] = useState(false)

  useEffect(() => {
    // Show after a short delay so the hero animates in first.
    const show = setTimeout(() => setOn(true), 3500)
    const cycle = setInterval(() => setI(x => (x + 1) % WINNERS.length), 6500)
    return () => { clearTimeout(show); clearInterval(cycle) }
  }, [])

  if (!on) return null
  const w = WINNERS[i]

  return (
    <div className="fixed bottom-4 left-4 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#D4AF37]/30 bg-black/85 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl"
           style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.15), 0 12px 40px -8px rgba(0,0,0,0.9)' }}>
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
          <Trophy className="h-4.5 w-4.5 text-[#D4AF37]"/>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#D4AF37]/80">Recent match</p>
          <p className="text-sm text-white leading-tight"><span className="font-semibold">{w.name}</span> · ${w.amount.toLocaleString()}</p>
          <p className="text-[11px] text-white/50 truncate max-w-[220px]">{w.scholarship}</p>
        </div>
      </div>
    </div>
  )
}
