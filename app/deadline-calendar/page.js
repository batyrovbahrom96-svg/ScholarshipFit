'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Printer, Calendar, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react'

/* ============================================================================
   /deadline-calendar — the deliverable for the exit-intent lead magnet.
   A print-friendly, source-linked calendar of every scholarship in the DB,
   sorted by deadline. Users hit ⌘/Ctrl-P to save as PDF or print physical.
   No auth required.
   ============================================================================ */

function fmtDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return null }
}

function monthKey(iso) {
  if (!iso) return 'Rolling / Check source'
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
  } catch { return 'Rolling / Check source' }
}

export default function DeadlineCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [scholarships, setScholarships] = useState([])

  useEffect(() => {
    fetch('/api/deadline-calendar/data')
      .then(r => r.json())
      .then(d => setScholarships(Array.isArray(d.scholarships) ? d.scholarships : []))
      .catch(() => setScholarships([]))
      .finally(() => setLoading(false))
  }, [])

  // Group by month heading
  const grouped = {}
  const groupOrder = []
  scholarships.forEach(s => {
    const iso = s.deadline_iso || (s.deadline_note ? s.deadline_note : null)
    const key = monthKey(iso)
    if (!grouped[key]) { grouped[key] = []; groupOrder.push(key) }
    grouped[key].push(s)
  })
  // Sort so months with real dates come first (already sorted from API), rolling last
  groupOrder.sort((a, b) => {
    if (a === 'Rolling / Check source') return 1
    if (b === 'Rolling / Check source') return -1
    // Preserve the API sort by earliest occurrence
    return scholarships.findIndex(s => monthKey(s.deadline_iso) === a) -
           scholarships.findIndex(s => monthKey(s.deadline_iso) === b)
  })

  return (
    <div className="min-h-screen bg-white text-neutral-900 print:bg-white print:text-black">
      {/* Screen-only toolbar (hidden in print) */}
      <div className="print:hidden sticky top-0 z-30 bg-white/95 border-b border-neutral-200 backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5"/> Back to ScholarshipFit
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-neutral-500">Tip: press ⌘/Ctrl-P to save as PDF</span>
            <Button onClick={() => typeof window !== 'undefined' && window.print()} className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white">
              <Printer className="h-4 w-4 mr-2"/> Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-10 print:py-4">
        {/* Print header */}
        <div className="mb-8 print:mb-4">
          <div className="text-xs uppercase tracking-[0.22em] text-amber-700">Scholarshipfit.com</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">2026 Scholarship Deadline Calendar</h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-2xl">
            Every one of our source-linked scholarships, sorted by deadline. Verify all details on the official source before applying — deadlines change.
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            Generated {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}Total programs: {loading ? '…' : scholarships.length}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin"/> Loading calendar…
          </div>
        ) : (
          <div className="space-y-8">
            {groupOrder.map(month => (
              <section key={month} className="break-inside-avoid">
                <div className="flex items-center gap-2 border-b border-neutral-300 pb-2">
                  <Calendar className="h-4 w-4 text-amber-700"/>
                  <h2 className="text-lg font-semibold">{month}</h2>
                  <span className="text-xs text-neutral-500">· {grouped[month].length}</span>
                </div>
                <div className="mt-3 grid gap-3">
                  {grouped[month].map(s => (
                    <div key={s.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-3 print:border-neutral-300 print:bg-white break-inside-avoid">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                            {s.university_name} · {s.country}
                          </div>
                          <div className="mt-0.5 font-semibold text-neutral-900">{s.scholarship_name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] uppercase tracking-widest text-amber-700">Deadline</div>
                          <div className="text-sm font-medium text-neutral-900">
                            {fmtDate(s.deadline_iso) || s.deadline_note || s.deadline_status || '—'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                        <span>💰 {s.funding_amount || 'Check source'}</span>
                        <span>🎓 {s.funding_type}</span>
                        {s.source_url && (
                          <a href={s.source_url} target="_blank" rel="noopener noreferrer"
                             className="text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3"/>Official source
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-neutral-200 pt-6 text-xs text-neutral-500 print:mt-4">
          <p className="font-medium text-neutral-700">Disclaimer</p>
          <p className="mt-1">
            ScholarshipFit provides informational scholarship research only. Deadlines, eligibility, and funding amounts may change without notice.
            Users apply directly through the official provider websites. We do not guarantee admission, scholarships, visas, or funding.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} Scholarshipfit.com · Source-linked scholarship intelligence.</p>
        </div>
      </div>
    </div>
  )
}
