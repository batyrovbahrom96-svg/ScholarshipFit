import Link from 'next/link'
import { GraduationCap, Search, Trophy, BookOpen, Bot, ArrowRight, Home } from 'lucide-react'

export const metadata = {
  title: 'Page not found · ScholarshipFit',
  description: "The scholarship or page you're looking for doesn't exist — but 800+ hand-verified scholarships still do.",
}

const QUICK_LINKS = [
  { href: '/quiz',          icon: GraduationCap, title: 'Take the 8-step Match Quiz',       body: 'Answer 8 quick questions — we rank 800+ hand-verified scholarships against your profile.' },
  { href: '/scholarships',  icon: Search,        title: 'Browse the full directory',        body: 'Filter by country, degree level, and field of study across 60+ destinations.' },
  { href: '/blog',          icon: BookOpen,      title: 'Read scholarship strategy',        body: '10 in-depth guides — from writing a winning SOP to nailing the Fulbright interview.' },
  { href: '/advisor',       icon: Bot,           title: 'Chat with Nova AI',                body: '24/7 AI advisor grounded in 800+ hand-verified records.' },
]

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#05070A] text-white overflow-hidden">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full bg-[#D4AF37]/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative container mx-auto max-w-5xl px-4 py-20 md:py-28">
        {/* Top brand row */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-amber-700">
            <GraduationCap className="h-4 w-4 text-black"/>
          </div>
          <span className="text-white/80 group-hover:text-white transition">ScholarshipFit</span>
        </Link>

        {/* Big 404 */}
        <div className="mt-14 md:mt-20 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Error 404 · Page not found</div>
          <h1 className="mt-4 text-6xl md:text-8xl font-semibold tracking-tight leading-[0.95]">
            <span className="text-white/25">Not</span>{' '}
            <span className="bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">found.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist — but{' '}
            <span className="text-white">800+ hand-verified scholarships</span> still do.
            Pick a path below and get back on track.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#E7C766] transition"
            >
              <Home className="h-4 w-4"/> Back to home
            </Link>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white hover:border-[#D4AF37]/60 hover:text-[#F0D77A] transition"
            >
              <Trophy className="h-4 w-4"/> Run the Match Quiz <ArrowRight className="h-3.5 w-3.5"/>
            </Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-16 md:mt-20">
          <div className="text-xs uppercase tracking-widest text-white/40">Or try one of these</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {QUICK_LINKS.map(({ href, icon: Icon, title, body }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-[#D4AF37]/40 hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-transparent ring-1 ring-[#D4AF37]/30 shrink-0">
                    <Icon className="h-4 w-4 text-[#D4AF37]"/>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      {title}
                      <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition"/>
                    </div>
                    <div className="mt-1 text-sm text-white/55 leading-relaxed">{body}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-16 text-center text-xs text-white/35">
          Think this is a bug? <Link href="/contact" className="underline decoration-white/20 hover:text-white/70">Report the broken link</Link> and we&apos;ll fix it.
        </div>
      </div>
    </div>
  )
}
