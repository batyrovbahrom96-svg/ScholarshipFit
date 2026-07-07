'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ScholarshipCard from '@/components/site/ScholarshipCard'
import { Info, Sparkles, User, GraduationCap, Globe, DollarSign, Rocket, ExternalLink, ShieldCheck } from 'lucide-react'

const SAMPLE_PROFILE = {
  full_name: 'Aisha Khan',
  nationality: 'Pakistan',
  current_country: 'Pakistan',
  degree_level: 'Master',
  intended_major: 'Mechanical Engineering',
  gpa: 3.7, gpa_scale: 4, ielts: 7.0,
  annual_budget_usd: 3000,
  preferred_countries: ['Germany','Italy','Türkiye','Hungary'],
  full_funding_only: true,
}

function SampleReport() {
  const [matches, setMatches] = useState([])
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    // Load 3 seeded matches directly from DB (no LLM cost) but present in the same UI
    fetch('/api/scholarships').then(r=>r.json()).then(d => {
      const src = d.scholarships || []
      const pick = ['turkiye-scholarships','daad-epos','padua-international-excellence','stipendium-hungaricum']
        .map(slug => src.find(s => s.slug === slug)).filter(Boolean)

      const fake = pick.map((s, i) => ({
        scholarship_id: s.id, slug: s.slug,
        scholarship_name: s.scholarship_name, university_name: s.university_name, country: s.country,
        source_url: s.source_url, application_link: s.application_link,
        trust_level: s.trust_level,
        funding_amount: s.funding_amount,
        deadline_note: s.deadline_note, deadline_status: s.deadline_status,
        overall_fit_score: [92, 78, 74, 71][i] ?? 70,
        academic_fit_score: [95, 82, 80, 76][i] ?? 75,
        scholarship_fit_score: [94, 80, 78, 75][i] ?? 72,
        budget_fit: ['excellent','excellent','good','excellent'][i] || 'good',
        eligibility_status: ['eligible','borderline','likely_eligible','likely_eligible'][i] || 'insufficient_info',
        application_waste_risk: ['low','medium','low','low'][i] || 'medium',
        requirements_met: [
          `${SAMPLE_PROFILE.degree_level} level match`,
          `${SAMPLE_PROFILE.intended_major} available`,
          'IELTS 7.0 exceeds requirement',
          `Full funding matches user requirement`
        ],
        requirements_missing: ['Passport copy','Official transcript','Reference letters'],
        fit_reasoning: `Strong alignment with ${SAMPLE_PROFILE.full_name}'s profile: ${s.funding_type} funding, ${s.country} is a preferred country, and GPA ${SAMPLE_PROFILE.gpa}/${SAMPLE_PROFILE.gpa_scale} clears the academic threshold. Verify current deadline on official source.`,
        funding_note: s.funding_summary,
        next_steps: [
          'Verify current cycle on official source URL',
          'Prepare motivation letter aligned to program aims',
          'Collect transcripts + reference letters',
          'Draft one strong application first, then reuse content',
        ],
        disclaimer_hint: 'Verify all details on the official source before applying.',
      }))
      setMatches(fake)
      setMeta({ count: fake.length, avg: Math.round(fake.reduce((a,b)=>a+b.overall_fit_score,0)/fake.length) })
    })
  }, [])

  return (
    <div className="paper-bg min-h-screen">
      <Navbar />
      <div className="relative">
        <div className="container mx-auto max-w-6xl px-4 py-10 relative">
          <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800"><Sparkles className="mr-1 h-3 w-3"/>Sample report</Badge>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-[#0A0A0A]">What your ScholarshipFit shortlist looks like</h1>
          <p className="mt-2 text-[#6B6357] max-w-3xl">A preview of the AI report ScholarshipFit generates — grounded in real, source-linked records. This is an illustrative sample built from a fictional student profile.</p>

          <Card className="mt-6 border-[#E8E3D6] bg-gradient-to-br from-cyan-50 to-white">
            <CardContent className="p-5">
              <p className="text-[11px] uppercase tracking-widest text-cyan-700">Student profile summary</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm text-[#0A0A0A]">
                <Info2 icon={<User className="h-4 w-4"/>} label={SAMPLE_PROFILE.full_name} sub={`${SAMPLE_PROFILE.nationality} → international`}/>
                <Info2 icon={<GraduationCap className="h-4 w-4"/>} label={`${SAMPLE_PROFILE.degree_level} — ${SAMPLE_PROFILE.intended_major}`} sub={`GPA ${SAMPLE_PROFILE.gpa}/${SAMPLE_PROFILE.gpa_scale} · IELTS ${SAMPLE_PROFILE.ielts}`}/>
                <Info2 icon={<Globe className="h-4 w-4"/>} label={SAMPLE_PROFILE.preferred_countries.join(', ')} sub="Preferred countries"/>
                <Info2 icon={<DollarSign className="h-4 w-4"/>} label={`$${SAMPLE_PROFILE.annual_budget_usd}/yr budget`} sub={SAMPLE_PROFILE.full_funding_only ? 'Full funding only' : 'Open to partial'}/>
              </div>
              {meta && (<p className="mt-4 text-sm text-[#4b453b]">{meta.count} source-linked matches. Average fit <span className="text-cyan-700 font-medium">{meta.avg}</span>.</p>)}
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4">
            {matches.map((m,i)=>(<ScholarshipCard key={i} match={m}/>))}
          </div>

          <Card className="mt-8 border-[#E8E3D6] bg-white">
            <CardContent className="p-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#6B6357]"><ShieldCheck className="h-3 w-3"/>Disclaimer</p>
              <p className="mt-2 text-sm text-[#4b453b]">ScholarshipFit provides informational scholarship research only. It does not guarantee admission, scholarships, visas, or funding. Users apply directly through official provider websites. All deadline / funding numbers must be re-verified on the official source before applying.</p>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/onboarding"><Button size="lg" className="bg-orange-500 hover:bg-orange-400 text-[#0A0A0A]"><Rocket className="mr-2 h-5 w-5"/>Build my real report</Button></Link>
            <Link href="/advisor"><Button size="lg" variant="outline" className="border-[#E8E3D6] bg-white text-[#0A0A0A] hover:bg-white">Ask Nova</Button></Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function Info2({ icon, label, sub }) {
  return (
    <div className="rounded-lg border border-[#E8E3D6] bg-white p-3">
      <div className="flex items-center gap-2 text-cyan-700">{icon}<span className="text-[#0A0A0A] text-sm font-medium">{label}</span></div>
      <p className="mt-1 text-xs text-[#6B6357]">{sub}</p>
    </div>
  )
}

export default SampleReport
