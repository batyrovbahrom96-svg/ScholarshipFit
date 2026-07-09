'use client'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2, AlertTriangle, TrendingUp, Sparkles, Loader2, ShieldCheck, Zap,
  XCircle, HelpCircle, FileText, Upload, Trash2, ClipboardPaste, FileCheck2,
} from 'lucide-react'
import { store } from '@/lib/client-store'

/* ================================================================
   Application Readiness Score — with optional Document Upload
   Two stages:
     1) PREP: user optionally uploads transcript & essay (PDF/DOCX/TXT
        or pastes text). Files parsed via /api/readiness/parse.
     2) ANALYSIS: /api/readiness is called with the extracted texts,
        Claude weights them heavily in the scoring.
   ================================================================ */

const BUCKETS = {
  'Strong':      { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  label: 'Strong candidate' },
  'Competitive': { color: '#D4AF37', bg: 'rgba(212,175,55,0.15)', label: 'Competitive' },
  'Reach':       { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Reach — needs work' },
  'Long-shot':   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  label: 'Long-shot — high effort' },
}
const ELIG_ICON = {
  'Eligible':               <CheckCircle2 className="h-4 w-4 text-emerald-400"/>,
  'Likely eligible':        <CheckCircle2 className="h-4 w-4 text-[#D4AF37]"/>,
  'Ineligible':             <XCircle className="h-4 w-4 text-red-400"/>,
  'Unclear from source':    <HelpCircle className="h-4 w-4 text-white/50"/>,
}
const WASTE_STYLE = {
  Low:    { color: '#22c55e', label: '🟢 Low effort waste' },
  Medium: { color: '#D4AF37', label: '🟡 Some effort risk' },
  High:   { color: '#ef4444', label: '🔴 High effort risk' },
}

function Ring({ score = 0, color = '#D4AF37' }) {
  const R = 44
  const C = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(100, score)) / 100
  const dash = C * pct
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5D67B"/>
          <stop offset="1" stopColor={color}/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none"/>
      <circle
        cx="50" cy="50" r={R}
        stroke="url(#ring-grad)" strokeWidth="8" fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="52" textAnchor="middle" dominantBaseline="middle"
            fontSize="26" fontWeight="600" fill="#ffffff">{score}</text>
      <text x="50" y="72" textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="rgba(255,255,255,0.55)" letterSpacing="1.5">/ 100</text>
    </svg>
  )
}

/* ---------- Pill trigger (used on scholarship cards) ---------- */
export function ReadinessPill({ scholarshipId, scholarshipName }) {
  const [open, setOpen] = useState(false)
  const profile = typeof window !== 'undefined' ? store.getProfile() : null
  const eligible = !!(profile && profile.degree_level && profile.intended_major)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={eligible ? 'Get your readiness score for this scholarship' : 'Build your profile first — takes 2 minutes'}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/20 transition"
      >
        <TrendingUp className="h-3.5 w-3.5"/>
        {eligible ? 'Am I ready?' : 'Score me'}
      </button>
      <ReadinessDialog open={open} onClose={() => setOpen(false)} scholarshipId={scholarshipId} scholarshipName={scholarshipName}/>
    </>
  )
}

