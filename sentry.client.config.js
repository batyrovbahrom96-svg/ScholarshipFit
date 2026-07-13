// Sentry — browser (client) config.
// Runs in every page load in the user's browser.
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    // Environments: 'production' on scholarshipfit.com, 'preview' elsewhere.
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'preview',

    // Sampling — free tier gets 5k events/mo, so keep it conservative.
    tracesSampleRate: 0.1,                // 10% of transactions get performance tracing
    replaysSessionSampleRate: 0.02,       // Record 2% of ALL sessions (background)
    replaysOnErrorSampleRate: 1.0,        // Always record the session when an error occurs

    // Session Replay — records the DOM + user interactions as a video when an error happens.
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        // Never leak credentials or OTP codes into replays.
        mask:  ['input[type="password"]', 'input[name="password"]', 'input[name="otp"]', 'input[name="code"]', '.sentry-mask'],
        block: ['[data-sentry-block]'],
      }),
    ],

    // Scrub sensitive data BEFORE it leaves the browser.
    beforeSend(event) {
      // Never send passwords / tokens / OTP codes / keys.
      const scrub = (obj) => {
        if (!obj || typeof obj !== 'object') return
        for (const k of Object.keys(obj)) {
          const lower = k.toLowerCase()
          if (/pass|secret|token|otp|code|api[_-]?key|dsn|authorization/.test(lower)) obj[k] = '[Filtered]'
          else if (typeof obj[k] === 'object') scrub(obj[k])
        }
      }
      if (event?.request?.headers)  scrub(event.request.headers)
      if (event?.request?.data)     scrub(event.request.data)
      if (event?.extra)             scrub(event.extra)
      if (event?.contexts?.state)   scrub(event.contexts.state)
      // Drop noisy Chrome extension errors that we can't fix.
      if (event?.exception?.values?.[0]?.value?.includes('chrome-extension://')) return null
      return event
    },

    // Silence noisy known-safe errors.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Failed to fetch',                          // benign network flaps
      'NetworkError when attempting to fetch',
      /^Loading chunk \d+ failed/,                // stale JS after deploy
      'AbortError',
    ],
  })
}
