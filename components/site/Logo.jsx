import Link from 'next/link'
import { LOGO_DATA_URI } from './logo-data'

/**
 * Logo — self-contained, bulletproof wordmark for the sticky pill navbar.
 *
 * Uses a base64-inlined WebP (~44 KB) shipped inside the JS bundle so the
 * logo can NEVER 404 — no dependency on /public/ static-asset serving,
 * no dependency on any external CDN or customer-assets URL. Works in
 * preview AND production regardless of deploy config.
 *
 * The source WebP is tightly cropped (800×166) from the original 1536×1024
 * customer-asset PNG which had ~80% transparent padding around the visible
 * wordmark.
 */
export default function Logo({ href = '/', size = 'default' }) {
  const heightClass = size === 'large'
    ? 'h-10 md:h-12 lg:h-14'
    : 'h-9  md:h-11 lg:h-12'

  return (
    <Link
      href={href}
      className="inline-flex items-center shrink-0"
      aria-label="Scholarshipfit.com home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_DATA_URI}
        alt="Scholarshipfit.com"
        width={800}
        height={166}
        className={`${heightClass} w-auto object-contain object-left`}
        draggable={false}
      />
    </Link>
  )
}
