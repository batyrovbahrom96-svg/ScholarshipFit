import Link from 'next/link'

export default function Logo({ size = 'md', href = '/' }) {
  const sizes = {
    sm: { text: 'text-lg', dot: 'h-6 w-6' },
    md: { text: 'text-xl', dot: 'h-7 w-7' },
    lg: { text: 'text-3xl', dot: 'h-10 w-10' },
  }
  const s = sizes[size] || sizes.md
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className={`relative ${s.dot} shrink-0`}>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 opacity-90 group-hover:opacity-100 transition"></span>
        <span className="absolute inset-[3px] rounded-full bg-[#05070d]"></span>
        <span className="absolute inset-[6px] rounded-full bg-gradient-to-br from-cyan-300 to-sky-500 blur-[2px]"></span>
        <span className="absolute -inset-1 rounded-full border border-cyan-400/25" style={{ animation: 'orbit 8s linear infinite' }} />
      </span>
      <span className={`${s.text} font-semibold tracking-tight text-white`}>
        Scholarship<span className="text-cyan-400">Fit</span>
      </span>
    </Link>
  )
}
