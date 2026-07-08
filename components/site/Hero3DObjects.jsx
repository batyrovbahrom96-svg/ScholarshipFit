'use client'
import { motion } from 'framer-motion'

/* ===================================================================
   Hero3DObjects — floating "shiny black + gold rim" 3D-style icons
   inspired by atlas.org's hero. Each icon is a hand-crafted SVG that
   fakes a matte-black plastic surface with warm/gold edge lighting.
   Framer Motion animates a subtle float + rotate loop.
   =================================================================== */

// Shared gradient definitions kept in one <defs> per SVG so they're
// self-contained (safe if the component appears multiple times).
const Rim = ({ id }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#F5D67B" />
    <stop offset="0.5" stopColor="#D4AF37" />
    <stop offset="1" stopColor="#8A6A1A" />
  </linearGradient>
)
const Face = ({ id }) => (
  <radialGradient id={id} cx="0.35" cy="0.3" r="0.9">
    <stop offset="0" stopColor="#2E2E2E" />
    <stop offset="0.55" stopColor="#141414" />
    <stop offset="1" stopColor="#050505" />
  </radialGradient>
)
const Warm = ({ id }) => (
  <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stopColor="#7A3E10" stopOpacity="0.9" />
    <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
  </linearGradient>
)

/* ---------------- Star ---------------- */
function Star3D({ size = 130 }) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <Face id="star-face" />
        <Rim id="star-rim" />
        <Warm id="star-warm" />
        <filter id="star-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="6" result="off" />
          <feComponentTransfer><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* 5-pointed star with subtle inset lines to fake 3D bevels */}
      <g filter="url(#star-shadow)">
        <polygon
          points="0,-80 22,-24 82,-24 33,10 52,68 0,32 -52,68 -33,10 -82,-24 -22,-24"
          fill="url(#star-face)"
          stroke="url(#star-rim)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Bevel highlights on the top-left facets */}
        <polygon points="0,-80 22,-24 0,-14" fill="#ffffff" fillOpacity="0.08" />
        <polygon points="-82,-24 -22,-24 -33,10" fill="#ffffff" fillOpacity="0.05" />
        {/* Warm bottom glow */}
        <polygon points="-52,68 0,32 52,68 0,80" fill="url(#star-warm)" opacity="0.6" />
      </g>
    </svg>
  )
}

/* ---------------- Checkmark disc ---------------- */
function Check3D({ size = 130 }) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <Face id="chk-face" />
        <Rim id="chk-rim" />
        <Warm id="chk-warm" />
        <radialGradient id="chk-inner" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#242424" />
          <stop offset="1" stopColor="#0A0A0A" />
        </radialGradient>
        <filter id="chk-shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="6" result="o"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter="url(#chk-shadow)">
        {/* Outer thick ring */}
        <circle cx="0" cy="0" r="80" fill="url(#chk-face)" stroke="url(#chk-rim)" strokeWidth="2.5" />
        {/* Inner recessed disc */}
        <circle cx="0" cy="0" r="58" fill="url(#chk-inner)" />
        {/* Warm bottom glow */}
        <ellipse cx="0" cy="60" rx="55" ry="20" fill="url(#chk-warm)" opacity="0.7"/>
        {/* Checkmark path with gold rim */}
        <path
          d="M -30 6 L -8 30 L 34 -20"
          fill="none"
          stroke="url(#chk-rim)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        {/* Highlight edge on top */}
        <path d="M -70 -40 A 80 80 0 0 1 40 -70" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="3" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

/* ---------------- Arrow (up-right) ---------------- */
function Arrow3D({ size = 130 }) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <Face id="arr-face" />
        <Rim id="arr-rim" />
        <Warm id="arr-warm" />
      </defs>
      <g>
        {/* Chunky bold arrow (like atlas) */}
        <path
          d="M -55 55 L 20 -20 L 20 30 L 55 30 L 55 -55 L -30 -55 L -30 -20 L 20 -20"
          transform="rotate(-30)"
          fill="url(#arr-face)"
          stroke="url(#arr-rim)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Rim light on the top-right */}
        <path
          d="M 55 -55 L -30 -55"
          transform="rotate(-30)"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.14"
          strokeWidth="3"
        />
        <path
          d="M -55 55 L 20 -20"
          transform="rotate(-30)"
          fill="none"
          stroke="url(#arr-warm)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}

/* ---------------- Lightning bolt ---------------- */
function Bolt3D({ size = 130 }) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <Face id="bolt-face" />
        <Rim id="bolt-rim" />
        <Warm id="bolt-warm" />
      </defs>
      <g>
        <path
          d="M 10 -75 L -35 5 L -5 5 L -20 75 L 35 -10 L 5 -10 L 10 -75 Z"
          fill="url(#bolt-face)"
          stroke="url(#bolt-rim)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Warm rim glow on the underside */}
        <path
          d="M -35 5 L -5 5 L -20 75 L 35 -10"
          fill="none"
          stroke="url(#bolt-warm)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* White edge highlight on top face */}
        <path d="M 10 -75 L -35 5" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

/* ---------------- Diamond / sparkle ---------------- */
function Diamond3D({ size = 130 }) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <Face id="dia-face" />
        <Rim id="dia-rim" />
        <Warm id="dia-warm" />
      </defs>
      <g>
        <path d="M 0 -70 L 60 0 L 0 70 L -60 0 Z"
              fill="url(#dia-face)"
              stroke="url(#dia-rim)"
              strokeWidth="2.5"
              strokeLinejoin="round"/>
        {/* Inner facets to add faceted 3D feel */}
        <path d="M 0 -70 L 0 70" stroke="url(#dia-rim)" strokeOpacity="0.35" strokeWidth="1"/>
        <path d="M -60 0 L 60 0" stroke="url(#dia-rim)" strokeOpacity="0.25" strokeWidth="1"/>
        <path d="M 0 -70 L -60 0 L 0 0 Z" fill="#ffffff" fillOpacity="0.06"/>
        <path d="M 0 70 L -60 0 L 0 0 Z" fill="url(#dia-warm)" opacity="0.5"/>
      </g>
    </svg>
  )
}

