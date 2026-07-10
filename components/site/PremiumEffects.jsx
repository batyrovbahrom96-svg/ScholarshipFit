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
    const DURATION = 2400   // ~2.4s — long enough to feel premium, short enough to not annoy

    const step = (t) => {
      const elapsed = t - start
      const p = Math.min(1, elapsed / DURATION)
      // easeInOutQuart — slow start, quick middle, slow finish (deliberate)
      const eased = p < 0.5
        ? 8 * p * p * p * p
        : 1 - Math.pow(-2 * p + 2, 4) / 2
      const v = Math.round(100 * eased)
      setPct(v)
      if (p < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setPct(100)
        try { window.sessionStorage?.setItem('sf_boot_seen', '1') } catch { /* storage may be blocked */ }
        setTimeout(() => setGone(true), 480)   // graceful fade-out delay
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (gone) return null
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ${pct >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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

/* ---------- CustomCursor — MINIMAL, bulletproof (v3) ---------- */
/*
 * v3 fixes the "cursor freezes on hero" bug reported by users.
 * Root cause of v2 freeze: the pointerover listener called .closest() on
 * every element pass; on hero pages with hundreds of nodes (3D scene,
 * cosmos dots) this saturated the main thread.
 *
 * v3 strategy:
 *  - ONLY listen to pointermove (no pointerover).
 *  - Hover-scaling handled via CSS :hover on interactive elements
 *    using cursor-target class (opt-in), NOT via JS DOM traversal.
 *  - rAF loop yields when tab hidden (`document.hidden`).
 *  - Position updates use CSS `translate` (no scale in transform string
 *    so browser compositor can accelerate it).
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
      rx += (tx - rx) * 0.24
      ry += (ty - ry) * 0.24
      if (ringRef.current) ringRef.current.style.translate = `${rx - 16}px ${ry - 16}px`
      if (dotRef.current)  dotRef.current.style.translate  = `${tx - 3}px ${ty - 3}px`
      const d = Math.hypot(tx - rx, ty - ry)
      if (d < 0.4) { running = false; return }
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
        className="pointer-events-none fixed left-0 top-0 z-[95] h-8 w-8 rounded-full border border-[#D4AF37]/60 opacity-0 will-change-transform"
        style={{ translate: '-100px -100px', mixBlendMode: 'difference', transition: 'opacity 250ms' }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[96] h-1.5 w-1.5 rounded-full bg-[#F5D67B] opacity-0 will-change-transform"
        style={{ translate: '-100px -100px', boxShadow: '0 0 12px 2px rgba(212,175,55,0.7)', transition: 'opacity 250ms' }}
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
      entries.forEach((entry) => {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target)
          entry.target.classList.add('is-revealed')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' })

    // Observe existing elements
    const observeAll = () => {
      const els = document.querySelectorAll('[data-reveal]:not(.is-revealed)')
      els.forEach((el) => io.observe(el))
    }
    observeAll()

    // Re-observe when navigating between routes (SPA). Throttled to next
    // rAF so we don't call querySelectorAll on every micro DOM mutation
    // (which can happen dozens of times per second on data-heavy pages).
    let pending = false
    const mo = new MutationObserver(() => {
      if (pending) return
      pending = true
      requestAnimationFrame(() => { pending = false; observeAll() })
    })
    mo.observe(document.body, { childList: true, subtree: true })

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
