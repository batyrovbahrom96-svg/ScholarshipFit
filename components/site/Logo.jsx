import Link from 'next/link'
import Image from 'next/image'

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/qwce98g3_image.png'

export default function Logo({ href = '/' }) {
  return (
    <Link href={href} className="inline-flex items-center whitespace-nowrap" aria-label="Scholarshipfit.com home">
      <Image
        src={LOGO_URL}
        alt="Scholarshipfit.com"
        width={720}
        height={200}
        priority
        className="h-11 md:h-12 lg:h-14 w-auto object-contain"
      />
    </Link>
  )
}
