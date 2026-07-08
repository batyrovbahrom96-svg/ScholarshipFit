'use client'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ExternalLink, ShieldCheck, MapPin, GraduationCap, Search,
  Heart, Sparkles, ArrowUpDown, X, Trophy, Filter,
} from 'lucide-react'
import { store } from '@/lib/client-store'
import { ReadinessPill } from '@/components/site/Readiness'

/* ---------- category chip taxonomy (ScholarshipOwl-style) ---------- */
const CATEGORIES = [
  { key: 'all',            label: 'All',              match: () => true },
  { key: 'fully-funded',   label: 'Fully Funded',     match: (s) => (s.funding_type||'').toLowerCase().includes('fully') || (s.funding_summary||'').toLowerCase().includes('full') },
  { key: 'us',             label: 'United States',    match: (s) => s.country === 'United States' },
  { key: 'uk',             label: 'United Kingdom',   match: (s) => s.country === 'United Kingdom' },
  { key: 'europe',         label: 'Europe',           match: (s) => ['Germany','Switzerland','France','Netherlands','Sweden','Italy','Spain','Norway','Denmark','Finland','Austria','Belgium','Ireland'].includes(s.country) },
  { key: 'asia',           label: 'Asia',             match: (s) => ['Singapore','China','Japan','South Korea','Hong Kong','India','Malaysia'].includes(s.country) },
  { key: 'stem',           label: 'STEM',             match: (s) => (s.major_fields||[]).some(m => /engineer|comput|science|math|technology|physics|chem|biolog|stem/i.test(m)) },
  { key: 'business',       label: 'Business',         match: (s) => (s.major_fields||[]).some(m => /business|finance|econ|manage|mba/i.test(m)) },
  { key: 'medicine',       label: 'Medicine',         match: (s) => (s.major_fields||[]).some(m => /medic|health|nurs|pharm/i.test(m)) },
  { key: 'phd',            label: 'PhD',              match: (s) => (s.degree_levels||[]).some(d => /phd|doctor/i.test(d)) },
  { key: 'masters',        label: "Master's",         match: (s) => (s.degree_levels||[]).some(d => /master/i.test(d)) },
  { key: 'undergrad',      label: 'Undergraduate',    match: (s) => (s.degree_levels||[]).some(d => /undergrad|bachelor/i.test(d)) },
]

/* ---------- deadline sort helper ---------- */
function deadlineToTs(s) {
  const cand = s.deadline_iso || s.deadline_note || s.deadline_status
  if (!cand) return Infinity
  const t = Date.parse(cand)
  return isNaN(t) ? Infinity : t
}
function fundingSortValue(s) {
  const raw = String(s.funding_amount || '').replace(/[,$]/g, '')
  const n = parseFloat(raw)
  return isNaN(n) ? -1 : n
}

