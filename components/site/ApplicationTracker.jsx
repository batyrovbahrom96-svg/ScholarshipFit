'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Trophy, XCircle, PlayCircle, Bookmark, Send, ExternalLink, Trash2, Loader2, Sparkles,
  StickyNote, ChevronDown, Calendar, GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'

/* ================================================================
   ApplicationTracker — Kanban board of the user's scholarship apps
   5 columns: Shortlisted → In Progress → Submitted → Won / Rejected
   Supports drag-and-drop between columns AND status dropdown fallback.
   Persists via /api/cabinet/applications (auth required).
   ================================================================ */

const COLUMNS = [
  { key: 'shortlisted', label: 'Shortlisted', icon: Bookmark, tint: 'from-white/[0.05] to-white/[0.02]', accent: 'text-white/70' },
  { key: 'in_progress', label: 'In Progress', icon: PlayCircle, tint: 'from-[#D4AF37]/[0.10] to-[#D4AF37]/[0.02]', accent: 'text-[#D4AF37]' },
  { key: 'submitted',   label: 'Submitted',   icon: Send,       tint: 'from-cyan-500/[0.10] to-cyan-500/[0.02]', accent: 'text-cyan-300' },
  { key: 'won',         label: 'Won',         icon: Trophy,     tint: 'from-emerald-500/[0.10] to-emerald-500/[0.02]', accent: 'text-emerald-300' },
  { key: 'rejected',    label: 'Rejected',    icon: XCircle,    tint: 'from-red-500/[0.10] to-red-500/[0.02]', accent: 'text-red-300' },
]
const NEXT_STATUS_LABEL = {
  shortlisted: 'In Progress',
  in_progress: 'Submitted',
  submitted: 'Won',
  won: 'Rejected',
  rejected: 'Shortlisted',
}

/* -------- Application card (draggable) -------- */
function AppCard({ app, onMove, onOpen, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app)}
      onClick={() => onOpen(app)}
      className="group cursor-grab active:cursor-grabbing rounded-xl border border-white/10 bg-black/40 backdrop-blur p-3 hover:border-[#D4AF37]/40 hover:bg-black/60 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-snug line-clamp-2">{app.scholarship_name}</p>
      </div>
      <p className="mt-1 text-[11px] text-white/50 truncate">
        {app.university_name}{app.country ? ` · ${app.country}` : ''}
      </p>
      {app.deadline_note && (
        <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-white/50">
          <Calendar className="h-3 w-3"/>{app.deadline_note}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 opacity-70 group-hover:opacity-100 transition">
        {app.source_url ? (
          <a
            href={app.source_url}
            target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-[#D4AF37]"
            title="Open official source"
          >
            <ExternalLink className="h-3 w-3"/>source
          </a>
        ) : <span/>}
        <button
          onClick={(e) => { e.stopPropagation(); onMove(app) }}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10 hover:text-white transition"
          title={`Move to ${NEXT_STATUS_LABEL[app.status]}`}
        >
          Move <ChevronDown className="h-3 w-3"/>
        </button>
      </div>
    </div>
  )
}

/* -------- Kanban column -------- */
function Column({ col, apps, onDragStart, onDrop, onDragOver, dropTarget, onMove, onOpen }) {
  const Icon = col.icon
  const isDropTarget = dropTarget === col.key
  return (
    <div
      onDragOver={(e) => onDragOver(e, col.key)}
      onDrop={(e) => onDrop(e, col.key)}
      className={`flex flex-col rounded-2xl border transition min-h-[240px]
        ${isDropTarget ? 'border-[#D4AF37] bg-[#D4AF37]/[0.06] shadow-[0_0_40px_-10px_rgba(212,175,55,0.5)]' : 'border-white/10 bg-gradient-to-b ' + col.tint}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${col.accent}`}/>
          <p className={`text-[11px] uppercase tracking-[0.16em] font-semibold ${col.accent}`}>{col.label}</p>
        </div>
        <span className="text-[11px] text-white/40 tabular-nums">{apps.length}</span>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {apps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-[11px] text-white/35">
            Drop here or add from the database
          </div>
        ) : apps.map((a) => (
          <AppCard key={a.id} app={a} onMove={onMove} onOpen={onOpen} onDragStart={onDragStart}/>
        ))}
      </div>
    </div>
  )
}

