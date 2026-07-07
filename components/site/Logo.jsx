import Link from 'next/link'

export default function Logo({ size = 'md', href = '/', variant = 'dark' }) {
  const sizes = {
    sm: { text: 'text-lg', dot: 'h-6 w-6' },
    md: { text: 'text-xl', dot: 'h-7 w-7' },
    lg: { text: 'text-3xl', dot: 'h-10 w-10' },
  }
  const s = sizes[size] || sizes.md
  const isDark = variant === 'dark'
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className={`relative ${s.dot} shrink-0`}>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-500" />
        <span className={`absolute inset-[3px] rounded-full ${isDark ? 'bg-[#F5F2EB]' : 'bg-[#05070d]'}`} />
        <span className="absolute inset-[8px] rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
      </span>
      <span className={`${s.text} font-semibold tracking-tight ${isDark ? 'text-[#0A0A0A]' : 'text-white'}`}>
        Scholarship<span className="text-gradient-brand">Fit</span>
      </span>
    </Link>
  )
}
