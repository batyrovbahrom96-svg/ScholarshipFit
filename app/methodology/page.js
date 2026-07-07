'use client'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, ShieldCheck, Link2, AlertOctagon, Check, XCircle } from 'lucide-react'

function Methodology() {
  return (
    <div className="paper-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800">Methodology</Badge>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-[#0A0A0A]">How ScholarshipFit works — and where it stops</h1>
        <p className="mt-2 text-[#6B6357]">Transparent scoring, source-linked records, honest limits.</p>

        <Section title="How matching works" icon={<Brain className="h-4 w-4"/>}>
          <p>Your profile is compared against every scholarship record in our source-linked database using Claude Sonnet 4.5 as the reasoning engine. The AI produces a fit score (0–100) built from the following weighted signals:</p>
          <ul className="mt-3 grid gap-1 text-[#4b453b] [&>li]:list-disc [&>li]:ml-6">
            <li>Degree level match (20)</li>
            <li>Field of study match (20)</li>
            <li>Nationality eligibility (15)</li>
            <li>Academic thresholds — GPA + IELTS/TOEFL (15)</li>
            <li>Country preference alignment (10)</li>
            <li>Funding vs your budget (10)</li>
            <li>Deadline realism / application effort (5)</li>
            <li>Trust level and data quality of the record (5)</li>
          </ul>
          <p className="mt-3">The engine also produces academic fit, scholarship fit, budget fit, eligibility status, application waste risk, requirements met/missing, fit reasoning, and next steps — all grounded in the DATABASE record fields.</p>
        </Section>

        <Section title="What source-linked means" icon={<Link2 className="h-4 w-4"/>}>
          <p>A record is <em>source-linked</em> when it is captured directly from the official university or government portal, and the URL is stored alongside the record. Every recommendation ScholarshipFit shows you must carry its source URL for verification.</p>
        </Section>

        <Section title="What verified means" icon={<ShieldCheck className="h-4 w-4"/>}>
          <p><strong>Source-linked</strong> — sourced from an official page and URL stored.</p>
          <p><strong>Strongly reviewed</strong> — cross-checked by a ScholarshipFit editor against the provider’s public documentation.</p>
          <p><strong>Verified</strong> — reviewed and confirmed by the provider or a subject-matter expert.</p>
          <p><strong>Needs source review</strong> — missing or unclear source; hidden from public pages until fixed.</p>
        </Section>

        <Section title="What the AI can do" icon={<Check className="h-4 w-4"/>}>
          <ul className="grid gap-1 text-[#4b453b] [&>li]:list-disc [&>li]:ml-6">
            <li>Match your profile to real, source-linked records</li>
            <li>Explain why a scholarship fits (or does not)</li>
            <li>Highlight requirements you already meet and those you’re missing</li>
            <li>Suggest concrete next steps and reduce application waste</li>
          </ul>
        </Section>

        <Section title="What the AI cannot do" icon={<XCircle className="h-4 w-4"/>}>
          <ul className="grid gap-1 text-[#4b453b] [&>li]:list-disc [&>li]:ml-6">
            <li>Guarantee admission, scholarships, visas, or funding</li>
            <li>Invent scholarships, universities, deadlines, or funding amounts</li>
            <li>Submit applications on your behalf</li>
            <li>Replace the official provider’s eligibility check — always verify on the source URL</li>
          </ul>
        </Section>

        <Section title="Why users must check official sources" icon={<AlertOctagon className="h-4 w-4"/>}>
          <p>Scholarship rules and deadlines change every year. Even our best-verified record can be superseded by a provider update. Treat ScholarshipFit as a research accelerator, not a system of record. Before applying, always open the official source URL, confirm the current cycle, and verify eligibility.</p>
        </Section>

        <p className="mt-8 text-xs text-[#8a8171]">Individual results vary. ScholarshipFit does not guarantee similar outcomes.</p>
      </div>
      <Footer />
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <Card className="mt-6 border-[#E8E3D6] bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-cyan-700">{icon}<h2 className="text-[#0A0A0A] text-lg font-semibold">{title}</h2></div>
        <div className="mt-3 space-y-2 text-[#4b453b] leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  )
}

export default Methodology