/* ============================ MAIN PAGE ============================ */
function DatabaseInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [q,       setQ]       = useState('')
  const [country, setCountry] = useState('all')
  const [degree,  setDegree]  = useState('all')
  const [cat,     setCat]     = useState('all')
  const [sort,    setSort]    = useState('deadline')
  const [showFavOnly, setShowFavOnly] = useState(false)

  const [favTick, setFavTick] = useState(0) // force re-render on favorite toggle
  const [profile, setProfile] = useState(null)
  const favSet = useMemo(() => new Set(store.getFavorites()), [favTick])

  // Load from API + init from URL params + read profile (personalization)
  useEffect(() => {
    fetch('/api/scholarships').then(r=>r.json()).then(d => {
      setItems(d.scholarships || [])
      setLoading(false)
    })
    setProfile(store.getProfile())
    const c = searchParams.get('country')
    const l = searchParams.get('level')
    const f = searchParams.get('field')
    const catParam = searchParams.get('cat')
    if (c) setCountry(c)
    if (l) setDegree(l)
    if (catParam) setCat(catParam)
    if (f) {
      // Map field of study to a category chip if possible
      const mapped = { STEM: 'stem', Business: 'business', Medicine: 'medicine' }[f]
      if (mapped && !catParam) setCat(mapped)
    }
  }, [searchParams])

  const countries = useMemo(() => Array.from(new Set(items.map(i => i.country))).sort(), [items])
  const degrees   = useMemo(() => Array.from(new Set(items.flatMap(i => i.degree_levels || []))).sort(), [items])
  const activeCategory = CATEGORIES.find(c => c.key === cat) || CATEGORIES[0]

  const filtered = useMemo(() => {
    let list = items
    if (activeCategory.key !== 'all') list = list.filter(activeCategory.match)
    if (country !== 'all') list = list.filter(s => s.country === country)
    if (degree  !== 'all') list = list.filter(s => (s.degree_levels||[]).includes(degree))
    if (showFavOnly)       list = list.filter(s => favSet.has(s.id))
    if (q) {
      const t = q.toLowerCase()
      list = list.filter(s => [
        s.scholarship_name, s.university_name, s.country, (s.major_fields||[]).join(' ')
      ].join(' ').toLowerCase().includes(t))
    }
    // Sort
    if (sort === 'deadline') list = [...list].sort((a,b) => deadlineToTs(a) - deadlineToTs(b))
    if (sort === 'funding')  list = [...list].sort((a,b) => fundingSortValue(b) - fundingSortValue(a))
    if (sort === 'name')     list = [...list].sort((a,b) => String(a.scholarship_name).localeCompare(b.scholarship_name))
    return list
  }, [items, activeCategory, country, degree, showFavOnly, q, sort, favSet])

  const toggleFav = (id) => { store.toggleFavorite(id); setFavTick(t => t + 1) }
  const clearAll = () => { setQ(''); setCountry('all'); setDegree('all'); setCat('all'); setShowFavOnly(false); router.push('/database') }

  const firstName = profile?.full_name ? profile.full_name.trim().split(/\s+/)[0] : null
  const favCount = favSet.size
  const activeFilterCount =
    (country !== 'all' ? 1 : 0) + (degree !== 'all' ? 1 : 0) + (cat !== 'all' ? 1 : 0) + (q ? 1 : 0) + (showFavOnly ? 1 : 0)

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-10">

        {/* ------- Personalized welcome banner (cabinet) ------- */}
        {firstName && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/25 bg-black/60 backdrop-blur-sm px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#D4AF37]"/>
              </div>
              <div>
                <p className="text-white font-medium">Welcome back, {firstName}</p>
                <p className="text-xs text-white/60">Your cabinet has <span className="text-[#D4AF37]">{favCount}</span> saved scholarship{favCount===1?'':'s'} · Preferences pre-applied</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard"><Button variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5 btn-pill h-9">Open Cabinet</Button></Link>
              <Link href="/onboarding"><Button className="btn-gold btn-pill h-9">Refresh matches</Button></Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37]">Scholarship database</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-white">Source-linked records</h1>
            <p className="mt-1 text-white/60">Every record links to an official university or government source. No invented scholarships.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">{items.length} verified records</Badge>
            {favCount > 0 && (
              <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]"><Heart className="mr-1 h-3 w-3 fill-[#D4AF37]"/>{favCount} saved</Badge>
            )}
          </div>
        </div>

        {/* ------- Category chips ------- */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map(c => {
            const active = cat === c.key
            return (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={`inline-flex items-center h-9 px-3.5 rounded-full text-sm transition border ${
                  active
                    ? 'btn-gold border-transparent'
                    : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06] hover:border-white/20'
                }`}>
                {c.label}
              </button>
            )
          })}
        </div>

        {/* ------- Search + filters bar ------- */}
        <Card className="mt-4 border-white/10 bg-white/[0.03]">
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60"/>
              <Input value={q} onChange={e => setQ(e.target.value)}
                     placeholder="Search scholarship, university, field..."
                     className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"/>
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[170px] bg-white/[0.04] border-white/10 text-white"><SelectValue placeholder="Country"/></SelectTrigger>
              <SelectContent><SelectItem value="all">All countries</SelectItem>{countries.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger className="w-[160px] bg-white/[0.04] border-white/10 text-white"><SelectValue placeholder="Degree"/></SelectTrigger>
              <SelectContent><SelectItem value="all">All levels</SelectItem>{degrees.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[190px] bg-white/[0.04] border-white/10 text-white">
                <ArrowUpDown className="mr-1 h-3.5 w-3.5"/><SelectValue placeholder="Sort"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline · soonest</SelectItem>
                <SelectItem value="funding">Funding · high to low</SelectItem>
                <SelectItem value="name">Name · A–Z</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => setShowFavOnly(v => !v)}
                    className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md text-sm transition border ${
                      showFavOnly
                        ? 'btn-gold border-transparent'
                        : 'bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08]'
                    }`}>
              <Heart className={`h-4 w-4 ${showFavOnly ? '' : 'text-[#D4AF37]'}`} fill={showFavOnly ? 'currentColor' : 'none'}/>
              Saved only
            </button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-white/60 hover:text-white hover:bg-white/5">
                <X className="mr-1 h-3.5 w-3.5"/> Clear ({activeFilterCount})
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-white/60">
            <Filter className="inline h-3.5 w-3.5 mr-1 -mt-0.5"/>
            Showing <span className="text-white">{filtered.length}</span> of {items.length} scholarships
            {activeCategory.key !== 'all' && <> in <span className="text-[#D4AF37]">{activeCategory.label}</span></>}
          </p>
          <Link href="/onboarding" className="text-sm text-[#D4AF37] hover:underline">Get AI-personalized ranking →</Link>
        </div>

        {/* ------- Result grid ------- */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {loading && Array.from({length: 4}).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse"/>
          ))}
          {!loading && filtered.map(s => {
            const isFav = favSet.has(s.id)
            return (
              <Card key={s.id} className="group relative overflow-hidden border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/30 transition">
                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl"/>
                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
                        <GraduationCap className="h-3.5 w-3.5"/><span className="truncate">{s.university_name}</span>
                        <span className="opacity-40">•</span>
                        <MapPin className="h-3.5 w-3.5"/><span>{s.country}</span>
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-white leading-tight">{s.scholarship_name}</h3>
                    </div>
                    <button onClick={() => toggleFav(s.id)}
                            aria-label={isFav ? 'Remove from cabinet' : 'Save to cabinet'}
                            className={`shrink-0 h-9 w-9 rounded-full border transition flex items-center justify-center ${
                              isFav
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                                : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
                            }`}>
                      <Heart className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'}/>
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-white/80 line-clamp-3">{s.funding_summary}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                      <ShieldCheck className="mr-1 h-3 w-3"/>{s.trust_level}
                    </Badge>
                    {s.degree_levels?.slice(0,3).map((d,i)=>(
                      <Badge key={i} variant="outline" className="border-white/10 bg-white/5 text-white">{d}</Badge>
                    ))}
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-white">{s.funding_type}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40">Funding</p>
                      <p className="text-white">{s.funding_amount || 'Check source'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40">Deadline</p>
                      <p className="text-white">{s.deadline_note || s.deadline_status}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer">
                      <Button className="btn-gold btn-pill font-medium"><ExternalLink className="mr-2 h-4 w-4"/>Official source</Button>
                    </a>
                    <ReadinessPill scholarshipId={s.id} scholarshipName={s.scholarship_name}/>
                    {s.application_link && s.application_link !== s.source_url && (
                      <a href={s.application_link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/5 btn-pill">Apply</Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {!loading && filtered.length === 0 && (
            <Card className="border-white/10 bg-white/[0.03] md:col-span-2">
              <CardContent className="p-10 text-center">
                <p className="text-white/70">No records match these filters.</p>
                <Button onClick={clearAll} className="mt-4 btn-gold btn-pill">Clear filters</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ------- Bottom hook to onboarding ------- */}
        <Card className="mt-8 border-[#D4AF37]/20 bg-gradient-to-br from-white/[0.04] to-transparent">
          <CardContent className="p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]">
                <Trophy className="h-3.5 w-3.5"/> Personalized cabinet
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-white">Ready to see only the ones you can win?</h3>
              <p className="mt-1 text-white/60">Build your profile once. The AI ranks every scholarship for fit, flags gaps, and saves everything to your private cabinet.</p>
            </div>
            <Link href="/onboarding">
              <Button className="btn-gold btn-pill h-12 px-6 font-semibold">Start my cabinet — free</Button>
            </Link>
          </CardContent>
        </Card>

      </div>
      <Footer />
    </div>
  )
}

/* Suspense wrapper because useSearchParams needs it in the App Router */
export default function DatabasePage() {
  return (
    <Suspense fallback={<div className="dark-bg min-h-screen"><Navbar/><div className="container mx-auto max-w-7xl px-4 py-16 text-white/60">Loading database…</div></div>}>
      <DatabaseInner />
    </Suspense>
  )
}
