import Link from 'next/link'

export default function Logo({ size = 'md', href = '/' }) {
  const sizes = {
    sm: { text: 'text-lg', dot: 'h-6 w-6' },
    md: { text: 'text-xl', dot: 'h-7 w-7' },
    lg: { text: 'text-3xl', dot: 'h-10 w-10' },
  }
  const s = sizes[size] || sizes.md
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className={`relative ${s.dot} shrink-0`}>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600" />
        <span className="absolute inset-[3px] rounded-full bg-[#05070d]" />
        <span className="absolute inset-[7px] rounded-full bg-cyan-300 blur-[0.5px]" />
        <span className="absolute inset-[9px] rounded-full bg-white/90" />
      </span>
      <span className={`${s.text} font-semibold tracking-tight text-white`}>
        Scholarship<span className="text-cyan-400">Fit</span>
      </span>
    </Link>
  )
}
