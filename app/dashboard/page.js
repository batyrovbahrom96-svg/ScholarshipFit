'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { store } from '@/lib/client-store'
import ScholarshipCard from '@/components/site/ScholarshipCard'
import { toast } from 'sonner'
import {
  LayoutDashboard, Sparkles, Bookmark, ClipboardList, CheckCircle2, XCircle, Trophy, Ban,
  FileText, User, Settings, MessageSquare, RefreshCw, Rocket, Info
} from 'lucide-react'

const SIDEBAR = [
  { key:'recommended', label:'Recommended', icon:<Sparkles className="h-4 w-4"/> },
  { key:'advisor', label:'AI Advisor', icon:<MessageSquare className="h-4 w-4"/>, href:'/advisor' },
  { key:'matches', label:'Matches', icon:<LayoutDashboard className="h-4 w-4"/> },
  { key:'saved', label:'Saved', icon:<Bookmark className="h-4 w-4"/> },
  { key:'preparing', label:'Preparing', icon:<ClipboardList className="h-4 w-4"/> },
  { key:'applied', label:'Applied', icon:<CheckCircle2 className="h-4 w-4"/> },
  { key:'shortlisted', label:'Shortlisted', icon:<Trophy className="h-4 w-4"/> },
  { key:'won', label:'Won', icon:<Trophy className="h-4 w-4"/> },
  { key:'ignored', label:'Ignored', icon:<Ban className="h-4 w-4"/> },
  { key:'documents', label:'Documents', icon:<FileText className="h-4 w-4"/> },
  { key:'profile', label:'Profile', icon:<User className="h-4 w-4"/> },
  { key:'settings', label:'Settings', icon:<Settings className="h-4 w-4"/> },
]

