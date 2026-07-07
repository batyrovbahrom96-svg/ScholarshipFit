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
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500" />
        <span className="absolute inset-[3px] rounded-full bg-[#060608]" />
        <span className="absolute inset-[7px] rounded-full bg-gradient-to-br from-cyan-300 to-blue-400" />
      </span>
      <span className={`${s.text} font-semibold tracking-tight text-white`}>
        Scholarship<span className="text-gradient-brand">Fit</span>
      </span>
    </Link>
  )
}
