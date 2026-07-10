'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import AuthButton from './AuthButton'
import { Button } from '@/components/ui/button'

const LINKS = [
  { href: '/quiz', label: 'Match Quiz' },
  { href: '/database', label: 'Scholarships' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/methodology', label: 'Resources' },
  { href: '/dashboard', label: 'My Cabinet' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 pt-4">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-16 md:h-[68px] items-center justify-between rounded-full border border-white/10 bg-black/70 backdrop-blur-xl px-5 md:px-6 gap-4"
             style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 10px 40px -10px rgba(0,0,0,0.6)' }}>
          <Logo />
          <nav className="hidden md:flex items-center gap-5 lg:gap-6">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-sm whitespace-nowrap transition ${pathname===l.href ? 'text-white' : 'text-white/70 hover:text-white'}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AuthButton />
            <Link href="/quiz">
              <Button className="btn-gold btn-pill px-4 lg:px-5 h-9 text-sm font-medium">Find my scholarships</Button>
            </Link>
          </div>
          <button className="md:hidden text-white" onClick={()=>setOpen(!open)} aria-label="menu">
            {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
          </button>
        </div>
        {open && (
          <div className="md:hidden mt-2 rounded-3xl border border-white/10 bg-black/90 backdrop-blur-xl p-3">
            <div className="flex flex-col gap-1">
              {LINKS.map(l => (
                <Link key={l.href} href={l.href} onClick={()=>setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5">
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/dashboard" onClick={()=>setOpen(false)}>
                  <Button variant="outline" className="w-full bg-transparent border-white/15 text-white hover:bg-white/5">Sign in</Button>
                </Link>
                <Link href="/quiz" onClick={()=>setOpen(false)}>
                  <Button className="w-full btn-gold btn-pill font-medium">Find my scholarships</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
