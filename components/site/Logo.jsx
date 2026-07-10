'use client'
import Link from 'next/link'
import { useState } from 'react'

// Primary: locally-hosted, tightly-cropped, optimised WebP (34 KB).
// Fallback: original customer-assets PNG. Guarantees the logo ALWAYS renders
// even if the local static asset isn't served on a given deploy.
const LOGO_LOCAL_WEBP = '/brand-logo.webp'
const LOGO_LOCAL_PNG  = '/brand-logo.png'
const LOGO_REMOTE     = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/qwce98g3_image.png'

/**
 * Logo — self-contained wordmark for the sticky pill navbar.
 * Uses a native <picture>/<img> (no next/image) so that if the primary
 * asset 404s (e.g. right after a fresh deploy), we can gracefully fall
 * back to the original hosted image via onError — instead of showing a
 * broken-image icon.
 *
 * Cropped source is 800×166 (the customer-assets PNG had 80% transparent
 * padding around the actual "Scholarshipfit.com" wordmark which made it
 * look tiny in the navbar).
 */
export default function Logo({ href = '/', size = 'default' }) {
  const [failed, setFailed] = useState(false)

  const heightClass = size === 'large'
    ? 'h-10 md:h-12 lg:h-14'
    : 'h-9  md:h-11 lg:h-12'

  // When the local file 404s (e.g. production deploy hasn't rolled yet),
  // fall back to the remote asset. object-position clips 80% of the empty
  // canvas in the remote image so it still looks tight in the pill.
  const remoteStyle = failed
    ? { objectFit: 'none', objectPosition: 'center', transform: 'scale(2.6)', transformOrigin: 'left center' }
    : undefined

  return (
    <Link
      href={href}
      className="inline-flex items-center shrink-0 overflow-hidden"
      aria-label="Scholarshipfit.com home"
    >
      {failed ? (
        <img
          src={LOGO_REMOTE}
          alt="Scholarshipfit.com"
          className={`${heightClass} w-auto object-contain object-left`}
          style={remoteStyle}
        />
      ) : (
        <picture>
          <source srcSet={LOGO_LOCAL_WEBP} type="image/webp" />
          <img
            src={LOGO_LOCAL_PNG}
            alt="Scholarshipfit.com"
            width={800}
            height={166}
            className={`${heightClass} w-auto object-contain object-left`}
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </Link>
  )
}