function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [run, setRun] = useState(null)
  const [tab, setTab] = useState('recommended')
  const [saved, setSaved] = useState({})
  const [rematching, setRematching] = useState(false)

  useEffect(() => {
    const p = store.getProfile(); const r = store.getRun()
    setProfile(p); setRun(r); setSaved(store.getSaved())
  }, [])

  const matches = run?.result?.matches || []
  const summary = run?.result?.summary
  const advisory = run?.result?.advisory

  const stats = useMemo(() => {
    if (!matches.length) return null
    const eligible = matches.filter(m=>m.eligibility_status==='eligible' || m.eligibility_status==='likely_eligible').length
    const avg = Math.round(matches.reduce((s,m)=>s+(m.overall_fit_score||0),0)/matches.length)
    const strong = matches.filter(m=>(m.overall_fit_score||0)>=80).length
    return { total: matches.length, eligible, avg, strong }
  }, [matches])

  const setStatus = (m, s) => {
    const key = m.scholarship_id
    const next = { ...saved, [key]: s }
    setSaved(next); store.setSavedStatus(key, s)
    toast.success(`Marked as ${s}`, { description: m.scholarship_name })
  }

  const rerun = async () => {
    if (!profile) return router.push('/onboarding')
    setRematching(true)
    try {
      const mr = await fetch('/api/match', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profile })
      }).then(r=>r.json())
      if (mr.error) { toast.error('Rematch failed', { description: mr.detail || mr.error }); return }
      store.setRun(mr.run); setRun(mr.run)
      toast.success('Fresh AI shortlist ready')
    } finally { setRematching(false) }
  }

  // Filter matches by tab
  const filtered = useMemo(() => {
    if (!matches.length) return []
    if (tab === 'recommended' || tab === 'matches') return matches
    return matches.filter(m => saved[m.scholarship_id] === tab)
  }, [matches, saved, tab])

  const requiredDocs = useMemo(() => {
    const set = new Set()
    matches.slice(0,6).forEach(m => (m.requirements_missing||[]).forEach(r => set.add(r)))
    return Array.from(set).slice(0,10)
  }, [matches])

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300">Personal cabinet</p>
            <h1 className="text-3xl font-semibold text-white">Welcome, {profile?.full_name || 'Explorer'}</h1>
            <p className="mt-1 text-sm text-white/60">Your AI shortlist, powered by Claude Sonnet 4.5 — source-linked, honest, no invented results.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={rerun} disabled={rematching} className="bg-white text-[#060608] hover:bg-white/90 btn-pill font-medium">
              <RefreshCw className={`mr-2 h-4 w-4 ${rematching?'animate-spin':''}`}/>{rematching?'Rematching...':'Rerun AI match'}
            </Button>
            <Link href="/onboarding"><Button variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/5">Edit profile</Button></Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <Card className="border-white/10 bg-white/[0.03] sticky top-20">
              <CardContent className="p-3">
                <nav className="flex flex-col gap-1">
                  {SIDEBAR.map(item => item.href ? (
                    <Link key={item.key} href={item.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white">
                      <span className="text-cyan-300">{item.icon}</span>{item.label}
                    </Link>
                  ) : (
                    <button key={item.key} onClick={()=>setTab(item.key)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left ${tab===item.key ? 'bg-cyan-500/10 text-white border border-cyan-500/30' : 'text-white/80 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                      <span className={tab===item.key ? 'text-cyan-300' : 'text-white/60'}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main */}
          <div className="lg:col-span-9 space-y-6">
            {/* No profile yet */}
            {!profile && (
              <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">No profile yet</h3>
                    <p className="text-sm text-white/60">Complete onboarding to see your first AI shortlist.</p>
                  </div>
                  <Link href="/onboarding"><Button className="bg-white hover:bg-white/90 text-[#060608] btn-pill font-medium"><Rocket className="mr-2 h-4 w-4"/>Start onboarding</Button></Link>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard label="Matches" value={stats.total}/>
                <StatCard label="Eligible / likely" value={stats.eligible}/>
                <StatCard label="Strong fits (≥80)" value={stats.strong}/>
                <StatCard label="Average fit" value={stats.avg}/>
              </div>
            )}

            {/* AI Summary */}
            {(summary || advisory) && (
              <Card className="border-white/10 bg-gradient-to-br from-cyan-500/10 to-white/5">
                <CardContent className="p-5">
                  <p className="text-[11px] uppercase tracking-widest text-cyan-300">AI portfolio summary</p>
                  {summary && <p className="mt-1 text-white">{summary}</p>}
                  {advisory && <p className="mt-2 text-sm text-white/80 italic">{advisory}</p>}
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40"><Info className="h-3 w-3"/> ScholarshipFit provides informational scholarship research only. Users apply directly through official provider websites.</p>
                </CardContent>
              </Card>
            )}

            {/* Document checklist */}
            {requiredDocs.length > 0 && (
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-white/60">Document checklist — across your top matches</p>
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-white">{requiredDocs.length} items</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredDocs.map((d,i)=>(<Badge key={i} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">{d}</Badge>))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Matches list */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{tabLabel(tab)}</h2>
                {matches.length > 0 && <span className="text-sm text-white/40">{filtered.length} of {matches.length}</span>}
              </div>
              <div className="mt-4 grid gap-4">
                {filtered.length === 0 && (
                  <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-10 text-center text-white/60">
                    <p>Nothing here yet.</p>
                    <p className="mt-1 text-xs text-white/40">Try another tab or rerun the AI match.</p>
                  </CardContent></Card>
                )}
                {filtered.map((m,i)=>(
                  <ScholarshipCard key={m.scholarship_id + i} match={m}
                    onSave={x=>setStatus(x,'saved')}
                    onApply={x=>setStatus(x,'preparing')}
                    onIgnore={x=>setStatus(x,'ignored')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="p-5">
        <p className="text-[11px] uppercase tracking-widest text-white/40">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}

function tabLabel(t) {
  const m = { recommended:'Recommended matches', matches:'All matches', saved:'Saved', preparing:'Preparing', applied:'Applied', shortlisted:'Shortlisted', won:'Won', ignored:'Ignored', documents:'Documents', profile:'Profile', settings:'Settings' }
  return m[t] || t
}

export default Dashboard
