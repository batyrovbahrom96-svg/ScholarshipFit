import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { ShieldCheck } from 'lucide-react'

/*
  Shared shell for /privacy, /terms, /refunds, /dpa, /dmca, /legal.
  Provides consistent luxury dark theme + typography for legal copy.
*/
export default function LegalPageShell({ title, subtitle, updated, children }) {
  return (
    <div className="min-h-dvh bg-black text-white">
      <Navbar />
      <section className="container mx-auto max-w-3xl px-4 pt-12 pb-24 md:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
          <ShieldCheck className="h-3 w-3"/>Legal
        </span>
        <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-base md:text-lg text-white/60">{subtitle}</p>}
        {updated && <p className="mt-4 text-xs text-white/40">Last updated: {updated}</p>}
        <div className="legal-body mt-10 text-[15px] leading-[1.75] text-white/80">
          {children}
        </div>
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-xs text-white/55 leading-relaxed">
          <p><strong className="text-white/80">Questions?</strong> Reach us at <a href="mailto:legal@scholarshipfit.com" className="text-[#D4AF37] hover:underline">legal@scholarshipfit.com</a>. For privacy-specific inquiries, use <a href="mailto:legal@scholarshipfit.com?subject=Privacy%20Request" className="text-[#D4AF37] hover:underline">legal@scholarshipfit.com</a>.</p>
        </div>
        <p className="mt-6 text-[11px] text-white/35 leading-relaxed">
          This document is provided by ScholarshipFit Ltd (Uzbekistan). It is written in plain English for readability; it is not a substitute for legal advice. Where translations exist, the English text governs in the event of a conflict.
        </p>
      </section>
      <Footer />
    </div>
  )
}
