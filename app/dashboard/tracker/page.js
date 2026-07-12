'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Bookmark, PenLine, Send, Clock, Award, Plus, Trash2, ExternalLink, Loader2, Kanban, Import, CheckCircle2, XCircle, PauseCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { trackEvent } from '@/lib/analytics'

const COLUMNS = [
  { key: 'saved',      label: 'Saved',      icon: Bookmark, color: 'text-white/70',      border: 'border-white/15' },
  { key: 'preparing',  label: 'Preparing',  icon: PenLine,  color: 'text-cyan-300',      border: 'border-cyan-500/30' },
  { key: 'submitted',  label: 'Submitted',  icon: Send,     color: 'text-blue-300',      border: 'border-blue-500/30' },
  { key: 'waiting',    label: 'Waiting',    icon: Clock,    color: 'text-amber-300',     border: 'border-amber-500/30' },
  { key: 'result',     label: 'Result',     icon: Award,    color: 'text-emerald-300',   border: 'border-emerald-500/30' },
]

const RESULT_META = {
  accepted:   { label: 'Accepted',   icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/40' },
  rejected:   { label: 'Rejected',   icon: XCircle,      color: 'text-red-400 border-red-500/40' },
  waitlisted: { label: 'Waitlisted', icon: PauseCircle,  color: 'text-amber-400 border-amber-500/40' },
  withdrawn:  { label: 'Withdrawn',  icon: XCircle,      color: 'text-white/50 border-white/20' },
}

export default function TrackerPage() {
  const { user, loading } = useAuth()
  const [apps, setApps]     = useState([])
  const [busy, setBusy]     = useState(true)
  const [drag, setDrag]     = useState(null)          // id being dragged
  const [dragOver, setDragOver] = useState(null)      // column being hovered
  const [editing, setEditing] = useState(null)        // app being edited in modal
  const [creating, setCreating] = useState(null)      // column key for "add" modal

  const refresh = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/applications', { credentials: 'include' })
      const d = await r.json()
      setApps(d.applications || [])
    } catch (_e) { /* ignore */ }
    finally { setBusy(false) }
  }
  useEffect(() => { if (user) refresh() }, [user])

  const importSaves = async () => {
    const r = await fetch('/api/applications/import-saves', { method: 'POST', credentials: 'include' })
    const d = await r.json()
    if (!r.ok) { toast.error(d.error || 'Could not import'); return }
    toast.success(`Imported ${d.imported} saved scholarship${d.imported === 1 ? '' : 's'}`)
    try { trackEvent('tracker_imported_saves', { count: d.imported }) } catch { /* ignore */ }
    refresh()
  }

  const byColumn = useMemo(() => {
    const m = Object.fromEntries(COLUMNS.map(c => [c.key, []]))
    for (const a of apps) if (m[a.status]) m[a.status].push(a)
    for (const k of Object.keys(m)) m[k].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    return m
  }, [apps])

  const move = async (id, newStatus) => {
    const app = apps.find(a => a.id === id)
    if (!app || app.status === newStatus) return
    // Optimistic update
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      try { trackEvent('tracker_move', { from: app.status, to: newStatus }) } catch { /* ignore */ }
    } catch (_e) {
      toast.error('Sync failed'); refresh()
    }
  }

  const saveEdit = async (patch) => {
    if (!editing) return
    try {
      const r = await fetch(`/api/applications/${editing.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error || 'Save failed'); return }
      setApps(prev => prev.map(a => a.id === editing.id ? d.application : a))
      toast.success('Saved')
      setEditing(null)
    } catch (_e) { toast.error('Save failed') }
  }

  const remove = async (id) => {
    if (!confirm('Delete this application from your tracker?')) return
    await fetch(`/api/applications/${id}`, { method: 'DELETE', credentials: 'include' })
    setApps(prev => prev.filter(a => a.id !== id))
    setEditing(null)
    toast.success('Deleted')
  }

  const createNew = async (formData) => {
    const r = await fetch('/api/applications/create', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, status: creating }),
    })
    const d = await r.json()
    if (!r.ok) { toast.error(d.error || 'Could not create'); return }
    setApps(prev => [...prev, d.application])
    setCreating(null)
    toast.success('Application added')
    try { trackEvent('tracker_create', { status: creating }) } catch { /* ignore */ }
  }

  if (loading || !user) {
    return (
      <div className="dark-bg min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
          {loading ? (
            <><Loader2 className="mx-auto h-8 w-8 animate-spin text-white/50"/><p className="mt-4 text-white/50">Loading…</p></>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-white">Sign in to open your tracker</h1>
              <div className="mt-4"><Link href="/login?return=/dashboard/tracker"><Button className="btn-gold btn-pill">Sign in</Button></Link></div>
            </>
          )}
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      <section className="container mx-auto max-w-7xl px-4 pt-10 pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <Kanban className="h-3.5 w-3.5"/> Application Tracker
            </div>
            <h1 className="mt-2 text-2xl md:text-4xl font-semibold text-white">Your scholarship pipeline.</h1>
            <p className="mt-2 text-white/60 max-w-2xl text-sm">
              Drag applications across columns as you progress. Add notes, deadlines, and results per card.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={importSaves} variant="outline" className="btn-pill">
              <Import className="h-4 w-4 mr-1.5"/> Import saved
            </Button>
            <Link href="/dashboard/deadlines">
              <Button variant="outline" className="btn-pill">Deadlines</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Kanban */}
      <section className="container mx-auto max-w-7xl px-4 pb-16">
        {busy && apps.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-white/50"/></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((col) => {
              const items = byColumn[col.key] || []
              const isDropTarget = dragOver === col.key
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(col.key) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain') || drag
                    if (id) move(id, col.key)
                    setDrag(null); setDragOver(null)
                  }}
                  className={`rounded-xl border ${col.border} ${isDropTarget ? 'bg-white/[0.06] ring-1 ring-[#D4AF37]/40' : 'bg-black/30'} p-3 transition-colors min-h-[300px]`}
                >
                  <div className={`flex items-center justify-between mb-3 ${col.color}`}>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
                      <col.icon className="h-3.5 w-3.5"/> {col.label}
                      <span className="text-white/40 normal-case tracking-normal">({items.length})</span>
                    </div>
                    <button
                      onClick={() => setCreating(col.key)}
                      className="text-white/40 hover:text-white/80"
                      aria-label={`Add to ${col.label}`}
                    ><Plus className="h-4 w-4"/></button>
                  </div>

                  <div className="space-y-2">
                    {items.map((a) => {
                      const daysLeft = a.deadline_date ? Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / 86400000) : null
                      const resMeta = a.result ? RESULT_META[a.result] : null
                      return (
                        <div
                          key={a.id}
                          draggable
                          onDragStart={(e) => { setDrag(a.id); e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move' }}
                          onDragEnd={() => { setDrag(null); setDragOver(null) }}
                          onClick={() => setEditing(a)}
                          className={`cursor-grab active:cursor-grabbing rounded-lg border border-white/10 bg-black/50 p-3 hover:border-[#D4AF37]/40 transition-colors ${drag === a.id ? 'opacity-40' : ''}`}
                        >
                          {a.scholarship_provider && (
                            <div className="text-[9px] uppercase tracking-widest text-[#D4AF37]/70 truncate">{a.scholarship_provider}</div>
                          )}
                          <div className="mt-1 text-sm font-medium text-white leading-snug line-clamp-2">{a.scholarship_name}</div>

                          <div className="mt-2 flex items-center flex-wrap gap-1.5 text-[11px]">
                            {daysLeft != null && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${daysLeft < 0 ? 'text-red-400 bg-red-500/10' : daysLeft <= 7 ? 'text-red-300 bg-red-500/10' : daysLeft <= 14 ? 'text-amber-300 bg-amber-500/10' : 'text-white/60 bg-white/5'}`}>
                                {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                              </span>
                            )}
                            {resMeta && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${resMeta.color}`}>
                                <resMeta.icon className="h-3 w-3"/> {resMeta.label}
                              </span>
                            )}
                            {a.notes && (
                              <span className="text-white/40 text-[10px]">📝 notes</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
                        Drop here or <button onClick={() => setCreating(col.key)} className="text-[#D4AF37] hover:underline">add one</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {apps.length === 0 && !busy && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-white/70">No applications yet. Import your saved scholarships or add one manually.</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button onClick={importSaves} className="btn-gold btn-pill">Import saved scholarships</Button>
              <Button onClick={() => setCreating('saved')} variant="outline" className="btn-pill">Add manually</Button>
            </div>
          </div>
        )}
      </section>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg bg-[#111] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{editing?.scholarship_name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {editing.scholarship_provider && <div className="text-xs text-[#D4AF37]/70 uppercase tracking-widest">{editing.scholarship_provider}</div>}

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50">Deadline</label>
                <Input
                  type="date"
                  defaultValue={editing.deadline_date ? String(editing.deadline_date).slice(0, 10) : ''}
                  onChange={(e) => setEditing({ ...editing, deadline_date: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50">Notes</label>
                <Textarea
                  rows={4}
                  defaultValue={editing.notes || ''}
                  placeholder="Requirements, contacts, essay drafts, todo list…"
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/15 text-white"
                />
              </div>

              {editing.status === 'result' && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50">Result</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(RESULT_META).map(([k, m]) => (
                      <button
                        key={k}
                        onClick={() => setEditing({ ...editing, result: editing.result === k ? null : k })}
                        className={`px-3 py-2 rounded-md border text-sm inline-flex items-center gap-2 ${editing.result === k ? m.color + ' bg-white/[0.06]' : 'text-white/70 border-white/15 hover:border-white/30'}`}
                      >
                        <m.icon className="h-4 w-4"/> {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editing.scholarship_url && (
                <a href={editing.scholarship_url} target="_blank" rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#D4AF37] hover:underline">
                  Official page <ExternalLink className="h-3 w-3"/>
                </a>
              )}
            </div>
          )}
          <DialogFooter className="flex items-center justify-between">
            <button onClick={() => remove(editing?.id)} className="text-red-400 hover:text-red-300 text-sm inline-flex items-center gap-1">
              <Trash2 className="h-4 w-4"/> Delete
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} className="btn-pill">Cancel</Button>
              <Button onClick={() => saveEdit({
                notes: editing.notes,
                deadline_date: editing.deadline_date || null,
                result: editing.result || null,
              })} className="btn-gold btn-pill">Save changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      <CreateModal open={!!creating} onClose={() => setCreating(null)} onCreate={createNew} column={creating}/>

      <Footer />
    </div>
  )
}

function CreateModal({ open, onClose, onCreate, column }) {
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [url, setUrl] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (!open) { setName(''); setProvider(''); setUrl(''); setDeadline('') }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-[#111] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Add to “{column}”</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50">Scholarship name*</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chevening Scholarship" className="mt-1 bg-white/[0.04] border-white/15 text-white" autoFocus/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50">Provider</label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. UK Government" className="mt-1 bg-white/[0.04] border-white/15 text-white"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50">Official URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-1 bg-white/[0.04] border-white/15 text-white"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50">Deadline</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 bg-white/[0.04] border-white/15 text-white"/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="btn-pill">Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => onCreate({
            scholarship_name: name.trim(),
            scholarship_provider: provider.trim(),
            scholarship_url: url.trim(),
            deadline_date: deadline || null,
          })} className="btn-gold btn-pill">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
