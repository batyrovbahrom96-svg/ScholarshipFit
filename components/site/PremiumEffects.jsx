'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

/* ================================================================
   PremiumEffects — signature "botiroff-grade" polish layer
   ---------------------------------------------------------------
   Combines: LoadingCounter (initial page reveal), CustomCursor (spring-
   physics gold ring that expands over interactive elements), and
   SmoothScroll wiring. Mounts globally from RootLayout.
   ---------------------------------------------------------------
   Disabled automatically on touch devices — cursor effects hurt UX
   on mobile / trackpad-heavy setups. Respects prefers-reduced-motion.
   ================================================================ */

function useIsTouchOrReducedMotion() {
  const [disabled, setDisabled] = useState(true) // default to disabled (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setDisabled(touch || reduced)
  }, [])
  return disabled
}

/* ---------- LoadingCounter (0 → 100% overlay on first load) ---------- */
function LoadingCounter() {
  const [pct, setPct] = useState(0)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    let raf, done = false
    const start = performance.now()
    const step = (t) => {
      const elapsed = t - start
      // Ease-out: fast start, slow finish
      let v = Math.min(100, Math.round(100 * (1 - Math.pow(1 - Math.min(elapsed / 900, 1), 3))))
      // Once window has loaded, jump to 100 immediately
      if (document.readyState === 'complete' && !done) {
        v = 100; done = true
      }
      setPct(v)
      if (v < 100) raf = requestAnimationFrame(step)
      else setTimeout(() => setGone(true), 260)
    }
    raf = requestAnimationFrame(step)
    const onLoad = () => { done = true; setPct(100); setTimeout(() => setGone(true), 260) }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('load', onLoad) }
  }, [])

  if (gone) return null
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ${pct >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-6">
        <div className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]/70">ScholarshipFit</div>
        <div className="relative">
          <span className="block text-7xl md:text-9xl font-semibold text-white tabular-nums tracking-tight">{pct}</span>
          <span className="absolute top-1 -right-6 text-lg text-[#D4AF37]">%</span>
        </div>
        <div className="h-[1px] w-56 overflow-hidden bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F5D67B] to-[#D4AF37] transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ---------- CustomCursor (large gold ring with spring physics) ---------- */
function CustomCursor() {
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  // Spring config: ring lags behind pointer softly, dot follows tight
  const springRing = { damping: 22, stiffness: 260, mass: 0.6 }
  const springDot = { damping: 30, stiffness: 800, mass: 0.15 }
  const ringX = useSpring(x, springRing)
  const ringY = useSpring(y, springRing)
  const dotX = useSpring(x, springDot)
  const dotY = useSpring(y, springDot)
  const scale = useSpring(1, { damping: 20, stiffness: 260 })

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY)
      setVisible(true)
    }
    const leave = () => setVisible(false)
    const over = (e) => {
      const t = e.target
      const interactive = t.closest?.('a, button, [role="button"], input, textarea, select, label[for], [data-cursor-hover]')
      setHovering(!!interactive)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      document.removeEventListener('mouseleave', leave)
    }
  }, [x, y])

  useEffect(() => { scale.set(hovering ? 2.2 : 1) }, [hovering, scale])

  return (
    <>
      {/* Ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[95] mix-blend-difference"
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }}
      >
        <motion.div
          className={`-ml-4 -mt-4 h-8 w-8 rounded-full border transition-colors duration-200
            ${hovering ? 'border-[#F5D67B] bg-[#D4AF37]/12' : 'border-[#D4AF37]/60 bg-transparent'}`}
          style={{ scale }}
        />
      </motion.div>
      {/* Dot */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[96]"
        style={{ x: dotX, y: dotY, opacity: visible && !hovering ? 1 : 0 }}
      >
        <div className="-ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-[#F5D67B] shadow-[0_0_12px_2px_rgba(212,175,55,0.7)]"/>
      </motion.div>
    </>
  )
}

/* ---------- SmoothScroll (CSS + anchor smoothing) ---------- */
function SmoothScrollSetup() {
  useEffect(() => {
    const previous = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = previous }
  }, [])
  return null
}

export default function PremiumEffects() {
  const disabled = useIsTouchOrReducedMotion()
  return (
    <>
      <LoadingCounter />
      <SmoothScrollSetup />
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
   Reveal — subtle fade-up as element enters viewport
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
