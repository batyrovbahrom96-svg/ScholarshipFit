import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-[#E8E3D6] bg-[#EFEBE1]">
      <div className="container mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-[#6B6357] max-w-xs">
              AI-powered, source-linked scholarship research for international students. Real records only.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8a8171]">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-[#3a352d]">
              <li><Link className="hover:text-black" href="/onboarding">Match Flow</Link></li>
              <li><Link className="hover:text-black" href="/advisor">AI Advisor</Link></li>
              <li><Link className="hover:text-black" href="/database">Database</Link></li>
              <li><Link className="hover:text-black" href="/sample-report">Sample Report</Link></li>
              <li><Link className="hover:text-black" href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8a8171]">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-[#3a352d]">
              <li><Link className="hover:text-black" href="/about">About</Link></li>
              <li><Link className="hover:text-black" href="/methodology">Methodology</Link></li>
              <li><Link className="hover:text-black" href="/outcomes">Outcomes</Link></li>
              <li><Link className="hover:text-black" href="/contact">Contact</Link></li>
              <li><Link className="hover:text-black" href="/admin">Admin</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8a8171]">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-[#3a352d]">
              <li><Link className="hover:text-black" href="/legal#terms">Terms</Link></li>
              <li><Link className="hover:text-black" href="/legal#privacy">Privacy</Link></li>
              <li><Link className="hover:text-black" href="/legal#disclaimer">Disclaimer</Link></li>
              <li><Link className="hover:text-black" href="/legal#refund">Refund policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[#E8E3D6] pt-6 text-xs text-[#8a8171]">
          <p>© {new Date().getFullYear()} ScholarshipFit. Informational scholarship research only. We do not guarantee admission, scholarships, visas, or funding. Users apply directly through official provider websites.</p>
        </div>
      </div>
    </footer>
  )
}
