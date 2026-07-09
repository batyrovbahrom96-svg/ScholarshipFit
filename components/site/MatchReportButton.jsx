'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/* ================================================================
   MatchReportButton — client-side PDF export of the AI shortlist
   Uses jsPDF (already installed). No server round-trip needed.
   Includes: cover, profile summary, top matches with source URLs,
   optional readiness scores, and a legal disclaimer.
   ================================================================ */

const GOLD = [212, 175, 55]
const INK = [26, 26, 26]
const MUTED = [110, 110, 110]

function ellipsis(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export default function MatchReportButton({ profile, matches, className }) {
  const [busy, setBusy] = useState(false)
  const disabled = !profile || !matches || matches.length === 0

  const generate = async () => {
    if (disabled) return
    setBusy(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const H = doc.internal.pageSize.getHeight()
      const M = 48
      let y = M

      const addLine = (text, {
        size = 11, weight = 'normal', color = INK, wrap = true, spacing = 6, indent = 0,
      } = {}) => {
        doc.setFont('helvetica', weight)
        doc.setFontSize(size)
        doc.setTextColor(...color)
        const maxW = W - M * 2 - indent
        const lines = wrap ? doc.splitTextToSize(String(text ?? ''), maxW) : [String(text ?? '')]
        for (const l of lines) {
          if (y > H - M - 20) { doc.addPage(); y = M }
          doc.text(l, M + indent, y)
          y += size + spacing
        }
      }
      const hr = (color = [230, 230, 230]) => {
        if (y > H - M - 20) { doc.addPage(); y = M }
        doc.setDrawColor(...color); doc.setLineWidth(0.5)
        doc.line(M, y, W - M, y); y += 12
      }
      const chip = (label, color = GOLD, x = M) => {
        doc.setDrawColor(...color); doc.setFillColor(color[0], color[1], color[2])
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
        const w = doc.getTextWidth(label) + 12
        doc.roundedRect(x, y - 9, w, 14, 3, 3, 'F')
        doc.text(label, x + 6, y + 1)
        return x + w + 4
      }

      // ---------- COVER ----------
      doc.setFillColor(10, 10, 10)
      doc.rect(0, 0, W, 120, 'F')
      doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
      doc.text('SCHOLARSHIPFIT · AI MATCH REPORT', M, 40)
      doc.setTextColor(255, 255, 255); doc.setFontSize(22)
      doc.text('Your source-linked shortlist', M, 72)
      doc.setFontSize(11); doc.setFont('helvetica', 'normal')
      doc.setTextColor(200, 200, 200)
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      doc.text(`Generated ${date}${profile?.full_name ? ` · ${profile.full_name}` : ''}`, M, 96)
      y = 152

      // ---------- STUDENT PROFILE ----------
      addLine('STUDENT PROFILE', { size: 9, weight: 'bold', color: GOLD, spacing: 4 })
      hr(GOLD)
      const pRow = (k, v) => v && addLine(`${k}: ${v}`, { size: 10.5, color: INK, spacing: 4 })
      pRow('Name', profile?.full_name || profile?.name)
      pRow('Email', profile?.email)
      pRow('Nationality', profile?.nationality)
      pRow('Degree level', profile?.degree_level)
      pRow('Intended major', profile?.intended_major)
      pRow('GPA', profile?.gpa ? `${profile.gpa}${profile?.gpa_scale ? ' / ' + profile.gpa_scale : ''}` : null)
      pRow('IELTS', profile?.ielts)
      pRow('TOEFL', profile?.toefl)
      pRow('SAT', profile?.sat)
      pRow('Achievements', profile?.achievements ? ellipsis(profile.achievements, 280) : null)
      y += 8

      // ---------- SUMMARY STATS ----------
      const total = matches.length
      const eligible = matches.filter((m) => ['eligible', 'likely_eligible'].includes(m.eligibility_status)).length
      const avg = Math.round(matches.reduce((s, m) => s + (m.overall_fit_score || 0), 0) / (matches.length || 1))
      const strong = matches.filter((m) => (m.overall_fit_score || 0) >= 80).length
      addLine('SHORTLIST OVERVIEW', { size: 9, weight: 'bold', color: GOLD, spacing: 4 })
      hr(GOLD)
      addLine(`Total matches: ${total}   ·   Eligible / Likely: ${eligible}   ·   Avg fit score: ${avg}/100   ·   Strong fits (80+): ${strong}`,
        { size: 10.5, color: INK, spacing: 4 })
      y += 8

      // ---------- MATCHES ----------
      addLine('AI-MATCHED SCHOLARSHIPS', { size: 9, weight: 'bold', color: GOLD, spacing: 4 })
      hr(GOLD)

      const top = matches.slice(0, 15)
      top.forEach((m, i) => {
        if (y > H - M - 100) { doc.addPage(); y = M }
        // Rank + name
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...INK)
        const nameLines = doc.splitTextToSize(`${i + 1}.  ${m.scholarship_name || 'Scholarship'}`, W - M * 2 - 70)
        for (const ln of nameLines) { doc.text(ln, M, y); y += 15 }

        // Chips row
        let x = M
        x = chip(`Fit ${m.overall_fit_score ?? '—'}/100`, GOLD, x)
        if (m.eligibility_status) x = chip(String(m.eligibility_status).replace('_', ' '), [40, 140, 90], x)
        if (m.funding_type) x = chip(String(m.funding_type), [80, 80, 80], x)
        y += 6

        // University · country
        doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...MUTED)
        doc.text(`${m.university_name || ''}${m.country ? ' · ' + m.country : ''}`, M, y); y += 12

        // Reasoning
        if (m.fit_reasoning) {
          addLine(m.fit_reasoning, { size: 10, color: INK, spacing: 3 })
        }
        // Requirements
        if (m.requirements_met?.length) {
          addLine(`Met: ${(m.requirements_met || []).join(' · ')}`, { size: 9.5, color: [40, 140, 90], spacing: 3 })
        }
        if (m.requirements_missing?.length) {
          addLine(`Missing: ${(m.requirements_missing || []).join(' · ')}`, { size: 9.5, color: [180, 90, 40], spacing: 3 })
        }
        // Deadline + funding notes
        if (m.deadline_note) addLine(`Deadline: ${m.deadline_note}`, { size: 9.5, color: MUTED, spacing: 3 })
        if (m.funding_summary) addLine(`Funding: ${ellipsis(m.funding_summary, 240)}`, { size: 9.5, color: MUTED, spacing: 3 })
        // Source URL — clickable
        if (m.source_url) {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(30, 100, 200)
          const url = ellipsis(m.source_url, 100)
          if (y > H - M - 20) { doc.addPage(); y = M }
          doc.textWithLink(`Official source → ${url}`, M, y, { url: m.source_url })
          y += 14
        }
        y += 6
        hr()
      })

      // ---------- DISCLAIMER ----------
      if (y > H - M - 120) { doc.addPage(); y = M }
      addLine('DISCLAIMER', { size: 9, weight: 'bold', color: GOLD, spacing: 4 })
      hr(GOLD)
      addLine(
        'ScholarshipFit is an AI-powered research and matching tool. We do not guarantee admission, scholarship award, or eligibility. '
        + 'Every scholarship record links to its official source — always verify deadlines, funding, and eligibility on the official page before applying. '
        + 'AI reasoning is a decision-support signal, not admissions advice.',
        { size: 9.5, color: MUTED, spacing: 4 },
      )
      y += 6
      addLine('Report generated by ScholarshipFit · scholarshipfit.com', { size: 8.5, color: MUTED })

      // ---------- FOOTER (page numbers) ----------
      const total_pages = doc.internal.getNumberOfPages()
      for (let p = 1; p <= total_pages; p++) {
        doc.setPage(p)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED)
        doc.text(`Page ${p} of ${total_pages}`, W - M, H - 20, { align: 'right' })
        doc.text('ScholarshipFit · Source-linked · Not a guarantee of admission', M, H - 20)
      }

      const nameSlug = (profile?.full_name || profile?.name || 'match-report')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      doc.save(`scholarshipfit-report-${nameSlug}.pdf`)
      toast.success('Report downloaded', { description: 'Check your Downloads folder.' })
    } catch (e) {
      toast.error('Could not build the report', { description: String(e?.message || e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      onClick={generate}
      disabled={disabled || busy}
      variant="outline"
      className={`btn-pill border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 h-10 ${className || ''}`}
      title={disabled ? 'Run the AI match first' : 'Download your match report as a PDF'}
    >
      {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin"/> : <Download className="h-4 w-4 mr-1.5"/>}
      {busy ? 'Building PDF…' : 'Download PDF'}
    </Button>
  )
}
