'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, GraduationCap, Bot, Kanban, CheckCircle2, Trophy,
  ArrowRight, MousePointer2, MessageCircle, Calendar, Flame, ShieldCheck,
  Search, Bell, Home, LayoutGrid, BookOpen, Star, ChevronRight
} from 'lucide-react'

/*
  ================================================================
  ProductDemoPreview — Notion-style animated product tour
  ----------------------------------------------------------------
  A 4-scene auto-cycling animated preview shown on the landing page.
  Scenes:
    1. Take the 8-step Quiz
    2. See ranked matches with fit scores
    3. Chat with Nova AI advisor
    4. Track applications (Kanban)

  Every ~6s the scene advances. User can click a tab to jump.
  Uses framer-motion for smooth transitions.
  ================================================================
*/

const SCENES = [
  { key: 'quiz',     label: 'Take the Quiz',       icon: GraduationCap },
  { key: 'matches',  label: 'See Ranked Matches',  icon: Trophy },
  { key: 'nova',     label: 'Chat with Nova AI',   icon: Bot },
  { key: 'tracker',  label: 'Track Applications',  icon: Kanban },
]

const AUTO_ADVANCE_MS = 6500

export default function ProductDemoPreview() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  // Auto-advance timer
  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(() => {
      setActive((v) => (v + 1) % SCENES.length)
    }, AUTO_ADVANCE_MS)
    return () => clearTimeout(timerRef.current)
  }, [active, paused])

  const currentScene = SCENES[active].key

  return (
    <section className="relative border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">See it in action</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
            From <span className="text-white/40 line-through">endless Googling</span> to{' '}
            <span className="text-gold-hi">ranked shortlist</span> in 3 minutes.
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            A live preview of the ScholarshipFit command center. Every scene is a real feature — take the quiz, see your ranked matches, chat with Nova, track applications.
          </p>
        </div>

        {/* Scene tabs */}
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {SCENES.map((s, i) => {
              const isActive = i === active
              const Icon = s.icon
              return (
                <button
                  key={s.key}
                  onClick={() => { setActive(i); setPaused(false) }}
                  className={`group relative inline-flex items-center gap-2 rounded-full border px-3.5 md:px-4 py-1.5 md:py-2 text-[12px] md:text-[13px] font-medium transition-all
                    ${isActive
                      ? 'border-[#D4AF37]/60 bg-[#D4AF37]/12 text-[#F0D77A] shadow-[0_0_0_1px_rgba(212,175,55,0.15)]'
                      : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white/90 hover:border-white/20'}`}
                >
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold
                    ${isActive ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/60'}`}>
                    {i + 1}
                  </span>
                  <Icon className="h-3.5 w-3.5"/>
                  <span>{s.label}</span>
                  {/* progress bar under active */}
                  {isActive && !paused && (
                    <motion.span
                      key={`bar-${active}`}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                      className="absolute left-2 right-2 -bottom-1 h-[2px] rounded-full bg-[#D4AF37]/70"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview frame */}
        <div
          className="mt-10 relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#0B0F14] to-[#05070A] shadow-2xl overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70"/>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70"/>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70"/>
            </div>
            <div className="ml-3 hidden md:flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/40">
              <ShieldCheck className="h-3 w-3 text-emerald-400"/>
              scholarshipfit.com<span className="text-white/20">/dashboard</span>
            </div>
            <div className="ml-auto flex items-center gap-3 text-white/40">
              <Search className="h-3.5 w-3.5"/>
              <Bell className="h-3.5 w-3.5"/>
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-700"/>
            </div>
          </div>

          {/* App body: sidebar + main panel */}
          <div className="grid grid-cols-12 min-h-[430px] md:min-h-[520px]">
            {/* Sidebar */}
            <aside className="hidden md:flex col-span-3 flex-col gap-1 border-r border-white/5 bg-white/[0.015] p-4 text-sm">
              <div className="flex items-center gap-2 px-2 pb-3 border-b border-white/5 mb-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#D4AF37] to-amber-700 grid place-items-center">
                  <GraduationCap className="h-3.5 w-3.5 text-black"/>
                </div>
                <div className="text-white font-medium">ScholarshipFit</div>
              </div>

              {[
                { icon: Home,       label: 'Dashboard',   key: null },
                { icon: LayoutGrid, label: 'Match Quiz',  key: 'quiz' },
                { icon: Trophy,     label: 'My Matches',  key: 'matches' },
                { icon: Bot,        label: 'Nova AI',     key: 'nova' },
                { icon: Kanban,     label: 'Tracker',     key: 'tracker' },
                { icon: Calendar,   label: 'Deadlines',   key: null },
                { icon: BookOpen,   label: 'Cabinet',     key: null },
              ].map((item) => {
                const highlight = item.key && item.key === currentScene
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors
                      ${highlight
                        ? 'bg-[#D4AF37]/12 text-white ring-1 ring-[#D4AF37]/25'
                        : 'text-white/60'}`}
                  >
                    <Icon className={`h-4 w-4 ${highlight ? 'text-[#D4AF37]' : 'text-white/40'}`}/>
                    <span className="text-[13px]">{item.label}</span>
                    {highlight && (
                      <motion.span
                        layoutId="sidebar-dot"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
                      />
                    )}
                  </div>
                )
              })}

              <div className="mt-auto rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-3">
                <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Founder pricing</div>
                <div className="mt-1 text-[12px] text-white/70 leading-relaxed">Lock in $7.42/mo forever — 68% off after launch.</div>
              </div>
            </aside>

            {/* Main panel */}
            <main className="col-span-12 md:col-span-9 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {currentScene === 'quiz'    && <SceneQuiz    key="quiz"    />}
                {currentScene === 'matches' && <SceneMatches key="matches" />}
                {currentScene === 'nova'    && <SceneNova    key="nova"    />}
                {currentScene === 'tracker' && <SceneTracker key="tracker" />}
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-white/40">
          Hover to pause · Click a tab to jump · Auto-advances every 6.5s
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Scene 1 — Quiz
   ============================================================ */
function SceneQuiz() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45 }}
      className="relative p-5 md:p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Match Quiz · Step 4 of 8</div>
          <h3 className="mt-1 text-xl md:text-2xl font-semibold text-white">Where would you like to study?</h3>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]"/> AI-assisted profile capture
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: '38%' }}
          animate={{ width: '50%' }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-400"
        />
      </div>

      {/* Country pills */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {['🇺🇸 United States', '🇬🇧 United Kingdom', '🇨🇦 Canada', '🇩🇪 Germany', '🇦🇺 Australia', '🇳🇱 Netherlands', '🇸🇬 Singapore', '🇯🇵 Japan', '🇫🇷 France'].map((c, i) => {
          const active = [0, 1, 3].includes(i) // pre-selected countries for the animation
          return (
            <motion.div
              key={c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors
                ${active
                  ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/70'}`}
            >
              <span>{c}</span>
              {active && <CheckCircle2 className="h-4 w-4 text-emerald-400"/>}
            </motion.div>
          )
        })}
      </div>

      {/* Bottom bar */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs text-white/50">3 countries selected · takes ~30 sec/step</div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-4 py-1.5 text-xs font-semibold text-black">
          Next <ArrowRight className="h-3.5 w-3.5"/>
        </div>
      </div>

      {/* Animated cursor pointing to "Germany" */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: 40 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="pointer-events-none absolute left-[38%] top-[62%] text-white"
      >
        <MousePointer2 className="h-5 w-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" fill="white"/>
      </motion.div>

      {/* Floating callout */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="hidden md:flex absolute right-6 top-16 items-start gap-2 rounded-xl border border-[#D4AF37]/30 bg-black/80 backdrop-blur px-3 py-2 shadow-2xl max-w-[220px]"
      >
        <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[#D4AF37]/20">
          <Sparkles className="h-3 w-3 text-[#D4AF37]"/>
        </div>
        <div>
          <div className="text-[11px] font-medium text-white">Multi-select fine</div>
          <div className="text-[11px] text-white/60">More countries → more matches</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
   Scene 2 — Matches
   ============================================================ */
function SceneMatches() {
  const matches = [
    { title: 'Chevening Scholarship',  country: '🇬🇧 UK',      fit: 92, funding: 'Fully funded', tag: 'Strong fit', tone: 'emerald' },
    { title: 'DAAD EPOS Master\'s',    country: '🇩🇪 Germany', fit: 84, funding: '€934/mo stipend',  tag: 'Strong fit', tone: 'emerald' },
    { title: 'Fulbright Foreign Student', country: '🇺🇸 USA',  fit: 71, funding: 'Fully funded', tag: 'Possible fit', tone: 'amber' },
    { title: 'Commonwealth Master\'s', country: '🇬🇧 UK',      fit: 68, funding: 'Fully funded', tag: 'Possible fit', tone: 'amber' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45 }}
      className="relative p-5 md:p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Your matches · Ranked by fit</div>
          <h3 className="mt-1 text-xl md:text-2xl font-semibold text-white">42 matches from 800 hand-verified scholarships</h3>
        </div>
        <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
          <Flame className="h-3 w-3"/> 12 close deadlines
        </div>
      </div>

      <div className="grid gap-3">
        {matches.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + i * 0.12 }}
            className="group relative rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-[#D4AF37]/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50">{m.country}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium
                    ${m.tone === 'emerald' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-amber-400/12 text-amber-300'}`}>
                    {m.tag}
                  </span>
                </div>
                <div className="mt-0.5 text-sm md:text-base font-medium text-white truncate">{m.title}</div>
                <div className="mt-0.5 text-[11px] text-white/45">{m.funding} · Source-linked</div>
              </div>

              {/* Fit score circle */}
              <div className="relative shrink-0">
                <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
                  <circle cx="20" cy="20" r="16" strokeWidth="4" stroke="rgba(255,255,255,0.08)" fill="none"/>
                  <motion.circle
                    cx="20" cy="20" r="16"
                    strokeWidth="4"
                    stroke={m.tone === 'emerald' ? '#34d399' : '#fbbf24'}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - m.fit / 100) }}
                    transition={{ duration: 1.1, delay: 0.25 + i * 0.12, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-white">{m.fit}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Callout */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="hidden md:flex absolute right-6 top-14 items-center gap-2 rounded-xl border border-white/15 bg-black/85 backdrop-blur px-3 py-2 shadow-2xl"
      >
        <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/20">
          <ShieldCheck className="h-3 w-3 text-emerald-300"/>
        </div>
        <div className="text-[11px] text-white">Every score is deterministic — <span className="text-white/60">no AI hallucinations</span></div>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
   Scene 3 — Nova AI
   ============================================================ */
function SceneNova() {
  const [typed, setTyped] = useState('')
  const target = 'What UK scholarships fit my profile?'
  useEffect(() => {
    let i = 0
    setTyped('')
    const iv = setInterval(() => {
      i += 1
      setTyped(target.slice(0, i))
      if (i >= target.length) clearInterval(iv)
    }, 40)
    return () => clearInterval(iv)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45 }}
      className="relative p-5 md:p-8 h-full flex flex-col"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400/30 to-[#D4AF37]/30 ring-1 ring-white/15">
            <Bot className="h-4 w-4 text-white"/>
          </div>
          <div>
            <div className="text-sm font-medium text-white">Nova · AI Advisor</div>
            <div className="text-[10px] text-white/50">Claude Sonnet 4.5 · Grounded in 800 hand-verified records</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/> Online
        </div>
      </div>

      {/* Chat body */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl rounded-br-md bg-[#D4AF37]/15 border border-[#D4AF37]/25 px-3.5 py-2 text-sm text-white">
            {typed}<span className="inline-block w-1 -mb-0.5 h-4 bg-white/70 animate-pulse ml-0.5"/>
          </div>
        </div>

        {/* Nova reply */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="flex items-start gap-2"
        >
          <div className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-white/10">
            <Bot className="h-3.5 w-3.5 text-cyan-300"/>
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/90 leading-relaxed">
            Based on your profile (Indian citizen, 2+ yrs work experience, IELTS 7.5), 3 UK scholarships fit you best:
            <ul className="mt-2 space-y-1.5 text-[13px]">
              <li className="flex items-start gap-2"><Trophy className="mt-0.5 h-3.5 w-3.5 text-[#D4AF37] shrink-0"/><span><b className="text-white">Chevening</b> — 92% fit · fully funded · deadline Nov 5</span></li>
              <li className="flex items-start gap-2"><Trophy className="mt-0.5 h-3.5 w-3.5 text-[#D4AF37] shrink-0"/><span><b className="text-white">Commonwealth Master&apos;s</b> — 68% fit · fully funded</span></li>
              <li className="flex items-start gap-2"><Trophy className="mt-0.5 h-3.5 w-3.5 text-[#D4AF37] shrink-0"/><span><b className="text-white">Rhodes</b> — borderline · needs 2 more academic refs</span></li>
            </ul>
            <div className="mt-2 text-[11px] text-white/50">Every claim cites the official provider URL — never invented.</div>
          </div>
        </motion.div>
      </div>

      {/* Input */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
        <MessageCircle className="h-4 w-4 text-white/40"/>
        <div className="flex-1 text-[13px] text-white/40">Ask Nova anything about scholarships…</div>
        <div className="grid h-7 w-7 place-items-center rounded-full bg-[#D4AF37] text-black">
          <ArrowRight className="h-3.5 w-3.5"/>
        </div>
      </div>
    </motion.div>
  )
}

/* ============================================================
   Scene 4 — Tracker (Kanban)
   ============================================================ */
function SceneTracker() {
  const cols = [
    { name: 'Saved',      tone: 'sky',     items: [
      { t: 'Chevening',        d: 'Nov 5',   badge: '92%' },
      { t: 'Rhodes',           d: 'Oct 1',   badge: '58%' },
    ]},
    { name: 'Preparing',  tone: 'amber',   items: [
      { t: 'DAAD EPOS',        d: 'Oct 31',  badge: '84%' },
      { t: 'Fulbright',        d: 'Oct 15',  badge: '71%' },
    ]},
    { name: 'Applied',    tone: 'violet',  items: [
      { t: 'Commonwealth',     d: 'Submitted', badge: '68%' },
    ]},
    { name: 'Shortlisted', tone: 'emerald', items: [
      { t: 'Erasmus Mundus',   d: 'Interview 12/2', badge: '77%' },
    ]},
  ]
  const toneMap = {
    sky:     'bg-sky-400/15 text-sky-300 border-sky-400/30',
    amber:   'bg-amber-400/15 text-amber-300 border-amber-400/30',
    violet:  'bg-violet-400/15 text-violet-300 border-violet-400/30',
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45 }}
      className="relative p-5 md:p-8"
    >
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Application Tracker · Kanban</div>
        <h3 className="mt-1 text-xl md:text-2xl font-semibold text-white">Where each scholarship stands, in one view.</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cols.map((c, ci) => (
          <div key={c.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneMap[c.tone]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current"/> {c.name}
              </span>
              <span className="text-[10px] text-white/40">{c.items.length}</span>
            </div>
            <div className="space-y-2">
              {c.items.map((it, i) => (
                <motion.div
                  key={it.t}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + (ci * 0.1) + (i * 0.08) }}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 hover:border-[#D4AF37]/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-medium text-white truncate">{it.t}</div>
                    <span className="text-[10px] font-semibold text-[#D4AF37]">{it.badge}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                    <Calendar className="h-3 w-3"/> {it.d}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Animated card being "dragged" — floating between columns */}
      <motion.div
        initial={{ opacity: 0, y: 0, x: -60 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-60, 0, 120, 120] }}
        transition={{ duration: 3.5, delay: 1.2, times: [0, 0.15, 0.7, 1] }}
        className="hidden md:flex absolute left-[45%] top-[60%] pointer-events-none items-center gap-2 rounded-lg border border-[#D4AF37]/40 bg-black/85 backdrop-blur px-2.5 py-1.5 shadow-2xl"
      >
        <MousePointer2 className="h-3.5 w-3.5 text-white" fill="white"/>
        <span className="text-[11px] text-white">Drag Chevening → Preparing</span>
      </motion.div>
    </motion.div>
  )
}
