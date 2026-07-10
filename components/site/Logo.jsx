import Link from 'next/link'
import Image from 'next/image'

// Locally-hosted, auto-cropped tight version of the wordmark. The original
// customer asset had ~80% transparent padding around the visible content,
// which made the logo look tiny in the navbar. This version is cropped to
// the content bbox + a small breathing margin.
const LOGO_URL = '/brand-logo.png'

/**
 * Logo — clean, self-contained wordmark that does NOT overflow its container.
 * Sized to sit comfortably inside the sticky pill navbar.
 */
export default function Logo({ href = '/', size = 'default' }) {
  const sizing = size === 'large'
    ? { className: 'h-10 md:h-12 lg:h-14', w: 336, h: 70 }
    : { className: 'h-9  md:h-11 lg:h-12', w: 288, h: 60 }
  return (
    <Link
      href={href}
      className="inline-flex items-center shrink-0"
      aria-label="Scholarshipfit.com home"
    >
      <Image
        src={LOGO_URL}
        alt="Scholarshipfit.com"
        width={1011}
        height={211}
        priority
        sizes="(max-width: 768px) 220px, 340px"
        className={`${sizing.className} w-auto object-contain object-left`}
      />
    </Link>
  )
}
