'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, ShieldCheck, MapPin, GraduationCap, Sparkles, CheckCircle2, AlertCircle, Info } from 'lucide-react'

function trustColor(t) {
  const s = (t || '').toLowerCase()
  if (s.includes('verified')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (s.includes('strongly')) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
  if (s.includes('source')) return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
}

export default function ScholarshipCard({ match, onSave, onIgnore, onApply }) {
  const score = Math.round(match.overall_fit_score || 0)
  return (
    <Card className="group relative overflow-hidden card-dark rounded-2xl hover:border-white/20 transition-all">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/15 transition"/>
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <GraduationCap className="h-3.5 w-3.5"/> <span className="truncate">{match.university_name}</span>
              <span className="opacity-40">·</span>
              <MapPin className="h-3.5 w-3.5"/> <span>{match.country}</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-white leading-snug">{match.scholarship_name}</h3>
          </div>
          <div className="shrink-0 text-right">
            <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#060608]">
              <span className="text-lg font-bold">{score}</span>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/40">fit</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className={`border ${trustColor(match.trust_level)}`}>
            <ShieldCheck className="mr-1 h-3 w-3"/>{match.trust_level}
          </Badge>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">
            <Sparkles className="mr-1 h-3 w-3"/>{match.eligibility_status?.replace('_',' ') || 'insufficient info'}
          </Badge>
          {match.budget_fit && (
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">Budget: {match.budget_fit}</Badge>
          )}
          {match.application_waste_risk && (
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">Risk: {match.application_waste_risk}</Badge>
          )}
        </div>

        {match.fit_reasoning && (
          <p className="mt-4 text-sm text-white/70 leading-relaxed">{match.fit_reasoning}</p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-widest text-white/40">Funding</p>
            <p className="mt-1 text-sm text-white">{match.funding_amount || match.funding_note || 'Check official source.'}</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-widest text-white/40">Deadline</p>
            <p className="mt-1 text-sm text-white">{match.deadline_note || match.deadline_status || 'Check official source.'}</p>
          </div>
        </div>

        {(match.requirements_met?.length || match.requirements_missing?.length) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {match.requirements_met?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-emerald-300/80">Requirements met</p>
                <ul className="mt-2 space-y-1">
                  {match.requirements_met.slice(0,5).map((r,i)=>(
                    <li key={i} className="flex gap-2 text-sm text-white/90"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0"/><span>{r}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {match.requirements_missing?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-amber-300/80">To check / prepare</p>
                <ul className="mt-2 space-y-1">
                  {match.requirements_missing.slice(0,5).map((r,i)=>(
                    <li key={i} className="flex gap-2 text-sm text-white/90"><AlertCircle className="mt-0.5 h-4 w-4 text-amber-400 shrink-0"/><span>{r}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {match.next_steps?.length > 0 && (
          <div className="mt-4 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.06] p-3">
            <p className="text-[11px] uppercase tracking-widest text-cyan-300">Next steps</p>
            <ul className="mt-2 space-y-1">
              {match.next_steps.slice(0,5).map((r,i)=>(
                <li key={i} className="flex gap-2 text-sm text-white/90"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300"/><span>{r}</span></li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a href={match.source_url || match.application_link} target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button className="bg-white text-[#060608] hover:bg-white/90 btn-pill font-medium"><ExternalLink className="mr-1.5 h-4 w-4"/>Official source</Button>
          </a>
          {onApply && <Button variant="outline" onClick={()=>onApply(match)} className="border-white/15 bg-transparent text-white hover:bg-white/[0.06] btn-pill">Start application</Button>}
          {onSave && <Button variant="ghost" onClick={()=>onSave(match)} className="text-white/70 hover:text-white hover:bg-white/[0.06] btn-pill">Save</Button>}
          {onIgnore && <Button variant="ghost" onClick={()=>onIgnore(match)} className="text-white/40 hover:text-white hover:bg-white/[0.06] btn-pill">Ignore</Button>}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40"><Info className="h-3 w-3"/> Verify all details on the official source before applying. ScholarshipFit does not guarantee outcomes.</p>
      </CardContent>
    </Card>
  )
}
