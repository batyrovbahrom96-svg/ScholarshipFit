'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogIn, LogOut, Sparkles, LayoutDashboard, CreditCard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function AuthButton({ compact = false }) {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div className="h-9 w-16 rounded-full bg-white/[0.04] border border-white/10 animate-pulse"/>

  if (!user) {
    const returnTo = (typeof window !== 'undefined') ? window.location.pathname + window.location.search : '/dashboard'
    return (
      <div className="flex items-center gap-1">
        <Link href={`/login?return=${encodeURIComponent(returnTo)}`}>
          <Button
            variant="ghost"
            className={`text-white hover:text-[#D4AF37] hover:bg-white/5 ${compact ? 'h-9 px-3' : 'h-9 px-4'}`}
          >
            <LogIn className="h-4 w-4 mr-1.5"/>Sign in
          </Button>
        </Link>
      </div>
    )
  }

  const initials = (user.name || user.email || '?').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#D4AF37]/40 px-1.5 pr-3 transition">
          {user.picture
            ? <img src={user.picture} alt={user.name} className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer"/>
            : <span className="h-7 w-7 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-medium">{initials}</span>}
          <span className="text-sm text-white/85 max-w-[110px] truncate hidden md:inline">{user.name || user.email}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-black/95 border-white/10 text-white">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm text-white">{user.name || 'Signed in'}</span>
            <span className="text-xs text-white/50 truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10"/>
        <DropdownMenuItem asChild><Link href="/dashboard" className="cursor-pointer"><LayoutDashboard className="h-4 w-4 mr-2"/>My cabinet</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/onboarding" className="cursor-pointer"><Sparkles className="h-4 w-4 mr-2 text-[#D4AF37]"/>Refresh matches</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/billing" className="cursor-pointer"><CreditCard className="h-4 w-4 mr-2"/>Billing &amp; subscription</Link></DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10"/>
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-300 focus:text-red-200"><LogOut className="h-4 w-4 mr-2"/>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
