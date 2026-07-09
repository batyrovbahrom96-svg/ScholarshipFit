'use client'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText, Upload, Loader2, Trash2, FileCheck2, ClipboardPaste, Save, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

/* ================================================================
   MyDocuments — Cabinet Documents management UI
   - Loads GET /api/cabinet to fetch saved transcript / essay
   - Supports upload (PDF/DOCX/TXT) or plain-text paste
   - POST /api/cabinet/documents saves; DELETE removes
   - Reused inside the dashboard Documents tab AND anywhere else
   ================================================================ */

function DocEditor({ type, label, subtitle, saved, onSaved, onRemoved }) {
  const inputRef = useRef(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [tab, setTab] = useState('upload')
  const [pastedText, setPastedText] = useState('')
  const [pendingDoc, setPendingDoc] = useState(null) // freshly parsed, not yet saved

  const has = !!saved

  const handleFile = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return }
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) { toast.error('Only PDF, DOCX, or TXT files are supported'); return }
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/readiness/parse', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Parsing failed')
      setPendingDoc({ filename: j.filename, text: j.text, chars: j.chars, truncated: j.truncated })
    } catch (e) {
      toast.error('Could not read file', { description: e.message })
    } finally {
      setParsing(false)
    }
  }

  const usePastedText = () => {
    const t = pastedText.trim()
    if (t.length < 20) { toast.error('Please paste at least 20 characters'); return }
    setPendingDoc({ filename: 'Pasted text', text: t, chars: t.length })
  }

  const persist = async (doc) => {
    setSaving(true)
    try {
      const r = await fetch('/api/cabinet/documents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...doc }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Save failed')
      toast.success(`${label} saved to your cabinet`)
      onSaved?.(j.document)
      setPendingDoc(null)
      setPastedText('')
    } catch (e) {
      toast.error('Could not save', { description: e.message })
    } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!confirm(`Remove your saved ${label.toLowerCase()}?`)) return
    setSaving(true)
    try {
      const r = await fetch(`/api/cabinet/documents?type=${type}`, {
        method: 'DELETE', credentials: 'include',
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed')
      toast.success(`${label} removed`)
      onRemoved?.()
    } catch (e) {
      toast.error('Could not remove', { description: e.message })
    } finally { setSaving(false) }
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#D4AF37]"/>{label}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
          </div>
          {has && (
            <button
              onClick={remove}
              disabled={saving}
              className="text-[11px] text-white/50 hover:text-red-300 transition inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3"/>Remove
            </button>
          )}
        </div>

        {/* SAVED STATE */}
        {has && !pendingDoc && (
          <div className="mt-4 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm text-white">
              <FileCheck2 className="h-4 w-4 text-[#D4AF37]"/>
              <span className="font-medium truncate">{saved.filename}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-[#D4AF37]/80">saved</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-white/55">
              <span>{(saved.chars || saved.text?.length || 0).toLocaleString()} chars</span>
              {saved.uploaded_at && <span>· {new Date(saved.uploaded_at).toLocaleDateString()}</span>}
              {saved.truncated && <span className="text-[#D4AF37]/70">· truncated</span>}
            </div>
            <details className="mt-3">
              <summary className="text-[11px] text-[#D4AF37]/80 cursor-pointer hover:text-[#D4AF37]">Preview extracted text</summary>
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-white/10 bg-black/40 p-3 text-[11px] text-white/70 whitespace-pre-wrap font-mono">
                {(saved.text || '').slice(0, 2000)}
                {(saved.text || '').length > 2000 && '\n\n… (truncated for preview)'}
              </div>
            </details>
            <p className="mt-3 text-[11px] text-white/50">
              This document will be auto-included in every Readiness Score you run.
            </p>
          </div>
        )}

        {/* UPLOAD / PASTE (when nothing saved OR pending review) */}
        {(!has || pendingDoc) && (
          <div className="mt-4">
            {pendingDoc ? (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm text-white">
                  <FileCheck2 className="h-4 w-4 text-emerald-400"/>
                  <span className="font-medium truncate">{pendingDoc.filename}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/55">
                  {pendingDoc.chars.toLocaleString()} characters extracted
                  {pendingDoc.truncated && ' · truncated to 60,000'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => persist(pendingDoc)}
                    disabled={saving}
                    className="btn-pill bg-[#D4AF37] text-black hover:bg-[#F5D67B] h-9"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Save className="h-4 w-4 mr-1"/>}
                    Save to cabinet
                  </Button>
                  <Button
                    onClick={() => { setPendingDoc(null); setPastedText('') }}
                    variant="outline"
                    className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-9"
                  >Cancel</Button>
                </div>
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab}>
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
                        <p className="text-sm text-white/85">Drop your {label.toLowerCase()} here, or click to browse</p>
                        <p className="text-[11px] text-white/45">PDF · DOCX · TXT · up to 10 MB</p>
                      </>
                    )}
                  </label>
                </TabsContent>
                <TabsContent value="paste" className="mt-3">
                  <Textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Paste your ${label.toLowerCase()} here…`}
                    className="bg-white/[0.03] border-white/10 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#D4AF37]/50"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-white/40">{pastedText.trim().length} chars · min 20</p>
                    <Button
                      onClick={usePastedText}
                      disabled={pastedText.trim().length < 20}
                      className="btn-pill bg-[#D4AF37] text-black hover:bg-[#F5D67B] h-9 disabled:opacity-50"
                    >Use this text</Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function MyDocuments({ signedIn }) {
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState({ transcript: null, essay: null })

  const refresh = async () => {
    if (!signedIn) { setLoading(false); return }
    try {
      const r = await fetch('/api/cabinet', { credentials: 'include' })
      if (r.ok) {
        const j = await r.json()
        setDocs(j.cabinet?.documents || { transcript: null, essay: null })
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [signedIn])

  if (!signedIn) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="p-10 text-center">
          <FileText className="h-10 w-10 text-[#D4AF37]/50 mx-auto"/>
          <h3 className="mt-3 text-lg font-semibold text-white">Sign in to save documents</h3>
          <p className="mt-1 text-sm text-white/60 max-w-md mx-auto">
            Sign in to upload your transcript and essay once — they&apos;ll be auto-included in every Readiness Score across every scholarship.
          </p>
          <Button asChild className="mt-4 btn-pill bg-[#D4AF37] text-black hover:bg-[#F5D67B] h-10 font-semibold">
            <a href="/login">Sign in</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60 py-8">
        <Loader2 className="h-4 w-4 animate-spin"/>Loading your documents…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm text-white font-semibold">Upload once. Score every scholarship.</p>
            <p className="mt-1 text-[12px] text-white/65 leading-relaxed">
              Save your transcript and essay here and every Readiness Score across the app will automatically weight them.
              Only the extracted text is stored — never the original file bytes. You can update or remove them anytime.
            </p>
          </div>
        </div>
      </div>

      <DocEditor
        type="transcript"
        label="Transcript"
        subtitle="Grades, courses, GPA — helps verify academic rigor"
        saved={docs.transcript}
        onSaved={(d) => setDocs((prev) => ({ ...prev, transcript: d }))}
        onRemoved={() => setDocs((prev) => ({ ...prev, transcript: null }))}
      />
      <DocEditor
        type="essay"
        label="Essay / Personal Statement"
        subtitle="Your goals, story, and why this scholarship — judged for clarity and fit"
        saved={docs.essay}
        onSaved={(d) => setDocs((prev) => ({ ...prev, essay: d }))}
        onRemoved={() => setDocs((prev) => ({ ...prev, essay: null }))}
      />
    </div>
  )
}
