// Sentry — Node.js server config.
// Runs in every API route handler.

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'preview',

    // Backend traces are cheap — 20% is safe.
    tracesSampleRate: 0.2,

    // Never send passwords / OTPs / API keys upstream.
    beforeSend(event) {
      const scrub = (obj) => {
        if (!obj || typeof obj !== 'object') return
        for (const k of Object.keys(obj)) {
          const lower = k.toLowerCase()
          if (/pass|secret|token|otp|code|api[_-]?key|dsn|authorization|cookie|session/.test(lower)) obj[k] = '[Filtered]'
          else if (typeof obj[k] === 'object') scrub(obj[k])
        }
      }
      if (event?.request?.headers)  scrub(event.request.headers)
      if (event?.request?.data)     scrub(event.request.data)
      if (event?.request?.cookies)  scrub(event.request.cookies)
      if (event?.extra)             scrub(event.extra)
      return event
    },

    ignoreErrors: [
      'ECONNRESET',                    // benign socket resets
      'MongoNetworkError',              // handled + retried elsewhere
      'AbortError',
    ],
  })
}