/* ---------- Document slot: upload OR paste ---------- */
function DocSlot({ title, subtitle, kind, value, onChange, savedToCabinet, onSaveToggle, canSave }) {
  // value = { source: 'upload' | 'paste' | 'cabinet' | 'none', filename?, text }
  const inputRef = useRef(null)
  const [parsing, setParsing] = useState(false)
  const [err, setErr] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [tab, setTab] = useState(value?.source === 'paste' ? 'paste' : 'upload')

  const handleFile = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setErr('File too large (max 10 MB)'); return }
    const ok = /\.(pdf|docx|txt)$/i.test(file.name)
    if (!ok) { setErr('Only PDF, DOCX, or TXT files are supported'); return }
    setParsing(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/readiness/parse', { method: 'POST', body: fd })
      const ct = r.headers.get('content-type') || ''
      if (!ct.includes('application/json')) throw new Error('Parser service is warming up — try again.')
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Parsing failed')
      onChange({ source: 'upload', filename: j.filename, text: j.text, chars: j.chars, truncated: j.truncated })
    } catch (e) {
      setErr(e.message || 'Failed to read file')
    } finally {
      setParsing(false)
    }
  }

  const clear = () => { onChange({ source: 'none', text: '' }); setErr('') }
  const fromCabinet = value?.source === 'cabinet'

  const hasContent = value?.text && value.text.length > 0

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#D4AF37]"/>{title}
          </h4>
          <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
        </div>
        {hasContent && (
          <button
            onClick={clear}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-red-300 transition"
            title="Remove"
          >
            <Trash2 className="h-3 w-3"/> Remove
          </button>
        )}
      </div>

      {hasContent ? (
        <>
          <div className={`mt-3 rounded-lg border p-3 ${fromCabinet ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.06]' : 'border-emerald-500/25 bg-emerald-500/[0.06]'}`}>
            <div className="flex items-center gap-2 text-sm text-white">
              <FileCheck2 className={`h-4 w-4 ${fromCabinet ? 'text-[#D4AF37]' : 'text-emerald-400'}`}/>
              <span className="font-medium truncate">{value.filename || 'Pasted text'}</span>
              {fromCabinet && <span className="ml-auto text-[10px] uppercase tracking-wider text-[#D4AF37]/80">from cabinet</span>}
            </div>
            <p className="mt-1 text-[11px] text-white/55">
              {value.chars ? value.chars.toLocaleString() : value.text.length.toLocaleString()} characters extracted
              {value.truncated && ' · truncated to 60,000 for analysis'}
            </p>
          </div>
          {canSave && !fromCabinet && (
            <label className="mt-2 flex items-center gap-2 text-[11px] text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!savedToCabinet}
                onChange={(e) => onSaveToggle?.(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#D4AF37]"
              />
              Save to My Cabinet so I don&apos;t have to re-upload for other scholarships
            </label>
          )}
        </>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="mt-3">
          <TabsList className="bg-white/[0.04] border border-white/10">
            <TabsTrigger value="upload" className="data-[state=active]:bg-[#D4AF37]/15 data-[state=active]:text-[#D4AF37] text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5"/>Upload file
            </TabsTrigger>
            <TabsTrigger value="paste" className="data-[state=active]:bg-[#D4AF37]/15 data-[state=active]:text-[#D4AF37] text-xs">
              <ClipboardPaste className="h-3.5 w-3.5 mr-1.5"/>Paste text
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-3">
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer?.files?.[0]
                if (f) handleFile(f)
              }}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition
                ${dragOver ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/15 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.04]'}`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {parsing ? (
                <>
                  <Loader2 className="h-6 w-6 text-[#D4AF37] animate-spin"/>
                  <p className="text-xs text-white/60">Extracting text…</p>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-white/50"/>
                  <p className="text-sm text-white/85">Drop your {kind} here, or click to browse</p>
                  <p className="text-[11px] text-white/45">PDF · DOCX · TXT · up to 10 MB</p>
                </>
              )}
            </label>
          </TabsContent>
          <TabsContent value="paste" className="mt-3">
            <Textarea
              rows={6}
              placeholder={`Paste your ${kind} text here…`}
              className="bg-white/[0.03] border-white/10 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#D4AF37]/50"
              onBlur={(e) => {
                const t = e.target.value.trim()
                if (t.length >= 20) onChange({ source: 'paste', filename: 'Pasted text', text: t, chars: t.length })
              }}
            />
            <p className="mt-1 text-[10px] text-white/40">Click outside the box to save · minimum 20 characters</p>
          </TabsContent>
        </Tabs>
      )}

      {err && (
        <p className="mt-2 text-xs text-red-300">{err}</p>
      )}
    </div>
  )
}

