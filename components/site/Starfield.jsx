'use client'
import { useEffect, useRef } from 'react'

export default function Starfield({ density = 120, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = (canvas.width = canvas.offsetWidth * devicePixelRatio)
    let h = (canvas.height = canvas.offsetHeight * devicePixelRatio)
    const stars = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.7 + 0.15,
      s: (Math.random() * 0.4 + 0.05) * devicePixelRatio,
      t: Math.random() * Math.PI * 2,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        s.t += 0.02
        const twinkle = 0.6 + Math.sin(s.t) * 0.4
        ctx.beginPath()
        ctx.fillStyle = `rgba(186,230,253,${s.a * twinkle})`
        ctx.arc(s.x, s.y, s.r * devicePixelRatio, 0, Math.PI * 2)
        ctx.fill()
        s.y += s.s
        if (s.y > h) { s.y = 0; s.x = Math.random() * w }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio
      h = canvas.height = canvas.offsetHeight * devicePixelRatio
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [density])
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />
}
