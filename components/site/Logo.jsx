import Link from 'next/link'
import Image from 'next/image'

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/qwce98g3_image.png'

/**
 * Logo — clean, self-contained wordmark that does NOT overflow its container.
 * Previously used aggressive CSS scale which caused the "Scholarshipfit.com"
 * wordmark to collide with the next nav link on the right. Fixed by using
 * an explicit width/height and letting object-contain do the work.
 */
export default function Logo({ href = '/', size = 'default' }) {
  const sizing = size === 'large'
    ? { className: 'h-10 md:h-11 lg:h-12', w: 260, h: 60 }
    : { className: 'h-9  md:h-10 lg:h-11', w: 220, h: 52 }
  return (
    <Link
      href={href}
      className="inline-flex items-center shrink-0"
      aria-label="Scholarshipfit.com home"
    >
      <Image
        src={LOGO_URL}
        alt="Scholarshipfit.com"
        width={sizing.w}
        height={sizing.h}
        priority
        sizes="(max-width: 768px) 200px, 260px"
        className={`${sizing.className} w-auto object-contain object-left`}
      />
    </Link>
  )
}
