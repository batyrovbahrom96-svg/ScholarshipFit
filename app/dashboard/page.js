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
import MyDocuments from '@/components/site/MyDocuments'
import MatchReportButton from '@/components/site/MatchReportButton'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import {
  LayoutDashboard, Sparkles, Bookmark, ClipboardList, CheckCircle2, XCircle, Trophy, Ban,
  FileText, User, Settings, MessageSquare, RefreshCw, Rocket, Info, Kanban,
} from 'lucide-react'
import ApplicationTracker from '@/components/site/ApplicationTracker'

const SIDEBAR = [
  { key:'recommended', label:'Recommended', icon:<Sparkles className="h-4 w-4"/> },
  { key:'advisor', label:'AI Advisor', icon:<MessageSquare className="h-4 w-4"/>, href:'/advisor' },
  { key:'matches', label:'Matches', icon:<LayoutDashboard className="h-4 w-4"/> },
  { key:'tracker', label:'Tracker', icon:<Kanban className="h-4 w-4"/> },
  { key:'saved', label:'Saved', icon:<Bookmark className="h-4 w-4"/> },
  { key:'ignored', label:'Ignored', icon:<Ban className="h-4 w-4"/> },
  { key:'documents', label:'Documents', icon:<FileText className="h-4 w-4"/> },
  { key:'profile', label:'Profile', icon:<User className="h-4 w-4"/> },
  { key:'settings', label:'Settings', icon:<Settings className="h-4 w-4"/> },
]

function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [run, setRun] = useState(null)
  const [tab, setTab] = useState('recommended')
  const [saved, setSaved] = useState({})
  const [rematching, setRematching] = useState(false)
  const [activatedCelebration, setActivatedCelebration] = useState(false)

  useEffect(() => {
    const p = store.getProfile(); const r = store.getRun()
    setProfile(p); setRun(r); setSaved(store.getSaved())
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('activated') === '1') {
        setActivatedCelebration(true)
        toast.success('Membership activated', {
          description: 'You now have full access to all scholarships & features.',
        })
        // clean the URL
        window.history.replaceState({}, '', '/dashboard')
      }
    }
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
        {activatedCelebration && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-white">Membership activated!</div>
              <div className="text-sm text-white/70">You now have full access to all 303 real scholarships, AI Match reports, Cabinet documents, and the Application Tracker. Welcome to ScholarshipFit.</div>
            </div>
            <button onClick={() => setActivatedCelebration(false)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
          </div>
        )}
        {user?.subscription_active === false && (
          <div className="mb-6 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-transparent p-5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0 text-[#D4AF37]">🔒</div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-white">Unlock the full Cabinet</div>
              <div className="text-sm text-white/70">Activate your membership to see all scholarships, AI Match reports, deadline reminders, and PDF export. From $9/mo.</div>
            </div>
            <Link href="/quiz"><Button className="btn-gold btn-pill">Activate now</Button></Link>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37]">Personal cabinet</p>
            <h1 className="text-3xl font-semibold text-white">Welcome, {profile?.full_name || 'Explorer'}</h1>
            <p className="mt-1 text-sm text-white/60">Your AI shortlist, powered by Claude Sonnet 4.5 — source-linked, honest, no invented results.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MatchReportButton profile={profile} matches={matches}/>
            <Button onClick={rerun} disabled={rematching} className="btn-gold btn-pill font-medium">
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
                      <span className="text-[#D4AF37]">{item.icon}</span>{item.label}
                    </Link>
                  ) : (
                    <button key={item.key} onClick={()=>setTab(item.key)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left ${tab===item.key ? 'bg-[#D4AF37]/10 text-white border border-[#D4AF37]/30' : 'text-white/80 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                      <span className={tab===item.key ? 'text-[#D4AF37]' : 'text-white/60'}>{item.icon}</span>{item.label}
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
              <Card className="border-[#D4AF37]/30 bg-[#D4AF37]/10">
                <CardContent className="p-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">No profile yet</h3>
                    <p className="text-sm text-white/60">Complete onboarding to see your first AI shortlist.</p>
                  </div>
                  <Link href="/onboarding"><Button className="btn-gold btn-pill font-medium"><Rocket className="mr-2 h-4 w-4"/>Start onboarding</Button></Link>
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
                  <p className="text-[11px] uppercase tracking-widest text-[#D4AF37]">AI portfolio summary</p>
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

            {/* Matches list — hidden when on documents/profile/settings tab */}
            {tab === 'tracker' ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Application Tracker</h2>
                    <p className="mt-1 text-sm text-white/50">Kanban of every scholarship you&rsquo;re working on — from shortlist to won.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <ApplicationTracker signedIn={!!user}/>
                </div>
              </div>
            ) : tab === 'documents' ? (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">My Documents</h2>
                </div>
                <div className="mt-4">
                  <MyDocuments signedIn={!!user}/>
                </div>
              </div>
            ) : (
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
            )}
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
  const m = { recommended:'Recommended matches', matches:'All matches', tracker:'Application Tracker', saved:'Saved', preparing:'Preparing', applied:'Applied', shortlisted:'Shortlisted', won:'Won', ignored:'Ignored', documents:'Documents', profile:'Profile', settings:'Settings' }
  return m[t] || t
}

export default Dashboard
