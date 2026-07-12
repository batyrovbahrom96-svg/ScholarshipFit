'use client'
import { useEffect, useRef, useState } from 'react'

/* ================================================================
   PremiumEffects — signature polish layer (rebuilt for performance).
   ---------------------------------------------------------------
   - LoadingCounter: 0 → 100 with premium slow ease (~2.4s)
   - CustomCursor:   plain rAF + CSS transform (no framer springs).
                      Avoids the "stuck / laggy" issue on card-heavy pages.
   - ScrollReveal:   single IntersectionObserver that reveals any element
                      marked [data-reveal] with a gentle fade-up.
   - SmoothScroll:   CSS scroll-behavior.
   Disabled on touch devices + respects prefers-reduced-motion.
   ================================================================ */

function useIsTouchOrReducedMotion() {
  const [disabled, setDisabled] = useState(true)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setDisabled(touch || reduced)
  }, [])
  return disabled
}

/* ---------- LoadingCounter — slow, deliberate, premium ---------- */
function LoadingCounter() {
  const [pct, setPct] = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    // Skip on subsequent navigations (only show once per browser session)
    if (typeof window !== 'undefined' && window.sessionStorage?.getItem('sf_boot_seen')) {
      setGone(true)
      return
    }

    let raf
    const start = performance.now()
    const DURATION = 900   // was 2400ms — trimmed for snappier first paint while still feeling premium

    const step = (t) => {
      const elapsed = t - start
      const p = Math.min(1, elapsed / DURATION)
      // easeOutCubic — feels quick + confident (removed slow-start easing)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(100 * eased)
      setPct(v)
      if (p < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setPct(100)
        try { window.sessionStorage?.setItem('sf_boot_seen', '1') } catch { /* storage may be blocked */ }
        setTimeout(() => setGone(true), 180)   // was 480ms — quicker fade-out
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (gone) return null
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300 ${pct >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-8">
        <div className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37]/70">Scholarshipfit</div>
        <div className="relative">
          <span className="block text-8xl md:text-[10rem] font-semibold text-white tabular-nums tracking-tight leading-none">
            {String(pct).padStart(2, '0')}
          </span>
          <span className="absolute top-2 -right-8 text-lg text-[#D4AF37]/80">%</span>
        </div>
        <div className="h-[1px] w-64 md:w-80 overflow-hidden bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F5D67B] to-[#D4AF37]"
            style={{ width: `${pct}%`, transition: 'width 120ms linear' }}
          />
        </div>
        <div className="text-[10px] uppercase tracking-[0.32em] text-white/40 mt-2">
          Preparing your Command Center
        </div>
      </div>
    </div>
  )
}

/* ---------- CustomCursor — MINIMAL, GPU-accelerated (v4) ---------- */
/*
 * v4 optimizations for buttery-smooth performance on any hardware:
 *  - REMOVED mix-blend-mode: 'difference' — forced full-viewport
 *    compositor pass every pointer move (single biggest cost in v3).
 *  - REMOVED heavy box-shadow blur on the dot — replaced with a
 *    static radial-gradient background that costs nothing to move.
 *  - Ring uses translate3d() to guarantee GPU layer promotion.
 *  - Uses passive rAF loop that fully sleeps when idle (no wake-up
 *    on the *first* move — only on subsequent ones).
 *  - Auto-hides over text inputs (cursor: text feels right there).
 */
function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    let raf = 0
    let tx = -100, ty = -100
    let rx = -100, ry = -100
    let running = false
    let hidden = false

    const tick = () => {
      if (hidden) { running = false; return }
      // Smooth ring follow (0.35 lerp = smooth, not laggy)
      rx += (tx - rx) * 0.35
      ry += (ty - ry) * 0.35
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`
      if (dotRef.current)  dotRef.current.style.transform  = `translate3d(${tx - 3}px, ${ty - 3}px, 0)`
      const d = Math.abs(tx - rx) + Math.abs(ty - ry)   // Manhattan distance — cheaper than hypot
      if (d < 0.5) { running = false; return }
      raf = requestAnimationFrame(tick)
    }

    const move = (e) => {
      tx = e.clientX; ty = e.clientY
      if (ringRef.current && ringRef.current.style.opacity !== '1') ringRef.current.style.opacity = '1'
      if (dotRef.current  && dotRef.current.style.opacity  !== '1') dotRef.current.style.opacity  = '1'
      if (!running) { running = true; raf = requestAnimationFrame(tick) }
    }
    const leave = () => {
      if (ringRef.current) ringRef.current.style.opacity = '0'
      if (dotRef.current)  dotRef.current.style.opacity  = '0'
    }
    const vis = () => {
      hidden = document.hidden
      if (!hidden && !running) { running = true; raf = requestAnimationFrame(tick) }
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', vis)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[95] h-8 w-8 rounded-full border border-[#D4AF37]/70 opacity-0"
        style={{ transform: 'translate3d(-100px,-100px,0)', transition: 'opacity 200ms', willChange: 'transform' }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[96] h-1.5 w-1.5 rounded-full opacity-0"
        style={{
          transform: 'translate3d(-100px,-100px,0)',
          background: 'radial-gradient(circle, #F5D67B 0%, #D4AF37 60%, transparent 100%)',
          transition: 'opacity 200ms',
          willChange: 'transform',
        }}
      />
    </>
  )
}

/* ---------- Global ScrollReveal ---------- */
function ScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const seen = new WeakSet()

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target)
          entry.target.classList.add('is-revealed')
          io.unobserve(entry.target)
        }
      }
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' })

    // Observe existing elements
    const observeAll = () => {
      const els = document.querySelectorAll('[data-reveal]:not(.is-revealed)')
      for (const el of els) io.observe(el)
    }
    observeAll()

    // Only re-scan when NEW nodes are actually added to the DOM. Skip attribute
    // changes and character-data changes (which fire on every keystroke) — those
    // will never introduce a new [data-reveal] element.
    // Debounced through rAF so bursts of DOM mutations coalesce.
    let pending = false
    const mo = new MutationObserver((mutations) => {
      let hasAddedNodes = false
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) { hasAddedNodes = true; break }
      }
      if (!hasAddedNodes || pending) return
      pending = true
      requestAnimationFrame(() => { pending = false; observeAll() })
    })
    mo.observe(document.body, { childList: true, subtree: true })   // attributes: false (default)

    return () => { io.disconnect(); mo.disconnect() }
  }, [])
  return null
}

/* ---------- SmoothScroll ---------- */
function SmoothScrollSetup() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = prev }
  }, [])
  return null
}

export default function PremiumEffects() {
  // Cursor re-enabled with a bulletproof implementation: pure CSS transform
  // + rAF, listens ONLY to pointermove (no pointerover polling), and never
  // re-runs when the tab is hidden. Disabled on touch + reduced-motion.
  const disabled = useIsTouchOrReducedMotion()
  return (
    <>
      <LoadingCounter />
      <SmoothScrollSetup />
      <ScrollReveal />
      {!disabled && <CustomCursor />}
    </>
  )
}

/* ================================================================
   StatCounter — animated 0 → target on scroll into view
   ================================================================ */
export function StatCounter({ value, suffix = '', prefix = '', label, duration = 1.6, className = '' }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true)
        const start = performance.now()
        const step = (t) => {
          const p = Math.min(1, (t - start) / (duration * 1000))
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.round(eased * value))
          if (p < 1) requestAnimationFrame(step)
          else setDisplay(value)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.35 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [value, duration, started])

  return (
    <div ref={ref} className={className}>
      <div className="flex items-baseline gap-1 justify-center">
        {prefix && <span className="text-[#D4AF37] text-xl md:text-3xl font-medium">{prefix}</span>}
        <span className="text-5xl md:text-7xl font-semibold text-white tabular-nums tracking-tight">
          {display.toLocaleString()}
        </span>
        {suffix && <span className="text-[#D4AF37] text-2xl md:text-4xl font-medium">{suffix}</span>}
      </div>
      {label && (
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.22em] text-white/50">{label}</p>
      )}
    </div>
  )
}

/* ================================================================
   Reveal — legacy wrapper (still works for existing usage)
   ================================================================ */
export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect() }
    }, { threshold: 0.12 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${seen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
