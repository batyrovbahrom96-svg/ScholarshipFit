'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Bell, BellOff, Calendar, ExternalLink, Loader2, Save, Trash2, Info } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { trackEvent } from '@/lib/analytics'

export default function DeadlinesPage() {
  const { user, loading } = useAuth()
  const [saves, setSaves]         = useState([])
  const [pref, setPref]           = useState('on')
  const [busy, setBusy]           = useState(true)
  const [drafts, setDrafts]       = useState({})   // scholarship_id -> date string

  const refresh = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/cabinet/saves', { credentials: 'include' })
      const d = await r.json()
      setSaves(d.saves || [])
      setPref(d.reminders_pref || 'on')
      // Seed drafts from server dates
      const dd = {}
      for (const s of (d.saves || [])) {
        if (s.deadline_date) dd[s.scholarship_id] = String(s.deadline_date).slice(0, 10)
      }
      setDrafts(dd)
    } catch (_e) { /* ignore */ }
    finally { setBusy(false) }
  }

  useEffect(() => { if (user) refresh() }, [user])

  const saveDeadline = async (sid) => {
    const iso = drafts[sid]
    if (!iso) return toast.error('Pick a date first')
    const r = await fetch('/api/cabinet/set-deadline', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: sid, deadline_date: new Date(iso).toISOString() }),
    })
    const d = await r.json()
    if (!r.ok) { toast.error(d.error || 'Could not save'); return }
    toast.success('Deadline saved — we’ll remind you 30/14/7/1 days before')
    try { trackEvent('deadline_set', { scholarship_id: sid, days_out: Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) }) } catch { /* ignore */ }
    refresh()
  }

  const toggleSaveReminders = async (sid, enabled) => {
    const r = await fetch('/api/cabinet/toggle-reminders', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: sid, enabled }),
    })
    if (!r.ok) { toast.error('Could not update'); return }
    toast.success(enabled ? 'Reminders on for this scholarship' : 'Reminders off for this scholarship')
    refresh()
  }

  const removeSave = async (sid) => {
    const r = await fetch('/api/cabinet/favorite', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: sid }),
    })
    if (!r.ok) { toast.error('Could not remove'); return }
    toast.success('Removed from saved scholarships')
    refresh()
  }

  const setGlobalPref = async (nextPref) => {
    const r = await fetch('/api/user/reminders-pref', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pref: nextPref }),
    })
    if (!r.ok) { toast.error('Could not update'); return }
    setPref(nextPref)
    toast.success(nextPref === 'on' ? 'Deadline reminders turned ON' : 'Deadline reminders turned OFF')
  }

  const todayISO = new Date().toISOString().slice(0, 10)

  if (loading || !user) {
    return (
      <div className="dark-bg min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
          {loading ? (
            <><Loader2 className="mx-auto h-8 w-8 animate-spin text-white/50"/><p className="mt-4 text-white/50">Loading…</p></>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-white">Sign in to manage deadlines</h1>
              <div className="mt-4"><Link href="/login?return=/dashboard/deadlines"><Button className="btn-gold btn-pill">Sign in</Button></Link></div>
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

      <section className="container mx-auto max-w-4xl px-4 pt-10 pb-6 md:pt-14">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#D4AF37]">
          <Bell className="h-3.5 w-3.5"/> Deadline Reminders
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-white">Never miss a scholarship deadline again.</h1>
        <p className="mt-3 text-white/60 max-w-2xl">
          We'll email you <span className="text-white/80">30, 14, 7 and 1 day</span> before each deadline you set below. Turn it off any time.
        </p>

        {/* Global toggle */}
        <Card className="mt-6 border-white/10 bg-black/40">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-medium">Deadline reminder emails</div>
              <div className="text-sm text-white/50">Sent to <span className="text-white/80">{user.email}</span></div>
            </div>
            <Switch checked={pref === 'on'} onCheckedChange={(v) => setGlobalPref(v ? 'on' : 'off')} />
          </CardContent>
        </Card>

        {saves.length === 0 && !busy && (
          <Card className="mt-6 border-white/10 bg-black/40">
            <CardContent className="p-8 text-center">
              <Info className="mx-auto h-8 w-8 text-white/40"/>
              <p className="mt-3 text-white/70">You haven't saved any scholarships yet.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/quiz"><Button className="btn-gold btn-pill">Run the match quiz</Button></Link>
                <Link href="/database"><Button variant="outline" className="btn-pill">Browse database</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}

        {busy && saves.length === 0 && (
          <div className="mt-6 flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/50"/>
          </div>
        )}

        {/* Saves list */}
        <div className="mt-6 space-y-3">
          {saves.map((s) => {
            const hasDate = !!s.deadline_date
            const draft   = drafts[s.scholarship_id] || ''
            const daysLeft = hasDate ? Math.ceil((new Date(s.deadline_date).getTime() - Date.now()) / 86400000) : null
            const urgency = daysLeft == null ? '' : daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-amber-400' : 'text-[#D4AF37]'
            return (
              <Card key={s.scholarship_id} className="border-white/10 bg-black/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70">{s.scholarship_provider || 'Scholarship'}</div>
                      <div className="mt-1 text-white font-medium leading-snug">{s.scholarship_name}</div>
                      {hasDate && (
                        <div className={`mt-2 text-sm ${urgency}`}>
                          {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Deadline passed'} · {new Date(s.deadline_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                    {s.scholarship_url && (
                      <a href={s.scholarship_url} target="_blank" rel="nofollow noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.03] px-2.5 py-1 text-xs text-white/70 hover:border-[#D4AF37]/40 hover:text-white">
                        Official <ExternalLink className="h-3 w-3"/>
                      </a>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <label className="text-[10px] uppercase tracking-widest text-white/50">Application deadline</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-white/40"/>
                        <Input
                          type="date"
                          min={todayISO}
                          value={draft}
                          onChange={(e) => setDrafts((d) => ({ ...d, [s.scholarship_id]: e.target.value }))}
                          className="h-9 bg-white/[0.04] border-white/15 text-white"
                        />
                        <Button size="sm" onClick={() => saveDeadline(s.scholarship_id)} className="btn-gold btn-pill h-9 px-3">
                          <Save className="h-3.5 w-3.5 mr-1"/> Save
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        {s.reminders_enabled ? <Bell className="h-4 w-4 text-[#D4AF37]"/> : <BellOff className="h-4 w-4 text-white/40"/>}
                        <Switch checked={!!s.reminders_enabled} onCheckedChange={(v) => toggleSaveReminders(s.scholarship_id, v)} />
                      </label>
                      <button onClick={() => removeSave(s.scholarship_id)} className="text-white/40 hover:text-red-400" aria-label="Remove">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
          <div className="text-white font-medium">How reminders work</div>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Emails go out at <strong className="text-white/80">30, 14, 7 and 1 day</strong> before each deadline.</li>
            <li>Each email links back to the official application page and includes a pre-flight checklist.</li>
            <li>Turn reminders off for a specific scholarship (bell icon) or globally (toggle at top).</li>
            <li>Every email has a one-click unsubscribe link.</li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  )
}
