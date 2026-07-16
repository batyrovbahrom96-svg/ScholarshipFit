'use client'
// Global scroll-reveal system. Works in 2 modes:
//
//   1) Explicit — wrap any content with <Reveal>...</Reveal> for a controlled
//      fade+lift when it enters the viewport.
//
//   2) Automatic (via <AutoReveal/>) — mounted once at the layout level. Uses
//      a MutationObserver + IntersectionObserver to auto-mark every <section>,
//      <article>, or [data-reveal] element site-wide, so ALL pages get the
//      elegant scroll-in effect without touching every component.
//
// Uses hardware-accelerated transforms only (opacity + translate3d) so it stays
// buttery on mobile Safari. Fully respects prefers-reduced-motion (CSS-side).

import { useEffect, useRef } from 'react'

// --------------------------------------------------------------
// <Reveal> — explicit wrapper (for hero/CTA/card blocks etc.)
// --------------------------------------------------------------
export default function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',           // up | left | right | fade | scale
  delay = 0,                // 0..6 (multiplied ×60ms)
  className = '',
  once = true,
}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (el) el.classList.add('sf-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('sf-in')
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            entry.target.classList.remove('sf-in')
          }
        }
      },
      { root: null, threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])

  const variantClass = {
    up:    '',
    left:  'sf-reveal-left',
    right: 'sf-reveal-right',
    fade:  'sf-reveal-fade',
    scale: 'sf-reveal-scale',
  }[variant] || ''
  const delayClass = delay && delay >= 1 && delay <= 6 ? `sf-delay-${delay}` : ''

  return (
    <Tag ref={ref} className={`sf-reveal ${variantClass} ${delayClass} ${className}`.trim()}>
      {children}
    </Tag>
  )
}

// --------------------------------------------------------------
// <AutoReveal/> — mount once at the layout level. Automatically
// tags every <section>, <article>, [data-reveal] anywhere on the
// page so they gently fade + lift as the user scrolls.
// --------------------------------------------------------------
export function AutoReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let observer = null
    const markedNodes = new WeakSet()

    const enhance = (root = document) => {
      const nodes = root.querySelectorAll?.(
        'section, article, [data-reveal]:not(.sf-reveal)',
      )
      nodes?.forEach((el) => {
        if (markedNodes.has(el)) return
        // Skip the fixed navbar or elements with data-no-reveal
        if (el.closest('[data-no-reveal]') || el.dataset?.noReveal === 'true') return
        if (el.tagName === 'NAV') return
        el.classList.add('sf-reveal')
        markedNodes.add(el)
        observer?.observe(el)
      })
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sf-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { root: null, threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    // Initial pass
    enhance()

    // React re-renders may inject new sections — watch for them
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return
          enhance(n.parentNode || document)
        })
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Safety: reveal anything above the fold immediately so first paint
    // isn't blanked while IntersectionObserver spins up.
    setTimeout(() => {
      document.querySelectorAll('.sf-reveal').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight * 0.9) el.classList.add('sf-in')
      })
    }, 60)

    return () => {
      observer?.disconnect()
      mo.disconnect()
    }
  }, [])
  return null
}
