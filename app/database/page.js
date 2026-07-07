'use client'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, ShieldCheck, MapPin, GraduationCap, Search } from 'lucide-react'

function Database() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('all')
  const [degree, setDegree] = useState('all')

  useEffect(() => { fetch('/api/scholarships').then(r=>r.json()).then(d=>setItems(d.scholarships||[])) }, [])

  const countries = useMemo(()=>Array.from(new Set(items.map(i=>i.country))).sort(), [items])
  const degrees = useMemo(()=>Array.from(new Set(items.flatMap(i=>i.degree_levels||[]))).sort(), [items])

  const filtered = items.filter(s => {
    if (country!=='all' && s.country !== country) return false
    if (degree!=='all' && !(s.degree_levels||[]).includes(degree)) return false
    if (q) {
      const t = q.toLowerCase()
      const hay = [s.scholarship_name,s.university_name,s.country,(s.major_fields||[]).join(' ')].join(' ').toLowerCase()
      if (!hay.includes(t)) return false
    }
    return true
  })

  return (
    <div className="paper-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-700">Scholarship database</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-[#0A0A0A]">Source-linked records</h1>
            <p className="mt-1 text-[#6B6357]">Every record links to an official university or government source. No invented scholarships.</p>
          </div>
          <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800">{items.length} records</Badge>
        </div>

        <Card className="mt-6 border-[#E8E3D6] bg-white">
          <CardContent className="p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6357]"/>
              <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search scholarship, university, field..." className="pl-9 bg-white border-[#E8E3D6] text-[#0A0A0A] placeholder:text-[#8a8171]"/>
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[180px] bg-white border-[#E8E3D6] text-[#0A0A0A]"><SelectValue placeholder="Country"/></SelectTrigger>
              <SelectContent><SelectItem value="all">All countries</SelectItem>{countries.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger className="w-[180px] bg-white border-[#E8E3D6] text-[#0A0A0A]"><SelectValue placeholder="Degree"/></SelectTrigger>
              <SelectContent><SelectItem value="all">All levels</SelectItem>{degrees.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map(s => (
            <Card key={s.id} className="group relative overflow-hidden border-[#E8E3D6] bg-white hover:border-cyan-200 transition">
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-50 blur-3xl group-hover:bg-cyan-100"/>
              <CardContent className="relative p-5">
                <div className="flex items-center gap-2 text-xs text-[#6B6357]">
                  <GraduationCap className="h-3.5 w-3.5"/><span>{s.university_name}</span>
                  <span className="opacity-40">•</span>
                  <MapPin className="h-3.5 w-3.5"/><span>{s.country}</span>
                </div>
                <h3 className="mt-1 text-lg font-semibold text-[#0A0A0A]">{s.scholarship_name}</h3>
                <p className="mt-2 text-sm text-[#4b453b] line-clamp-3">{s.funding_summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700"><ShieldCheck className="mr-1 h-3 w-3"/>{s.trust_level}</Badge>
                  {s.degree_levels?.slice(0,3).map((d,i)=>(<Badge key={i} variant="outline" className="border-[#E8E3D6] bg-white/5 text-[#0A0A0A]">{d}</Badge>))}
                  <Badge variant="outline" className="border-[#E8E3D6] bg-white/5 text-[#0A0A0A]">{s.funding_type}</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div><p className="text-[11px] uppercase tracking-widest text-[#8a8171]">Funding</p><p className="text-[#0A0A0A]">{s.funding_amount || 'Check source'}</p></div>
                  <div><p className="text-[11px] uppercase tracking-widest text-[#8a8171]">Deadline</p><p className="text-[#0A0A0A]">{s.deadline_note || s.deadline_status}</p></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer"><Button className="bg-[#0A0A0A] text-white hover:bg-[#1a1a1a] btn-pill"><ExternalLink className="mr-2 h-4 w-4"/>Official source</Button></a>
                  {s.application_link && s.application_link !== s.source_url && (
                    <a href={s.application_link} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="border-[#E8E3D6] bg-transparent text-[#0A0A0A] hover:bg-white/5">Apply</Button></a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length===0 && (
            <Card className="border-[#E8E3D6] bg-white md:col-span-2"><CardContent className="p-10 text-center text-[#6B6357]">No records match your filters.</CardContent></Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Database
