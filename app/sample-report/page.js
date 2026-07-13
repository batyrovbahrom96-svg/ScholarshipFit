'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ScholarshipCard from '@/components/site/ScholarshipCard'
import {
  Info, Sparkles, User, GraduationCap, Globe, DollarSign, Rocket,
  ExternalLink, ShieldCheck, Loader2, Clock, Database, Filter, Trophy,
  CheckCircle2, XCircle, TrendingUp,
} from 'lucide-react'

// -----------------------------------------------------------------------------
// A fixed, illustrative student profile — real records still, but no LLM cost.
// -----------------------------------------------------------------------------
const SAMPLE_PROFILE = {
  full_name: 'Aisha Khan',
  first_name: 'Aisha',
  nationality: 'Pakistan',
  current_country: 'Pakistan',
  degree_level: 'Master',
  intended_major: 'Mechanical Engineering',
  gpa: 3.7,
  gpa_scale: 4,
  ielts: 7.0,
  annual_budget_usd: 3000,
  preferred_countries: ['Germany', 'Italy', 'Türkiye', 'Hungary'],
  full_funding_only: true,
}

// Fit-scores + risk levels chosen to demonstrate variety on the card grid.
const SAMPLE_META = [
  { fit: 92, ac: 95, sc: 94, budget: 'excellent', elig: 'eligible',        risk: 'low',    warnings: [] },
  { fit: 78, ac: 82, sc: 80, budget: 'excellent', elig: 'borderline',     risk: 'medium', warnings: ['Language proficiency close to threshold — verify current requirement'] },
  { fit: 74, ac: 80, sc: 78, budget: 'good',      elig: 'likely_eligible', risk: 'medium', warnings: ['Field of study is not the scholarship\u2019s primary focus'] },
  { fit: 71, ac: 76, sc: 75, budget: 'excellent', elig: 'likely_eligible', risk: 'low',    warnings: [] },
]

