'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Database, Users, Sparkles, MessageSquare, Plus, ShieldCheck, EyeOff, Eye, Pencil, ExternalLink } from 'lucide-react'

function Admin() {
  const [stats, setStats] = useState(null)
  const [items, setItems] = useState([])
  const [logs, setLogs] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    const [s, sc, lg] = await Promise.all([
      fetch('/api/admin/stats').then(r=>r.json()),
      fetch('/api/scholarships').then(r=>r.json()),
      fetch('/api/admin/logs').then(r=>r.json()),
    ])
    setStats(s); setItems(sc.scholarships || []); setLogs(lg)
  }
  useEffect(() => { load() }, [])

  const save = async (doc, isNew) => {
    const url = isNew ? '/api/scholarships' : `/api/scholarships/${doc.id}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(doc) }).then(r=>r.json())
    if (res.error) return toast.error('Save failed', { description: res.error })
    toast.success(isNew ? 'Created' : 'Updated')
    setEditing(null); setCreating(false)
    load()
  }

  const togglePublic = async (s) => {
    const next = s.public_status === 'hidden' ? 'public' : 'hidden'
    await fetch(`/api/scholarships/${s.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ public_status: next }) })
    toast.success(`Marked as ${next}`)
    load()
  }

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">Admin</Badge>
            <h1 className="mt-2 text-3xl font-semibold text-white">ScholarshipFit control</h1>
            <p className="text-white/60 text-sm">Manage database records, trust levels, and AI activity.</p>
          </div>
          <Button onClick={()=>setCreating(true)} className="bg-white text-[#060608] hover:bg-white/90 btn-pill font-medium"><Plus className="mr-2 h-4 w-4"/>Add scholarship</Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat icon={<Database className="h-4 w-4"/>} label="Scholarships" value={stats?.scholarships ?? '—'}/>
          <Stat icon={<Users className="h-4 w-4"/>} label="Profiles" value={stats?.profiles ?? '—'}/>
          <Stat icon={<Sparkles className="h-4 w-4"/>} label="Match runs" value={stats?.match_runs ?? '—'}/>
          <Stat icon={<MessageSquare className="h-4 w-4"/>} label="Advisor messages" value={stats?.advisor_messages ?? '—'}/>
        </div>

        <Card className="mt-6 border-white/10 bg-white/[0.03]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-white/60">
                  <tr className="border-b border-white/10">
                    <th className="p-3">Scholarship</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Trust</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(s => (
                    <tr key={s.id} className="border-b border-white/10 text-white">
                      <td className="p-3"><div className="font-medium text-white">{s.scholarship_name}</div><div className="text-xs text-white/60">{s.university_name}</div></td>
                      <td className="p-3">{s.country}</td>
                      <td className="p-3"><Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300"><ShieldCheck className="mr-1 h-3 w-3"/>{s.trust_level}</Badge></td>
                      <td className="p-3">{s.source_url ? <a target="_blank" rel="noopener noreferrer" href={s.source_url} className="inline-flex items-center gap-1 text-cyan-300 hover:underline"><ExternalLink className="h-3 w-3"/>Open</a> : <span className="text-amber-300">missing</span>}</td>
                      <td className="p-3">{s.public_status === 'hidden' ? <Badge className="bg-amber-500/100/15 text-amber-300 hover:bg-amber-500/100/15">hidden</Badge> : <Badge className="bg-emerald-500/100/15 text-emerald-300 hover:bg-emerald-500/100/15">public</Badge>}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={()=>setEditing(s)} className="text-white/80 hover:text-white hover:bg-white/5"><Pencil className="h-4 w-4"/></Button>
                        <Button size="sm" variant="ghost" onClick={()=>togglePublic(s)} className="text-white/80 hover:text-white hover:bg-white/5">{s.public_status === 'hidden' ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-widest text-white/60">Recent AI match runs</p>
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
              {logs?.match_runs?.length ? logs.match_runs.map(r=>(
                <div key={r.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-white/60"><span>{new Date(r.created_at).toLocaleString()}</span><span>{r.result?.matches?.length || 0} matches</span></div>
                  <p className="mt-1 text-white/80 line-clamp-2">{r.result?.summary}</p>
                </div>
              )) : <p className="text-sm text-white/40">No runs yet.</p>}
            </div>
          </CardContent></Card>
          <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-widest text-white/60">Recent advisor messages</p>
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
              {logs?.advisor_messages?.length ? logs.advisor_messages.map(m=>(
                <div key={m.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-white/60"><span>{m.role}</span><span>{new Date(m.created_at).toLocaleTimeString()}</span></div>
                  <p className="mt-1 text-white/80 line-clamp-3">{m.content}</p>
                </div>
              )) : <p className="text-sm text-white/40">No advisor traffic yet.</p>}
            </div>
          </CardContent></Card>
        </div>
      </div>

      <ScholarshipDialog open={!!editing || creating} initial={editing} isNew={creating} onClose={()=>{setEditing(null); setCreating(false)}} onSave={save}/>
      <Footer />
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-5">
      <div className="flex items-center gap-2 text-cyan-300">{icon}<span className="text-xs uppercase tracking-widest text-white/60">{label}</span></div>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
    </CardContent></Card>
  )
}

function ScholarshipDialog({ open, initial, isNew, onClose, onSave }) {
  const empty = { scholarship_name:'', university_name:'', country:'', funding_type:'Full', funding_amount:'', funding_summary:'', deadline_status:'Annual cycle', deadline_note:'', source_url:'', application_link:'', trust_level:'Needs source review', degree_levels:[], major_fields:[], eligible_nationalities:[], required_documents:[], eligibility_summary:'', public_status:'public', slug:'' }
  const [doc, setDoc] = useState(empty)
  useEffect(() => { setDoc(initial || empty) }, [initial, open])
  if (!open) return null
  const upd = (k,v) => setDoc(d=>({...d,[k]:v}))
  const listUpd = (k, v) => setDoc(d=>({...d, [k]: v.split(',').map(s=>s.trim()).filter(Boolean)}))
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white/[0.04] border-white/10 text-white">
        <DialogHeader><DialogTitle>{isNew ? 'Add scholarship' : 'Edit scholarship'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2 max-h-[70vh] overflow-y-auto pr-2">
          <F label="Scholarship name" v={doc.scholarship_name} on={v=>upd('scholarship_name',v)}/>
          <F label="University / provider" v={doc.university_name} on={v=>upd('university_name',v)}/>
          <F label="Slug" v={doc.slug} on={v=>upd('slug',v)}/>
          <F label="Country" v={doc.country} on={v=>upd('country',v)}/>
          <F label="Degree levels (comma)" v={(doc.degree_levels||[]).join(', ')} on={v=>listUpd('degree_levels', v)}/>
          <F label="Major fields (comma)" v={(doc.major_fields||[]).join(', ')} on={v=>listUpd('major_fields', v)}/>
          <F label="Eligible nationalities (comma)" v={(doc.eligible_nationalities||[]).join(', ')} on={v=>listUpd('eligible_nationalities', v)}/>
          <F label="Funding type" v={doc.funding_type} on={v=>upd('funding_type',v)}/>
          <F label="Funding amount" v={doc.funding_amount} on={v=>upd('funding_amount',v)}/>
          <F className="sm:col-span-2" label="Funding summary" v={doc.funding_summary} on={v=>upd('funding_summary',v)}/>
          <F label="Deadline status" v={doc.deadline_status} on={v=>upd('deadline_status',v)}/>
          <F label="Deadline note" v={doc.deadline_note} on={v=>upd('deadline_note',v)}/>
          <F label="Source URL" v={doc.source_url} on={v=>upd('source_url',v)}/>
          <F label="Application link" v={doc.application_link} on={v=>upd('application_link',v)}/>
          <F label="Required docs (comma)" v={(doc.required_documents||[]).join(', ')} on={v=>listUpd('required_documents',v)}/>
          <F className="sm:col-span-2" label="Eligibility summary" v={doc.eligibility_summary} on={v=>upd('eligibility_summary',v)}/>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-white/60">Trust level</label>
            <Select value={doc.trust_level} onValueChange={v=>upd('trust_level',v)}>
              <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Source-linked">Source-linked</SelectItem>
                <SelectItem value="Strongly reviewed">Strongly reviewed</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Needs source review">Needs source review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-white/60">Public status</label>
            <Select value={doc.public_status || 'public'} onValueChange={v=>upd('public_status',v)}>
              <SelectTrigger className="mt-1 bg-white/[0.04] border-white/10 text-white"><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/5">Cancel</Button>
          <Button onClick={()=>onSave(doc, isNew)} className="bg-white text-[#060608] hover:bg-white/90 btn-pill font-medium">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function F({ label, v, on, className='' }) {
  return (
    <div className={className}>
      <label className="text-[11px] uppercase tracking-widest text-white/60">{label}</label>
      <Input value={v||''} onChange={e=>on(e.target.value)} className="mt-1 bg-white/[0.04] border-white/10 text-white"/>
    </div>
  )
}

export default Admin