/* ---------- The dialog with full analysis ---------- */
export function ReadinessDialog({ open, onClose, scholarshipId, scholarshipName }) {
  const [stage, setStage] = useState('prep') // 'prep' | 'loading' | 'result' | 'error'
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const [transcript, setTranscript] = useState({ source: 'none', text: '' })
  const [essay, setEssay] = useState({ source: 'none', text: '' })
  const [saveTranscript, setSaveTranscript] = useState(true)
  const [saveEssay, setSaveEssay] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [cabinetLoading, setCabinetLoading] = useState(false)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStage('prep'); setData(null); setError(''); setCached(false)
      setTranscript({ source: 'none', text: '' })
      setEssay({ source: 'none', text: '' })
      setSaveTranscript(true); setSaveEssay(true)
    }
  }, [open])

  // Auto-load cabinet documents when opening
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCabinetLoading(true)
    fetch('/api/cabinet', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((j) => {
        if (cancelled || !j) { setSignedIn(false); return }
        setSignedIn(true)
        const docs = j.cabinet?.documents || {}
        if (docs.transcript?.text) {
          setTranscript({ source: 'cabinet', filename: docs.transcript.filename, text: docs.transcript.text, chars: docs.transcript.chars })
        }
        if (docs.essay?.text) {
          setEssay({ source: 'cabinet', filename: docs.essay.filename, text: docs.essay.text, chars: docs.essay.chars })
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCabinetLoading(false) })
    return () => { cancelled = true }
  }, [open])

  const persistToCabinet = async (type, doc) => {
    try {
      await fetch('/api/cabinet/documents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, filename: doc.filename, text: doc.text, chars: doc.chars }),
      })
    } catch (_) { /* silent */ }
  }

  const runAnalysis = async () => {
    const profile = store.getProfile()
    if (!profile || !profile.degree_level) {
      setError('Complete your profile first (takes 2 minutes) — then come back for a personalized readiness score.')
      setStage('error'); return
    }
    if (!scholarshipId) return
    setStage('loading'); setError('')

    // Save to cabinet in the background (fire-and-forget)
    if (signedIn) {
      if (saveTranscript && transcript?.text && transcript.source !== 'cabinet') persistToCabinet('transcript', transcript)
      if (saveEssay && essay?.text && essay.source !== 'cabinet') persistToCabinet('essay', essay)
    }

    try {
      const r = await fetch('/api/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          scholarship_id: scholarshipId,
          transcript_text: transcript.text || '',
          essay_text: essay.text || '',
        }),
      })
      const ct = r.headers.get('content-type') || ''
      if (!ct.includes('application/json')) throw new Error('Analysis service is warming up — try again in a moment.')
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || j.detail || 'Analysis failed')
      setData(j.readiness); setCached(!!j.cached); setStage('result')
    } catch (e) {
      setError(e.message)
      setStage('error')
    }
  }

  const bucket = data ? BUCKETS[data.bucket] || BUCKETS['Competitive'] : null
  const wasteStyle = data ? WASTE_STYLE[data.waste_risk] : null

  const hasDocs = (transcript?.text?.length || 0) > 0 || (essay?.text?.length || 0) > 0
  const usingCabinet = transcript?.source === 'cabinet' || essay?.source === 'cabinet'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl border-[#D4AF37]/25 bg-black/95 backdrop-blur text-white p-0 overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/80">
              <Sparkles className="h-3 w-3"/> Application Readiness Score
            </div>
            <DialogTitle className="text-xl md:text-2xl font-semibold text-white pt-1">
              {scholarshipName || 'Your readiness'}
            </DialogTitle>
          </DialogHeader>

          {/* ------------------- STAGE: PREP ------------------- */}
          {stage === 'prep' && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-4">
                <p className="text-sm text-white/85 leading-relaxed">
                  <span className="text-[#D4AF37] font-semibold">Deeper analysis with your real documents.</span> Upload
                  your transcript and essay/personal statement — Claude will read them and cite specific evidence in your score.
                </p>
                <p className="mt-2 text-[11px] text-white/50">
                  {signedIn
                    ? (usingCabinet
                      ? '✓ Loaded from your cabinet. Remove any doc to upload a different one just for this scholarship.'
                      : 'Documents are parsed in-memory and can optionally be saved to your cabinet for reuse. Skip to get a profile-only score.')
                    : 'Sign in to save documents to your cabinet and reuse them across scholarships. Skip to get a profile-only score.'}
                </p>
                {cabinetLoading && (
                  <p className="mt-1 text-[11px] text-[#D4AF37]/70 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Checking your cabinet…</p>
                )}
              </div>

              <DocSlot
                title="Transcript"
                subtitle="Grades, courses, GPA — helps verify academic rigor"
                kind="transcript"
                value={transcript}
                onChange={setTranscript}
                savedToCabinet={saveTranscript}
                onSaveToggle={setSaveTranscript}
                canSave={signedIn}
              />
              <DocSlot
                title="Essay / Personal Statement"
                subtitle="Your goals, story, and why this scholarship — judged for clarity and fit"
                kind="essay"
                value={essay}
                onChange={setEssay}
                savedToCabinet={saveEssay}
                onSaveToggle={setSaveEssay}
                canSave={signedIn}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-white/50">
                  {hasDocs
                    ? <span className="text-emerald-400">✓ Deep analysis unlocked</span>
                    : 'You can skip — Claude will use just your profile.'}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-10"
                  >Cancel</Button>
                  <Button
                    onClick={runAnalysis}
                    className="btn-pill bg-[#D4AF37] text-black hover:bg-[#F5D67B] h-10 font-semibold"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5"/>
                    {hasDocs ? 'Run Deep Analysis' : 'Analyze My Readiness'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------- STAGE: LOADING ------------------- */}
          {stage === 'loading' && (
            <div className="mt-8 flex flex-col items-center gap-4 py-10">
              <Loader2 className="h-10 w-10 text-[#D4AF37] animate-spin"/>
              <p className="text-sm text-white/70">Claude Sonnet 4.5 is analysing your fit…</p>
              <p className="text-xs text-white/40">
                {hasDocs ? 'Reading your documents · this takes up to 90 seconds first time · instant after' : 'This takes up to a minute the first time · instant after'}
              </p>
            </div>
          )}

          {/* ------------------- STAGE: ERROR ------------------- */}
          {stage === 'error' && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-300">{error}</p>
              {error.includes('profile') && (
                <a href="/onboarding" className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">Complete profile →</a>
              )}
              <div className="mt-3">
                <Button onClick={() => setStage('prep')} variant="outline" className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-9">Back</Button>
              </div>
            </div>
          )}

          {/* ------------------- STAGE: RESULT ------------------- */}
          {stage === 'result' && data && (
            <>
              <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr] items-start">
                <div className="flex flex-col items-center gap-3">
                  <Ring score={data.score} color={bucket?.color}/>
                  <Badge className="px-3 py-1 font-medium border" style={{ color: bucket?.color, borderColor: bucket?.color + '80', background: bucket?.bg }}>
                    {bucket?.label}
                  </Badge>
                  {wasteStyle && (
                    <span className="text-[11px] text-white/60">{wasteStyle.label}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white/85 leading-relaxed">{data.headline}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                    {ELIG_ICON[data.eligibility_status] || <HelpCircle className="h-4 w-4 text-white/50"/>}
                    <span className="text-white/90 font-medium">{data.eligibility_status}</span>
                  </div>
                  {data.eligibility_reason && (
                    <p className="mt-2 text-xs text-white/60 leading-relaxed">{data.eligibility_reason}</p>
                  )}
                  {hasDocs && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                      <FileCheck2 className="h-3 w-3"/> Analysis weighted with your uploaded documents
                    </div>
                  )}
                </div>
              </div>

              {/* Transcript signals */}
              {data.transcript_signals && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/80 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5"/>Transcript signals</h3>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-white/50">GPA verified</p>
                      <p className="text-sm font-medium text-white">{data.transcript_signals.gpa_verified ? '✓ Yes' : '⚠ No'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/50">Course rigor</p>
                      <p className="text-sm font-medium text-white">{data.transcript_signals.course_rigor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/50">Trend</p>
                      <p className="text-sm font-medium text-white">{data.transcript_signals.trend}</p>
                    </div>
                  </div>
                  {data.transcript_signals.notes && (
                    <p className="mt-3 text-xs text-white/65 leading-relaxed">{data.transcript_signals.notes}</p>
                  )}
                </div>
              )}

              {/* Essay feedback */}
              {data.essay_feedback && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/80 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5"/>Essay feedback</h3>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {['clarity', 'specificity', 'alignment'].map((k) => (
                      <div key={k}>
                        <p className="text-[10px] uppercase text-white/50">{k}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-[#D4AF37]" style={{ width: `${Math.max(0, Math.min(100, data.essay_feedback[k] || 0))}%` }}/>
                          </div>
                          <span className="text-xs text-white/80 font-medium">{data.essay_feedback[k]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.essay_feedback.notes && (
                    <p className="mt-3 text-xs text-white/65 leading-relaxed">{data.essay_feedback.notes}</p>
                  )}
                </div>
              )}

              {data?.strengths?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400/80 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>Your strengths</h3>
                  <ul className="mt-3 space-y-2.5">
                    {data.strengths.map((s, i) => (
                      <li key={i} className="flex gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5"/>
                        <div>
                          <p className="text-sm font-medium text-white">{s.label}</p>
                          <p className="text-xs text-white/65 mt-0.5">{s.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data?.gaps?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/80 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5"/>Where to close the gap</h3>
                  <ul className="mt-3 space-y-2.5">
                    {data.gaps.map((g, i) => (
                      <li key={i} className="flex gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-3.5">
                        <AlertTriangle className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-white">{g.label}</p>
                            <Badge className="shrink-0 bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/25">+{g.impact_points} pts</Badge>
                          </div>
                          <p className="text-xs text-white/65 mt-0.5">{g.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data?.actions?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/80 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-[#D4AF37]"/>Prioritised action plan</h3>
                  <ol className="mt-3 space-y-2.5">
                    {data.actions.map((a, i) => (
                      <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                        <span className="shrink-0 h-6 w-6 rounded-full bg-[#D4AF37] text-black text-xs font-semibold flex items-center justify-center">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{a.step}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                            <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37]">+{a.impact_points} pts</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/70">{a.effort} effort</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <div className="text-[11px] text-white/40">
                  <ShieldCheck className="inline h-3 w-3 mr-1"/>
                  Powered by Claude Sonnet 4.5 · {cached ? 'Cached · ~100ms' : 'Fresh analysis'} · Not a guarantee of admission
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setStage('prep')} variant="outline" className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-9">
                    <Upload className="h-3.5 w-3.5 mr-1.5"/>Re-run with new docs
                  </Button>
                  <Button onClick={onClose} variant="outline" className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-9">Close</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
