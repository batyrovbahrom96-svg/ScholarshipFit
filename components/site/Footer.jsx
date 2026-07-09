import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-[#050507]">
      <div className="container mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xs">
              AI-powered, source-linked scholarship research for international students. Real records only.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><Link className="hover:text-[#D4AF37]" href="/onboarding">Match Flow</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/advisor">AI Advisor</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/database">Database</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/sample-report">Sample Report</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><Link className="hover:text-[#D4AF37]" href="/about">About</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/methodology">Methodology</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/outcomes">Outcomes</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/contact">Contact</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/admin">Admin</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><Link className="hover:text-[#D4AF37]" href="/terms">Terms of Service</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/refunds">Refund Policy</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/dpa">Data Processing</Link></li>
              <li><Link className="hover:text-[#D4AF37]" href="/dmca">DMCA &amp; Abuse</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/5 pt-6 text-xs text-white/40">
          <p>© {new Date().getFullYear()} ScholarshipFit. Informational scholarship research only. We do not guarantee admission, scholarships, visas, or funding. Users apply directly through official provider websites.</p>
        </div>
      </div>
    </footer>
  )
}