/* -------- Details / notes modal -------- */
function DetailsModal({ app, onClose, onUpdate, onDelete }) {
  const open = !!app
  const [notes, setNotes] = useState(app?.notes || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => { setNotes(app?.notes || '') }, [app?.id])
  if (!app) return null

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate(app, { notes })
      toast.success('Notes saved')
      onClose()
    } catch (e) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }
  const remove = async () => {
    if (!confirm('Remove this application from your tracker?')) return
    setDeleting(true)
    try {
      await onDelete(app)
      onClose()
    } catch (e) { toast.error(e.message || 'Delete failed') } finally { setDeleting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg border-[#D4AF37]/25 bg-black/95 text-white">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/80">
            <StickyNote className="h-3 w-3"/>Application
          </div>
          <DialogTitle className="text-lg font-semibold text-white pt-1">{app.scholarship_name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-white/60 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[#D4AF37]"/>{app.university_name}{app.country ? ` · ${app.country}` : ''}
        </p>
        {app.funding_summary && <p className="text-xs text-white/50">{app.funding_summary}</p>}
        {app.deadline_note && (
          <p className="text-xs text-white/50 inline-flex items-center gap-1"><Calendar className="h-3 w-3"/>{app.deadline_note}</p>
        )}
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-widest text-white/50 mb-1.5">My notes</p>
          <Textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Track deadlines, required documents, contacts, sub-tasks…"
            className="bg-white/[0.03] border-white/10 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#D4AF37]/50"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {app.source_url && (
              <a
                href={app.source_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
              >
                <ExternalLink className="h-3.5 w-3.5"/>Open source
              </a>
            )}
            <button
              onClick={remove}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/5 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/15 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Trash2 className="h-3.5 w-3.5"/>}Remove
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-9">Close</Button>
            <Button onClick={save} disabled={saving} className="btn-pill bg-[#D4AF37] text-black hover:bg-[#F5D67B] h-9 font-semibold">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : null}Save notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* -------- Main tracker -------- */
export default function ApplicationTracker({ signedIn }) {
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState([])
  const [dropTarget, setDropTarget] = useState(null)
  const [active, setActive] = useState(null)

  const refresh = useCallback(async () => {
    if (!signedIn) { setLoading(false); return }
    try {
      const r = await fetch('/api/cabinet/applications', { credentials: 'include' })
      if (r.ok) {
        const j = await r.json()
        setApps(j.applications || [])
      }
    } finally { setLoading(false) }
  }, [signedIn])

  useEffect(() => { refresh() }, [refresh])

  const persistStatus = async (app, patch = {}) => {
    // Optimistic update
    const next = { ...app, ...patch, updated_at: new Date().toISOString() }
    setApps((prev) => prev.map((a) => a.id === app.id ? next : a))
    try {
      const r = await fetch('/api/cabinet/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...app, ...patch }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Update failed')
      setApps((prev) => prev.map((a) => a.id === app.id ? j.application : a))
    } catch (e) {
      // Revert
      setApps((prev) => prev.map((a) => a.id === app.id ? app : a))
      throw e
    }
  }

  const removeApp = async (app) => {
    setApps((prev) => prev.filter((a) => a.id !== app.id))
    try {
      const r = await fetch(`/api/cabinet/applications?id=${encodeURIComponent(app.id)}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (!r.ok) throw new Error('Delete failed')
      toast.success('Removed from tracker')
    } catch (e) {
      setApps((prev) => [app, ...prev])
      throw e
    }
  }

  // Drag-and-drop handlers
  const onDragStart = (e, app) => {
    e.dataTransfer.setData('text/plain', app.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e, colKey) => { e.preventDefault(); setDropTarget(colKey) }
  const onDrop = async (e, colKey) => {
    e.preventDefault()
    setDropTarget(null)
    const id = e.dataTransfer.getData('text/plain')
    const app = apps.find((a) => a.id === id)
    if (!app || app.status === colKey) return
    try {
      await persistStatus(app, { status: colKey })
      const labels = { shortlisted: 'Shortlisted', in_progress: 'In Progress', submitted: 'Submitted', won: 'Won 🎉', rejected: 'Rejected' }
      toast.success(`Moved to ${labels[colKey]}`)
    } catch (err) { toast.error('Could not move: ' + err.message) }
  }

  // Move via "Move" button on card
  const nextStatus = (s) => {
    const order = ['shortlisted', 'in_progress', 'submitted', 'won', 'rejected']
    const i = order.indexOf(s)
    return order[(i + 1) % order.length]
  }
  const bumpStatus = async (app) => {
    const target = nextStatus(app.status)
    try {
      await persistStatus(app, { status: target })
      const labels = { shortlisted: 'Shortlisted', in_progress: 'In Progress', submitted: 'Submitted', won: 'Won 🎉', rejected: 'Rejected' }
      toast.success(`Moved to ${labels[target]}`)
    } catch (e) { toast.error(e.message || 'Move failed') }
  }

  const byStatus = useMemo(() => {
    const buckets = Object.fromEntries(COLUMNS.map((c) => [c.key, []]))
    for (const a of apps) {
      const k = COLUMNS.some((c) => c.key === a.status) ? a.status : 'shortlisted'
      buckets[k].push(a)
    }
    return buckets
  }, [apps])

  const stats = useMemo(() => {
    return {
      total: apps.length,
      shortlisted: byStatus.shortlisted.length,
      in_progress: byStatus.in_progress.length,
      submitted: byStatus.submitted.length,
      won: byStatus.won.length,
      rejected: byStatus.rejected.length,
    }
  }, [byStatus, apps.length])

  if (!signedIn) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="p-10 text-center">
          <Sparkles className="h-10 w-10 text-[#D4AF37]/50 mx-auto"/>
          <h3 className="mt-3 text-lg font-semibold text-white">Sign in to track applications</h3>
          <p className="mt-1 text-sm text-white/60 max-w-md mx-auto">
            Track every scholarship you&rsquo;re applying to in one kanban board — from shortlist to submitted to won.
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
        <Loader2 className="h-4 w-4 animate-spin"/>Loading your tracker…
      </div>
    )
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 mb-4">
        {COLUMNS.map((c) => (
          <div key={c.key} className={`rounded-xl border border-white/10 bg-gradient-to-b ${c.tint} px-3 py-2.5`}>
            <div className="flex items-center gap-1.5">
              <c.icon className={`h-3.5 w-3.5 ${c.accent}`}/>
              <span className={`text-[10px] uppercase tracking-widest ${c.accent}`}>{c.label}</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-white tabular-nums">{stats[c.key]}</p>
          </div>
        ))}
      </div>

      {apps.length === 0 ? (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-12 text-center">
            <Bookmark className="h-10 w-10 text-[#D4AF37]/40 mx-auto"/>
            <h3 className="mt-4 text-lg font-semibold text-white">Your tracker is empty</h3>
            <p className="mt-1 text-sm text-white/55 max-w-md mx-auto">
              Head to the scholarship database or run the AI match, then click <span className="text-[#D4AF37] font-medium">&ldquo;Track&rdquo;</span> on any card to add it here.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild className="btn-pill bg-[#D4AF37] text-black hover:bg-[#F5D67B] h-10 font-semibold">
                <a href="/database">Browse database</a>
              </Button>
              <Button asChild variant="outline" className="btn-pill border-white/15 bg-transparent text-white hover:bg-white/5 h-10">
                <a href="/onboarding">Run AI match</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              col={col}
              apps={byStatus[col.key]}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dropTarget={dropTarget}
              onMove={bumpStatus}
              onOpen={setActive}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-white/40 text-center">
        Drag cards between columns · click a card to add notes · &ldquo;Move&rdquo; button advances to the next stage
      </p>

      <DetailsModal
        app={active}
        onClose={() => setActive(null)}
        onUpdate={persistStatus}
        onDelete={removeApp}
      />
    </div>
  )
}

/* ---------- Track button (used on scholarship cards) ---------- */
export function TrackButton({ scholarship, className }) {
  const [busy, setBusy] = useState(false)
  const [tracked, setTracked] = useState(false)

  const track = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.()
    setBusy(true)
    try {
      const r = await fetch('/api/cabinet/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scholarship_id: scholarship.id || scholarship.scholarship_id,
          scholarship_name: scholarship.scholarship_name || scholarship.name,
          university_name: scholarship.university_name || scholarship.university,
          country: scholarship.country,
          source_url: scholarship.source_url,
          funding_summary: scholarship.funding_summary,
          deadline_note: scholarship.deadline_note || scholarship.deadline_status,
          status: 'shortlisted',
        }),
      })
      if (r.status === 401) {
        toast.info('Sign in to track scholarships')
        window.location.href = '/login'; return
      }
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Track failed')
      setTracked(true)
      toast.success(j.created ? 'Added to tracker' : 'Already in tracker · status refreshed', {
        description: 'Open dashboard → Tracker to manage',
      })
    } catch (err) {
      toast.error(err.message || 'Could not track')
    } finally { setBusy(false) }
  }

  return (
    <button
      onClick={track}
      disabled={busy || tracked}
      title="Add to your application tracker"
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border transition text-xs font-medium disabled:opacity-60
        ${tracked
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'} ${className || ''}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Bookmark className="h-3.5 w-3.5"/>}
      {tracked ? 'Tracked' : 'Track'}
    </button>
  )
}
