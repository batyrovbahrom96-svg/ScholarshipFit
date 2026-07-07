'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, ShieldCheck, MapPin, GraduationCap, Sparkles, CheckCircle2, AlertCircle, Info } from 'lucide-react'

function trustColor(t) {
  const s = (t || '').toLowerCase()
  if (s.includes('verified')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (s.includes('strongly')) return 'bg-cyan-100 text-cyan-800 border-cyan-200'
  if (s.includes('source')) return 'bg-sky-100 text-sky-800 border-sky-200'
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

export default function ScholarshipCard({ match, onSave, onIgnore, onApply }) {
  const score = Math.round(match.overall_fit_score || 0)
  return (
    <Card className="group relative overflow-hidden card-elev rounded-2xl hover:border-[#0A0A0A]/20 transition-all">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100/50 blur-3xl group-hover:bg-cyan-100/70 transition"/>
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#8a8171]">
              <GraduationCap className="h-3.5 w-3.5"/> <span className="truncate">{match.university_name}</span>
              <span className="opacity-40">·</span>
              <MapPin className="h-3.5 w-3.5"/> <span>{match.country}</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-[#0A0A0A] leading-snug">{match.scholarship_name}</h3>
          </div>
          <div className="shrink-0 text-right">
            <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0A0A0A] text-white">
              <span className="text-lg font-bold">{score}</span>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-[#8a8171]">fit</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className={`border ${trustColor(match.trust_level)}`}>
            <ShieldCheck className="mr-1 h-3 w-3"/>{match.trust_level}
          </Badge>
          <Badge variant="outline" className="border-[#E8E3D6] bg-[#F5F2EB] text-[#4b453b]">
            <Sparkles className="mr-1 h-3 w-3"/>{match.eligibility_status?.replace('_',' ') || 'insufficient info'}
          </Badge>
          {match.budget_fit && (
            <Badge variant="outline" className="border-[#E8E3D6] bg-[#F5F2EB] text-[#4b453b]">Budget: {match.budget_fit}</Badge>
          )}
          {match.application_waste_risk && (
            <Badge variant="outline" className="border-[#E8E3D6] bg-[#F5F2EB] text-[#4b453b]">Risk: {match.application_waste_risk}</Badge>
          )}
        </div>

        {match.fit_reasoning && (
          <p className="mt-4 text-sm text-[#4b453b] leading-relaxed">{match.fit_reasoning}</p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[#EDE7D8] bg-[#FAF7EF] p-3">
            <p className="text-[11px] uppercase tracking-widest text-[#8a8171]">Funding</p>
            <p className="mt-1 text-sm text-[#0A0A0A]">{match.funding_amount || match.funding_note || 'Check official source.'}</p>
          </div>
          <div className="rounded-lg border border-[#EDE7D8] bg-[#FAF7EF] p-3">
            <p className="text-[11px] uppercase tracking-widest text-[#8a8171]">Deadline</p>
            <p className="mt-1 text-sm text-[#0A0A0A]">{match.deadline_note || match.deadline_status || 'Check official source.'}</p>
          </div>
        </div>

        {(match.requirements_met?.length || match.requirements_missing?.length) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {match.requirements_met?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-emerald-700">Requirements met</p>
                <ul className="mt-2 space-y-1">
                  {match.requirements_met.slice(0,5).map((r,i)=>(
                    <li key={i} className="flex gap-2 text-sm text-[#0A0A0A]"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0"/><span>{r}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {match.requirements_missing?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-amber-700">To check / prepare</p>
                <ul className="mt-2 space-y-1">
                  {match.requirements_missing.slice(0,5).map((r,i)=>(
                    <li key={i} className="flex gap-2 text-sm text-[#0A0A0A]"><AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0"/><span>{r}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {match.next_steps?.length > 0 && (
          <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50/60 p-3">
            <p className="text-[11px] uppercase tracking-widest text-cyan-800">Next steps</p>
            <ul className="mt-2 space-y-1">
              {match.next_steps.slice(0,5).map((r,i)=>(
                <li key={i} className="flex gap-2 text-sm text-[#0A0A0A]"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-600"/><span>{r}</span></li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a href={match.source_url || match.application_link} target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button className="bg-[#0A0A0A] text-white hover:bg-[#1a1a1a] btn-pill"><ExternalLink className="mr-1.5 h-4 w-4"/>Official source</Button>
          </a>
          {onApply && <Button variant="outline" onClick={()=>onApply(match)} className="border-[#E8E3D6] bg-white text-[#0A0A0A] hover:bg-[#F5F2EB] btn-pill">Start application</Button>}
          {onSave && <Button variant="ghost" onClick={()=>onSave(match)} className="text-[#4b453b] hover:text-[#0A0A0A] hover:bg-black/[0.04] btn-pill">Save</Button>}
          {onIgnore && <Button variant="ghost" onClick={()=>onIgnore(match)} className="text-[#8a8171] hover:text-[#0A0A0A] hover:bg-black/[0.04] btn-pill">Ignore</Button>}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8a8171]"><Info className="h-3 w-3"/> Verify all details on the official source before applying. ScholarshipFit does not guarantee outcomes.</p>
      </CardContent>
    </Card>
  )
}
