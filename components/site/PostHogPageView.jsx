'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !pathname) return
    let url = window.location.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url = url + '?' + qs
    posthog.capture('$pageview', {
      $current_url: url,
      pathname,
    })
  }, [pathname, searchParams, posthog])

  return null
}
