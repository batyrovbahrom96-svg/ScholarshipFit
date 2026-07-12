'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { store } from '@/lib/client-store'
import { LOGO_DATA_URI } from '@/components/site/logo-data'
import { track } from '@/lib/analytics'
import {
  Send, Sparkles, Info, ShieldCheck, MessagesSquare, Compass, Scale, Lightbulb,
  Target, Plus, RotateCcw, Copy, Check, ArrowRight,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

// ---------------------------------------------------------------------------
// Prompt starter categories — a proper "AI command center" for scholarship intent.
// Everything is grounded in the source-linked DB by the backend system prompt.
// ---------------------------------------------------------------------------
const PROMPT_CATEGORIES = [
  {
    key: 'discover',
    icon: Compass,
    label: 'Discover matches',
    tint: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
    prompts: [
      'I want full funding in Germany for a Master in engineering with IELTS 7.0 and GPA 3.7.',
      "What scholarships fit a Master in Computer Science for a Nigerian student, budget $2000/yr?",
      "I'm from India applying for a PhD in Machine Learning — which fully-funded programs fit best?",
      "Show me MBA scholarships in Europe for a Latin American applicant with 4 years of work experience.",
    ],
  },
  {
    key: 'compare',
    icon: Scale,
    label: 'Compare programs',
    tint: 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10',
    prompts: [
      'Compare Stipendium Hungaricum vs Türkiye Scholarships for a Bachelor in Economics.',
      'Chevening vs Commonwealth Master\u2019s — which fits a Kenyan software engineer better?',
      'DAAD EPOS vs KAAD — which is easier to win for a public-health Master applicant?',
      'Fulbright vs Gates Cambridge — which one is realistic for a 3.8 GPA Bangladeshi student?',
    ],
  },
  {
    key: 'understand',
    icon: Lightbulb,
    label: 'Understand a scholarship',
    tint: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
    prompts: [
      'What does "fully funded" actually cover for DAAD EPOS?',
      'Explain eligibility for the Vanier Canada Graduate Scholarships in simple terms.',
      'Is IELTS mandatory for Stipendium Hungaricum? What alternatives are accepted?',
      'What are common reasons applicants get rejected from KAUST Fellowships?',
    ],
  },
  {
    key: 'improve',
    icon: Target,
    label: 'Improve your odds',
    tint: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    prompts: [
      'Which of my likely matches have the LOWEST application-waste risk?',
      'What one skill should I build in the next 6 months to unlock more scholarships?',
      "I have GPA 3.4 — which strong scholarships still consider me?",
      'How do I write a motivation letter that stands out for a Commonwealth Master\u2019s?',
    ],
  },
]

// Follow-up chip prompts shown under each Nova reply
const FOLLOWUPS = [
  'Which of these has the earliest deadline?',
  'Compare the top 2 for a first-time applicant.',
  'What documents do I need for the strongest match?',
  'Give me one honest reason NOT to apply to each.',
]

function Md({ text }) {
  // Very light Markdown: **bold**, [link](url), lists, newlines
  const html = (text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a target="_blank" rel="noopener noreferrer" class="text-[#D4AF37] underline underline-offset-2 hover:text-[#F5D67B]" href="$2">$1</a>')
    .replace(/(^|\n)-\s(.+)/g, '$1<li>$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
  return <div className="prose prose-invert max-w-none text-white [&_li]:list-disc [&_li]:ml-5 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
}

function Advisor() {
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeCat, setActiveCat] = useState('discover')
  const [copiedId, setCopiedId] = useState('')
  const [usage, setUsage] = useState(null)
  const [gate, setGate] = useState(null) // { require: 'signup' | 'paywall', message }
  const scrollRef = useRef(null)

  const refreshUsage = async () => {
    try {
      const r = await fetch('/api/advisor/usage', { credentials: 'include' })
      const d = await r.json()
      setUsage(d)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    let s = store.getAdvisorSession()
    if (!s) { s = uuidv4(); store.setAdvisorSession(s) }
    setSessionId(s)
    fetch(`/api/advisor/history?session_id=${s}`).then(r => r.json()).then(d => {
      if (d.messages?.length) setMessages(d.messages)
    })
    refreshUsage()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || busy) return
    // Client-side pre-block if we already know limit is hit
    if (usage && !usage.unlimited && usage.remaining === 0) {
      setGate({
        require: usage.signed_in ? 'paywall' : 'signup',
        message: usage.signed_in
          ? `You\u2019ve used all ${usage.daily_limit} of your free daily Nova replies. Reserve founder pricing to unlock unlimited AI advising.`
          : `You\u2019ve used all ${usage.daily_limit} anonymous replies today. Create a free account for 10/day, or reserve founder pricing for unlimited.`,
      })
      return
    }
    setInput('')
    setMessages(m => [...m, { role: 'user', content: msg, id: 'tmp-' + Date.now() }])
    setBusy(true)
    try { track.advisorMessage({ session_id: sessionId, message_length: msg.length }) } catch { /* ignore */ }
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId, message: msg })
      })
      const d = await res.json()
      if (res.status === 429) {
        setGate({ require: d.require || 'signup', message: d.message || 'Rate limit reached.' })
        // Roll back the optimistic user message
        setMessages(m => m.filter(x => !x.id?.startsWith('tmp-')))
      } else if (d.reply) {
        setMessages(m => [...m, { role: 'assistant', content: d.reply, id: 'a-' + Date.now(), verification: d.verification || null }])
        if (d.usage) setUsage(u => ({ ...(u || {}), ...d.usage, signed_in: u?.signed_in }))
      } else {
        setMessages(m => [...m, { role: 'assistant', content: '_Sorry, I could not respond right now. Please try again._', id: 'e-' + Date.now() }])
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: '_Network error._ ' + String(e.message), id: 'e-' + Date.now() }])
    } finally { setBusy(false) }
  }

  const newChat = () => {
    const s = uuidv4()
    store.setAdvisorSession(s)
    setSessionId(s)
    setMessages([])
    setInput('')
  }

  const copyMessage = (id, content) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content || '').then(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId(''), 1500)
      }).catch(() => {})
    }
  }

  const activeCategory = useMemo(
    () => PROMPT_CATEGORIES.find(c => c.key === activeCat) || PROMPT_CATEGORIES[0],
    [activeCat],
  )
  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'assistant') return messages[i].id
    return null
  }, [messages])

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.12),transparent_70%)]"/>

        <div className="container mx-auto max-w-6xl px-4 py-10 relative">
          {/* Command header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">
                <Sparkles className="mr-1 h-3 w-3"/>Nova · Claude Sonnet 4.5 · Grounded in 800+ hand-verified records
              </Badge>
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white tracking-tight">
                AI Scholarship Command
              </h1>
              <p className="mt-2 text-white/60 max-w-2xl">
                Ask Nova anything about scholarships in plain language. She references ONLY our source-linked database — no invented programs, no random deadlines.
              </p>
            </div>
            {/* Brand chip — replaces the old Nova astronaut avatar with the actual
               ScholarshipFit wordmark. Rounded rectangle so the horizontal
               wordmark reads clearly, with subtle gold glow to match the aesthetic. */}
            <div className="relative shrink-0 rounded-2xl border border-[#D4AF37]/25 bg-black/50 px-4 py-3 backdrop-blur-sm"
                 style={{ boxShadow: '0 8px 30px -12px rgba(212,175,55,0.25)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_DATA_URI}
                alt="Scholarshipfit.com"
                width={800}
                height={166}
                className="h-8 md:h-9 w-auto object-contain"
                draggable={false}
              />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#05070d]" title="Nova is online"/>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* Sidebar — prompt categories + controls */}
            <aside className="lg:col-span-4">
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-widest text-white/50">Prompt library</div>
                    <button
                      onClick={newChat}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/70 hover:text-white hover:border-white/25"
                    >
                      <Plus className="h-3 w-3"/>New chat
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-1">
                    {PROMPT_CATEGORIES.map(c => {
                      const Icon = c.icon
                      const active = activeCat === c.key
                      return (
                        <button
                          key={c.key}
                          onClick={() => setActiveCat(c.key)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition
                            ${active
                              ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-white'
                              : 'border-transparent text-white/70 hover:bg-white/[0.04] hover:text-white'}`}
                        >
                          <Icon className={`h-4 w-4 ${active ? 'text-[#D4AF37]' : 'text-white/50'}`}/>
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 border-white/10 bg-white/[0.03]">
                <CardContent className="p-4">
                  <div className="text-[11px] uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                    <activeCategory.icon className="h-3.5 w-3.5 text-[#D4AF37]"/>
                    {activeCategory.label}
                  </div>
                  <div className="space-y-2">
                    {activeCategory.prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => send(p)}
                        disabled={busy}
                        className={`group w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-all
                          ${activeCategory.tint} hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="line-clamp-3">{p}</span>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] opacity-70">
                          Ask Nova <ArrowRight className="h-3 w-3"/>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 border-white/10 bg-white/[0.02]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/50">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]"/>Nova&apos;s guardrails
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-white/60">
                    <li>Only cites scholarships in our source-linked library</li>
                    <li>Never invents deadlines, GPA thresholds, or funding numbers</li>
                    <li>Links every recommendation to its official source URL</li>
                    <li>Refuses to guarantee admission, visas, or funding</li>
                  </ul>
                </CardContent>
              </Card>
            </aside>

            {/* Main chat panel */}
            <div className="lg:col-span-8">
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-0">
                  <div ref={scrollRef} className="max-h-[62vh] min-h-[420px] overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-10">
                        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
                          <MessagesSquare className="h-6 w-6 text-[#D4AF37]"/>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-white">Start a conversation with Nova</h3>
                        <p className="mt-1 text-sm text-white/60 max-w-md mx-auto">
                          Pick a starter from the left, or type your own question below. Nova will only cite real, source-linked scholarships.
                        </p>
                      </div>
                    )}

                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm relative group
                          ${m.role === 'user'
                            ? 'bg-[#D4AF37] text-black'
                            : 'bg-white/[0.05] border border-white/10 text-white'}`}>
                          {m.role === 'assistant' && (
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Nova</p>
                              <button
                                onClick={() => copyMessage(m.id, m.content)}
                                className="opacity-0 group-hover:opacity-100 transition text-[11px] text-white/50 hover:text-white inline-flex items-center gap-1"
                              >
                                {copiedId === m.id ? <><Check className="h-3 w-3"/>Copied</> : <><Copy className="h-3 w-3"/>Copy</>}
                              </button>
                            </div>
                          )}
                          {m.role === 'user' ? <p>{m.content}</p> : <Md text={m.content}/>}
                          {m.role === 'assistant' && m.verification && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              {m.verification.confidence === 'high' && m.verification.verified_scholarships?.length > 0 && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-emerald-300">
                                  <ShieldCheck className="h-3 w-3"/>
                                  Verified · {m.verification.verified_scholarships.length} in database
                                </div>
                              )}
                              {m.verification.confidence === 'low' && (
                                <div className="inline-flex items-start gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-100">
                                  <Info className="mt-0.5 h-3 w-3 shrink-0"/>
                                  <span>
                                    <span className="uppercase tracking-widest text-[10px] font-semibold">Unverified mention</span><br/>
                                    Nova mentioned {m.verification.unverified_flags.map(f => `\u201C${f}\u201D`).join(', ')} — {m.verification.unverified_flags.length > 1 ? 'these are not' : 'this is not'} in our verified DB. Treat as unverified until you check the official source.
                                  </span>
                                </div>
                              )}
                              {m.verification.confidence === 'medium' && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/50">
                                  <Info className="h-3 w-3"/>
                                  General advice · no scholarships cited
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Follow-up chips shown after the last assistant reply */}
                    {!busy && messages.length > 0 && lastAssistantId && messages[messages.length - 1]?.role === 'assistant' && (
                      <div className="pt-1">
                        <div className="mb-2 text-[11px] uppercase tracking-widest text-white/40">Suggested follow-ups</div>
                        <div className="flex flex-wrap gap-2">
                          {FOLLOWUPS.map((f, i) => (
                            <button
                              key={i}
                              onClick={() => send(f)}
                              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:text-white hover:border-white/30"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {busy && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-3 text-sm bg-white/[0.05] border border-white/10 text-white">
                          <p className="mb-1 text-[11px] uppercase tracking-widest text-[#D4AF37]">Nova is thinking…</p>
                          <span className="inline-flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce"/>
                            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: '0.1s' }}/>
                            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: '0.2s' }}/>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={e => { e.preventDefault(); send() }} className="border-t border-white/10 p-3 flex items-center gap-2">
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={newChat}
                        title="New chat"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/25"
                      >
                        <RotateCcw className="h-4 w-4"/>
                      </button>
                    )}
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask Nova anything about scholarships…"
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
                    />
                    <Button type="submit" disabled={busy || !input.trim()} className="btn-gold btn-pill font-medium">
                      <Send className="h-4 w-4"/>
                    </Button>
                  </form>

                  {/* Free-tier usage counter — shown to non-paying users. */}
                  {usage && !usage.unlimited && (
                    <div className={`border-t border-white/5 px-4 py-2.5 text-[11px] flex items-center justify-between gap-3 ${
                      usage.remaining === 0 ? 'bg-red-500/5 text-red-200' :
                      usage.remaining === 1 ? 'bg-amber-500/5 text-amber-200' :
                      'bg-white/[0.02] text-white/50'
                    }`}>
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3"/>
                        {usage.remaining === 0
                          ? `Daily Nova limit reached (${usage.daily_limit}/${usage.daily_limit} used)`
                          : `${usage.remaining} of ${usage.daily_limit} free Nova ${usage.daily_limit === 1 ? 'reply' : 'replies'} left today`}
                        {!usage.signed_in && usage.remaining > 0 && (
                          <span className="opacity-60"> · sign up for 10/day</span>
                        )}
                      </span>
                      <Link href="/pricing" className="text-[#D4AF37] hover:underline whitespace-nowrap">
                        Unlock unlimited →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
                <p className="flex items-start gap-1.5 text-xs text-white/40 max-w-xl">
                  <Info className="mt-0.5 h-3 w-3"/>
                  ScholarshipFit provides informational scholarship research only. It does not guarantee admission, scholarships, visas, or funding. Users apply directly through official provider websites.
                </p>
                <Link href="/quiz" className="text-xs text-[#D4AF37] hover:text-[#F5D67B] inline-flex items-center gap-1">
                  Prefer a structured shortlist? Take the 8-step quiz <ArrowRight className="h-3 w-3"/>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Rate-limit gate modal — appears when free-tier daily limit hit */}
      {gate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setGate(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#D4AF37]/30 bg-black p-6 md:p-7"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 40px 80px -20px rgba(212,175,55,0.35)' }}
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[#D4AF37]"/>
            </div>
            <h3 className="mt-4 text-center text-xl font-semibold text-white">
              {gate.require === 'paywall' ? 'Ready for unlimited Nova?' : 'One quick step'}
            </h3>
            <p className="mt-2 text-center text-sm text-white/70 leading-relaxed">{gate.message}</p>
            <div className="mt-5 grid gap-2">
              {gate.require === 'signup' ? (
                <>
                  <Link href="/signup?next=/advisor">
                    <Button className="w-full h-11 btn-gold btn-pill font-semibold">Create free account · 10 replies/day</Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full h-11 border-white/15 bg-transparent text-white hover:bg-white/5">Reserve founder pricing · unlimited</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/pricing">
                    <Button className="w-full h-11 btn-gold btn-pill font-semibold">Reserve founder pricing · unlimited Nova</Button>
                  </Link>
                  <button onClick={() => setGate(null)} className="text-xs text-white/50 hover:text-white mt-1">Maybe tomorrow — I&apos;ll come back</button>
                </>
              )}
            </div>
            <button
              onClick={() => setGate(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 inline-flex items-center justify-center"
              aria-label="Close"
            >✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Advisor
