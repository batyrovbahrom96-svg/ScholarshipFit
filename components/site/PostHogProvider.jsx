'use client'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProviderBase } from 'posthog-js/react'

let initialized = false

function initPostHog() {
  if (initialized) return
  if (typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  if (!key) return
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,        // handled manually below
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true, email: false },
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        // ph.debug()  // uncomment locally to see network events in console
      }
    },
  })
  initialized = true
}

export default function PostHogProvider({ children }) {
  useEffect(() => { initPostHog() }, [])
  return <PHProviderBase client={posthog}>{children}</PHProviderBase>
}
