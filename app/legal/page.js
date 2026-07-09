import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import Link from 'next/link'
import { ShieldCheck, FileText, Cookie, Scale, Copyright, Wallet, ArrowUpRight } from 'lucide-react'

export const metadata = {
  title: 'Legal Center — ScholarshipFit',
  description: 'Terms, Privacy Policy, Refund Policy, Data Processing, and DMCA reporting for ScholarshipFit.',
}

const DOCS = [
  { href: '/terms', icon: Scale, title: 'Terms of Service', desc: 'The rules of the road for using ScholarshipFit — eligibility, acceptable use, AI disclaimers, and governing law.' },
  { href: '/privacy', icon: ShieldCheck, title: 'Privacy Policy', desc: 'What we collect, how we use it, your GDPR / CCPA rights, and how to contact us for privacy requests.' },
  { href: '/refunds', icon: Wallet, title: 'Refund Policy', desc: 'Our 14-day money-back guarantee and how to request a refund.' },
  { href: '/dpa', icon: FileText, title: 'Data Processing & Sub-processors', desc: 'The vendors we share data with, our safeguards, and how to request a signed DPA.' },
  { href: '/dmca', icon: Copyright, title: 'DMCA & Abuse Reporting', desc: 'How to submit copyright takedowns or report fraud, impersonation, or safety issues.' },
]

export default function LegalIndex() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <Navbar />
      <section className="container mx-auto max-w-4xl px-4 pt-12 pb-24 md:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
          <ShieldCheck className="h-3 w-3"/>Legal Center
        </span>
        <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight">Everything, in plain English</h1>
        <p className="mt-3 text-base md:text-lg text-white/60 max-w-2xl">
          The legal, privacy, and safety documents that govern your use of ScholarshipFit. Written to be understood, not obscured.
        </p>

        <div className="mt-10 grid gap-3">
          {DOCS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#D4AF37]/30 hover:bg-white/[0.05] transition"
            >
              <div className="shrink-0 h-11 w-11 rounded-xl bg-[#D4AF37]/12 flex items-center justify-center">
                <d.icon className="h-5 w-5 text-[#D4AF37]"/>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white flex items-center gap-1.5">{d.title}<ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-[#D4AF37] transition"/></h2>
                <p className="mt-1 text-sm text-white/60 leading-relaxed">{d.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5"/>
            <div>
              <h3 className="text-base font-semibold text-white">Cookies at a glance</h3>
              <p className="mt-1 text-sm text-white/65 leading-relaxed">
                We currently use <strong className="text-white">only strictly necessary cookies</strong>: a signed session cookie
                (<code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[#F5D67B]">sf_session</code>) to keep you signed in, and technical cookies required
                for the site to function. No analytics, no advertising trackers, no third-party pixels. If we ever add any, we&rsquo;ll
                present a granular consent banner before setting them. See the <Link href="/privacy" className="text-[#D4AF37] hover:underline">Privacy Policy</Link> for details.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-white/40">Documents last updated: 7 July 2026. Contact <a href="mailto:legal@scholarshipfit.com" className="text-[#D4AF37] hover:underline">legal@scholarshipfit.com</a> for any legal or privacy request.</p>
      </section>
      <Footer />
    </div>
  )
}
