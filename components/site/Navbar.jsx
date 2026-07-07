'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import { Button } from '@/components/ui/button'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/database', label: 'Database' },
  { href: '/advisor', label: 'AI Advisor' },
  { href: '/sample-report', label: 'Sample Report' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/pricing', label: 'Pricing' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E3D6] bg-[#F5F2EB]/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`rounded-md px-3 py-2 text-sm transition ${pathname===l.href ? 'text-[#0A0A0A] bg-black/[0.04]' : 'text-[#4b453b] hover:text-[#0A0A0A] hover:bg-black/[0.04]'}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard"><Button variant="ghost" className="text-[#4b453b] hover:text-[#0A0A0A] hover:bg-black/[0.04]">Dashboard</Button></Link>
          <Link href="/onboarding">
            <Button className="bg-[#0A0A0A] hover:bg-[#222] text-white btn-pill px-5">
              Check My Scholarships
            </Button>
          </Link>
        </div>
        <button className="md:hidden text-[#0A0A0A]" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-[#E8E3D6] bg-[#F5F2EB]">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${pathname===l.href ? 'text-[#0A0A0A] bg-black/[0.04]' : 'text-[#4b453b] hover:bg-black/[0.04]'}`}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/dashboard" className="flex-1" onClick={()=>setOpen(false)}>
                <Button variant="outline" className="w-full bg-transparent border-[#E8E3D6] text-[#0A0A0A] hover:bg-black/[0.04]">Dashboard</Button>
              </Link>
              <Link href="/onboarding" className="flex-1" onClick={()=>setOpen(false)}>
                <Button className="w-full bg-[#0A0A0A] hover:bg-[#222] text-white btn-pill">Check Matches</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