function SampleReport() {
  const [matches, setMatches] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scholarships').then(r => r.json()).then(d => {
      const src = d.scholarships || []
      const pickSlugs = [
        'turkiye-scholarships',
        'daad-epos',
        'padua-international-excellence',
        'stipendium-hungaricum',
      ]
      const pick = pickSlugs.map(slug => src.find(s => s.slug === slug)).filter(Boolean)

      const built = pick.map((s, i) => {
        const meta = SAMPLE_META[i] || SAMPLE_META[SAMPLE_META.length - 1]
        return {
          scholarship_id: s.id,
          slug: s.slug,
          scholarship_name: s.scholarship_name,
          university_name: s.university_name,
          country: s.country,
          source_url: s.source_url,
          application_link: s.application_link,
          trust_level: s.trust_level,
          funding_amount: s.funding_amount,
          deadline_note: s.deadline_note,
          deadline_status: s.deadline_status,
          overall_fit_score: meta.fit,
          academic_fit_score: meta.ac,
          scholarship_fit_score: meta.sc,
          budget_fit: meta.budget,
          eligibility_status: meta.elig,
          application_waste_risk: meta.risk,
          risk_level: meta.risk,
          warnings: meta.warnings,
          requirements_met: [
            `${SAMPLE_PROFILE.degree_level} level match`,
            `${SAMPLE_PROFILE.intended_major} available`,
            'IELTS 7.0 exceeds requirement',
            'Full funding matches user requirement',
          ],
          requirements_missing: ['Passport copy', 'Official transcript', 'Reference letters'],
          fit_reasoning: `Strong alignment with ${SAMPLE_PROFILE.full_name}'s profile: ${s.funding_type} funding, ${s.country} is a preferred country, and GPA ${SAMPLE_PROFILE.gpa}/${SAMPLE_PROFILE.gpa_scale} clears the academic threshold. Verify current deadline on official source.`,
          funding_note: s.funding_summary,
          next_steps: [
            'Verify current cycle on official source URL',
            'Prepare motivation letter aligned to program aims',
            'Collect transcripts + reference letters',
            'Draft one strong application first, then reuse content',
          ],
          disclaimer_hint: 'Verify all details on the official source before applying.',
        }
      })
      setMatches(built)
      setMeta({
        count: built.length,
        avg: Math.round(built.reduce((a, b) => a + b.overall_fit_score, 0) / (built.length || 1)),
        evaluated: 800,
        totalWorth: 120000, // illustrative
        strong: built.filter(m => m.overall_fit_score >= 80).length,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="dark-bg min-h-screen">
      <Navbar />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(closest-side,rgba(212,175,55,0.14),transparent_70%)]"/>

        <div className="container mx-auto max-w-6xl px-4 pt-10 pb-16 relative">
          <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">
            <Sparkles className="mr-1 h-3 w-3"/>Sample report
          </Badge>

          {/* HERO — mirrors the /quiz results header */}
          <div className="mt-4 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent p-8 md:p-10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37]">
              <Sparkles className="h-4 w-4"/> Illustrative — fictional student profile
            </div>
            <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight leading-tight text-white">
              Hi {SAMPLE_PROFILE.first_name}, we found{' '}
              <span className="text-[#D4AF37]">{meta?.count ?? 4} real scholarships</span>
              {' '}worth up to <span className="text-emerald-400">${(meta?.totalWorth || 120000).toLocaleString()}</span>
            </h1>
            <p className="mt-3 text-white/70 max-w-3xl">
              This is what a real ScholarshipFit report looks like — every match below is a real, source-linked program.
              Nothing invented. Yours will be built from your own profile after the quiz.
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCell value={meta?.count ?? 4} label="Matched scholarships" tone="white"/>
              <StatCell value={`${meta?.strong ?? 1}`} label="Strong-fit (≥80)" tone="emerald"/>
              <StatCell value={`${meta?.evaluated ?? 800}`} label="Records evaluated" tone="gold"/>
              <StatCell value={`~${Math.round((meta?.evaluated ?? 800) * 0.05)}h`} label="Time saved for you" tone="white"/>
            </div>
          </div>

          {/* Student profile card */}
          <Card className="mt-6 border-white/10 bg-gradient-to-br from-cyan-500/10 to-white/5">
            <CardContent className="p-5">
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Student profile summary</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm text-white">
                <Info2 icon={<User className="h-4 w-4"/>} label={SAMPLE_PROFILE.full_name} sub={`${SAMPLE_PROFILE.nationality} → international`}/>
                <Info2 icon={<GraduationCap className="h-4 w-4"/>} label={`${SAMPLE_PROFILE.degree_level} — ${SAMPLE_PROFILE.intended_major}`} sub={`GPA ${SAMPLE_PROFILE.gpa}/${SAMPLE_PROFILE.gpa_scale} · IELTS ${SAMPLE_PROFILE.ielts}`}/>
                <Info2 icon={<Globe className="h-4 w-4"/>} label={SAMPLE_PROFILE.preferred_countries.join(', ')} sub="Preferred countries"/>
                <Info2 icon={<DollarSign className="h-4 w-4"/>} label={`$${SAMPLE_PROFILE.annual_budget_usd}/yr budget`} sub={SAMPLE_PROFILE.full_funding_only ? 'Full funding only' : 'Open to partial'}/>
              </div>
              {meta && (
                <p className="mt-4 text-sm text-white/80">
                  {meta.count} source-linked matches. Average fit{' '}
                  <span className="text-[#D4AF37] font-medium">{meta.avg}</span>.
                </p>
              )}
            </CardContent>
          </Card>

          {/* How ScholarshipFit built this — the AI Command Center pitch */}
          <div className="mt-10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
              <TrendingUp className="h-4 w-4"/> How ScholarshipFit built this
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <StepCell n="1" icon={User}         title="Profile intake"    body="Parses 8 answers from the quiz — degree, field, nationality, GPA, language, funding preference, timeline, financial need."/>
              <StepCell n="2" icon={Filter}       title="Eligibility gate"  body="Hard-filters programs by nationality + degree level — ineligible matches are removed before scoring."/>
              <StepCell n="3" icon={Database}     title="Deterministic scoring" body="Rules-based fit engine ranks 800 hand-verified, source-linked records — no dead links, no aggregator spam, no hallucinated data."/>
              <StepCell n="4" icon={Trophy}       title="Top matches + risks" body="Best-fit scholarships surface with source URLs, funding, deadlines, gaps and application-waste warnings."/>
            </div>
          </div>

          {/* Match cards */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
              <Trophy className="h-4 w-4"/> Sample matches — real programs, illustrative fit scores
            </div>
            {loading ? (
              <div className="grid gap-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.03] h-52"/>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <Card className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-6 text-center text-white/60">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2"/>
                  Loading sample matches…
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {matches.map((m, i) => <ScholarshipCard key={i} match={m}/>)}
              </div>
            )}
          </div>

          {/* Before / after time block */}
          <Card className="mt-10 border-white/10 bg-gradient-to-br from-[#D4AF37]/8 to-white/[0.02]">
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-widest text-red-300 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5"/> Without ScholarshipFit
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">15–30 hours lost</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400"/>Endless tabs. Broken links. Scholarships that closed last year.</li>
                    <li className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400"/>No idea if you&apos;re actually eligible before you start writing essays.</li>
                    <li className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400"/>Missed deadlines. Duplicate work. Zero visibility on fit.</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-emerald-300 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5"/> With ScholarshipFit
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">Shortlist in 3 minutes</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>Only scholarships that fit your profile — with fit score + why matched.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>Application-waste warnings before you invest time.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>Source URLs, deadlines, readiness score — all in one command center.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="mt-8 border-white/10 bg-white/[0.03]">
            <CardContent className="p-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/60">
                <ShieldCheck className="h-3 w-3"/> Disclaimer
              </p>
              <p className="mt-2 text-sm text-white/80">
                ScholarshipFit provides informational scholarship research only. It does not guarantee admission, scholarships,
                visas, or funding. Users apply directly through official provider websites. All deadline / funding numbers must
                be re-verified on the official source before applying.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-10 rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/15 via-[#0A0A0A] to-[#0A0A0A] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none"/>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                  Build your own report — from your real profile
                </h2>
                <p className="mt-2 text-white/70 max-w-2xl">
                  Answer 8 quick questions. We rank 800 hand-verified, premium scholarships against your profile in seconds. No dead links. No aggregator spam.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link href="/quiz">
                  <Button size="lg" className="btn-gold btn-pill h-12 px-8 font-semibold text-black">
                    <Rocket className="mr-2 h-4 w-4"/>Start my quiz
                  </Button>
                </Link>
                <Link href="/database">
                  <Button size="lg" variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] h-12 px-6">
                    Browse the library
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Info2({ icon, label, sub }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-[#D4AF37]">
        {icon}
        <span className="text-white text-sm font-medium">{label}</span>
      </div>
      <p className="mt-1 text-xs text-white/60">{sub}</p>
    </div>
  )
}

function StatCell({ value, label, tone = 'white' }) {
  const toneCls = tone === 'emerald' ? 'text-emerald-400' : tone === 'gold' ? 'text-[#D4AF37]' : 'text-white'
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  )
}

function StepCell({ n, icon: Icon, title, body }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold">
          {n}
        </div>
        <Icon className="h-4 w-4 text-white/60"/>
        <div className="text-sm font-medium text-white">{title}</div>
      </div>
      <p className="mt-2 text-xs text-white/60 leading-relaxed">{body}</p>
    </div>
  )
}

export default SampleReport
