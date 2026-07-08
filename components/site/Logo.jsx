import Link from 'next/link'
import Image from 'next/image'

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/qwce98g3_image.png'

export default function Logo({ size = 'md', href = '/' }) {
  const dims = {
    sm: { w: 140, h: 26 },
    md: { w: 180, h: 32 },
    lg: { w: 240, h: 44 },
  }
  const d = dims[size] || dims.md
  return (
    <Link href={href} className="inline-flex items-center whitespace-nowrap" aria-label="Scholarshipfit.com home">
      <Image
        src={LOGO_URL}
        alt="Scholarshipfit.com"
        width={d.w * 2}
        height={d.h * 2}
        priority
        className="h-auto object-contain"
        style={{ height: d.h, width: 'auto' }}
      />
    </Link>
  )
}