/* ---------------- Graduation cap ---------------- */
function GradCap3D({ size = 130 }) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <Face id="cap-face" />
        <Rim id="cap-rim" />
        <Warm id="cap-warm" />
      </defs>
      <g transform="translate(0 -6)">
        {/* Mortarboard top (rotated diamond) */}
        <path d="M 0 -50 L 78 -18 L 0 14 L -78 -18 Z"
              fill="url(#cap-face)" stroke="url(#cap-rim)" strokeWidth="2.5" strokeLinejoin="round"/>
        {/* Cap body */}
        <path d="M -46 -4 L -46 30 C -46 46 46 46 46 30 L 46 -4"
              fill="url(#cap-face)" stroke="url(#cap-rim)" strokeWidth="2.5"/>
        {/* Underside warm rim */}
        <path d="M -46 30 C -46 46 46 46 46 30" fill="none" stroke="url(#cap-warm)" strokeWidth="4" opacity="0.7"/>
        {/* Highlight on top mortarboard */}
        <path d="M 0 -50 L 78 -18" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="2"/>
        {/* Gold tassel */}
        <circle cx="40" cy="-4" r="4" fill="url(#cap-rim)"/>
        <path d="M 40 -4 L 60 44" stroke="url(#cap-rim)" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
        <circle cx="60" cy="46" r="5" fill="url(#cap-rim)"/>
      </g>
    </svg>
  )
}

/* ---------------- Placement + animation ---------------- */
// Each entry: which shape, absolute position around hero, animation phase.
// Positions use inset percentages so it stays responsive around the H1.
// pointer-events-none: purely decorative, never blocks clicks.
const OBJECTS = [
  // 4 corner objects — sit fully outside the H1 text
  { key: 'star',    Shape: Star3D,    className: 'top-[2%]  left-[2%]  md:left-[4%]  lg:left-[6%]',   size: 120, dur: 7,   delay: 0,   spin: -14 },
  { key: 'check',   Shape: Check3D,   className: 'top-[0%]  right-[2%] md:right-[4%] lg:right-[6%]',  size: 140, dur: 8,   delay: 0.8, spin:  18 },
  { key: 'grad',    Shape: GradCap3D, className: 'bottom-[2%] left-[1%] md:left-[3%] lg:left-[5%]',   size: 140, dur: 9,   delay: 1.5, spin: -12 },
  { key: 'bolt',    Shape: Bolt3D,    className: 'bottom-[3%] right-[1%] md:right-[3%] lg:right-[5%]',size: 130, dur: 8.5, delay: 0.4, spin:  12 },
  // Optional mid-side accents (hidden on smaller screens to prevent overlap)
  { key: 'arrow',   Shape: Arrow3D,   className: 'top-[42%] left-[-3%] lg:left-[1%] hidden xl:block', size: 90,  dur: 10,  delay: 2.2, spin:  -8 },
  { key: 'diamond', Shape: Diamond3D, className: 'top-[44%] right-[-2%] lg:right-[1%] hidden xl:block', size: 90, dur: 9.5, delay: 1.1, spin:   8 },
]

function Floater({ Shape, size, dur, delay, spin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -spin }}
      animate={{
        opacity: 1,
        y: [0, -14, 0, 12, 0],
        rotate: [-spin, spin, -spin],
      }}
      transition={{
        opacity: { duration: 0.9, delay },
        y:       { duration: dur,   delay, repeat: Infinity, ease: 'easeInOut' },
        rotate:  { duration: dur*1.6, delay, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="will-change-transform drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)]"
    >
      <Shape size={size} />
    </motion.div>
  )
}

export default function Hero3DObjects() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
      {OBJECTS.map(o => (
        <div key={o.key} className={`absolute ${o.className}`}>
          <Floater Shape={o.Shape} size={o.size} dur={o.dur} delay={o.delay} spin={o.spin}/>
        </div>
      ))}
    </div>
  )
}
