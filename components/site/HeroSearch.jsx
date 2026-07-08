'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Sparkles } from 'lucide-react'
import { store } from '@/lib/client-store'

/* Inline ScholarshipOwl-style hero quick-search form.
   3 dropdowns + gold CTA. Persists chosen values to the user’s local
   “cabinet” (profile + recent searches) then deep-links to /database
   with filters pre-applied. */

const COUNTRIES = [
  { value: 'any', label: 'Any country' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Global', label: 'Global · Multiple' },
]

const LEVELS = [
  { value: 'any',           label: 'Any level' },
  { value: 'Undergraduate', label: "Bachelor's / Undergrad" },
  { value: "Master's",      label: "Master's / Postgrad" },
  { value: 'PhD',           label: 'PhD / Doctorate' },
  { value: 'High School',   label: 'High school' },
  { value: 'MBA',           label: 'MBA' },
]

const FIELDS = [
  { value: 'any',        label: 'Any field' },
  { value: 'STEM',       label: 'STEM · Engineering · CS' },
  { value: 'Business',   label: 'Business · Finance' },
  { value: 'Medicine',   label: 'Medicine · Health Sciences' },
  { value: 'Law',        label: 'Law · Policy' },
  { value: 'Arts',       label: 'Arts · Humanities' },
  { value: 'Sciences',   label: 'Natural Sciences' },
  { value: 'Social',     label: 'Social Sciences' },
  { value: 'Education',  label: 'Education' },
]

export default function HeroSearch() {
  const router = useRouter()
  const [country, setCountry] = useState('any')
  const [level,   setLevel]   = useState('any')
  const [field,   setField]   = useState('any')
  const [profile, setProfile] = useState(null)

  // Prefill from the user's cabinet (last profile they built)
  useEffect(() => {
    const p = store.getProfile()
    setProfile(p)
    if (p) {
      if (Array.isArray(p.preferred_countries) && p.preferred_countries[0]) setCountry(p.preferred_countries[0])
      if (p.degree_level)   setLevel(p.degree_level)
      if (p.intended_major) setField(p.intended_major)
    }
  }, [])

  const firstName = useMemo(() => {
    if (!profile?.full_name) return null
    return profile.full_name.trim().split(/\s+/)[0]
  }, [profile])

  const submit = () => {
    // Persist to cabinet
    const search = { country, level, field }
    store.addSearch(search)
    store.patchProfile({
      preferred_countries: country === 'any' ? [] : [country],
      degree_level:  level === 'any' ? '' : level,
      intended_major: field === 'any' ? '' : field,
    })
    const qs = new URLSearchParams()
    if (country !== 'any') qs.set('country', country)
    if (level   !== 'any') qs.set('level',   level)
    if (field   !== 'any') qs.set('field',   field)
    router.push('/database' + (qs.toString() ? '?' + qs.toString() : ''))
  }

  return (
    <div className="mx-auto max-w-4xl">
      {firstName && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-black/60 px-3.5 py-1.5 text-[12px] text-white/80 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]"/>
          Welcome back, <span className="text-[#D4AF37] font-medium">{firstName}</span>
          <span className="text-white/40">· We saved your search preferences</span>
        </div>
      )}

      <div className="rounded-2xl md:rounded-full border border-white/10 bg-black/60 backdrop-blur-xl p-3 md:p-2 md:pl-4 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-1"
           style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 20px 60px -20px rgba(0,0,0,0.7)' }}>

        <FieldCell label="Country">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="h-11 md:h-12 border-0 bg-transparent text-white shadow-none px-0 hover:text-[#D4AF37] focus:ring-0">
              <SelectValue placeholder="Country"/>
            </SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </FieldCell>

        <Divider/>

        <FieldCell label="Degree level">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="h-11 md:h-12 border-0 bg-transparent text-white shadow-none px-0 hover:text-[#D4AF37] focus:ring-0">
              <SelectValue placeholder="Level"/>
            </SelectTrigger>
            <SelectContent>{LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        </FieldCell>

        <Divider/>

        <FieldCell label="Field of study">
          <Select value={field} onValueChange={setField}>
            <SelectTrigger className="h-11 md:h-12 border-0 bg-transparent text-white shadow-none px-0 hover:text-[#D4AF37] focus:ring-0">
              <SelectValue placeholder="Field"/>
            </SelectTrigger>
            <SelectContent>{FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
        </FieldCell>

        <Button onClick={submit}
                className="btn-gold btn-pill h-12 md:h-14 px-5 md:px-7 font-semibold whitespace-nowrap md:ml-1 animate-gold-pulse">
          <Search className="mr-2 h-4 w-4"/> Check for Scholarships
        </Button>
      </div>

      <p className="mt-3 text-center text-[13px] text-white/60">
        It’s easy and <span className="text-[#D4AF37]">100% free</span> · Takes 30 seconds · Personalized to your profile
      </p>
    </div>
  )
}

function FieldCell({ label, children }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl md:rounded-full px-4 md:px-5 py-2 md:py-1.5 hover:bg-white/[0.04] transition">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80 md:mb-0.5">{label}</p>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="hidden md:block h-8 w-px bg-white/10 self-center"/>
}
