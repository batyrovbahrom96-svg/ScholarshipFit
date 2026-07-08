import Link from 'next/link'
import Image from 'next/image'

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/qwce98g3_image.png'

export default function Logo({ href = '/', size = 'default' }) {
  // The source image has significant transparent padding around the actual
  // wordmark, so we render at a larger height AND apply a CSS scale to make
  // the visible mark prominent within the navbar/footer.
  const heightClass =
    size === 'large'
      ? 'h-24 md:h-28 lg:h-32'
      : 'h-20 md:h-24 lg:h-28'
  const scaleClass = size === 'large' ? 'scale-[1.65]' : 'scale-[1.55]'
  return (
    <Link
      href={href}
      className="inline-flex items-center whitespace-nowrap overflow-visible"
      aria-label="Scholarshipfit.com home"
    >
      <Image
        src={LOGO_URL}
        alt="Scholarshipfit.com"
        width={720}
        height={200}
        priority
        className={`${heightClass} w-auto object-contain ${scaleClass} origin-left`}
      />
    </Link>
  )
}
