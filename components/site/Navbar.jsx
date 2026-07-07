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
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#060608]/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`rounded-md px-3 py-2 text-sm transition ${pathname===l.href ? 'text-white bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard"><Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">Dashboard</Button></Link>
          <Link href="/onboarding">
            <Button className="bg-white hover:bg-white/90 text-[#060608] btn-pill px-5 font-medium">
              Check My Scholarships
            </Button>
          </Link>
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#060608]">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${pathname===l.href ? 'text-white bg-white/5' : 'text-white/70 hover:bg-white/5'}`}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/dashboard" className="flex-1" onClick={()=>setOpen(false)}>
                <Button variant="outline" className="w-full bg-transparent border-white/15 text-white hover:bg-white/5">Dashboard</Button>
              </Link>
              <Link href="/onboarding" className="flex-1" onClick={()=>setOpen(false)}>
                <Button className="w-full bg-white hover:bg-white/90 text-[#060608] btn-pill font-medium">Check Matches</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
