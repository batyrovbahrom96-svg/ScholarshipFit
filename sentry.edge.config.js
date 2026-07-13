// Sentry — Edge runtime config.
// Runs in Next.js middleware and edge routes (e.g. /opengraph-image).

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'preview',
    tracesSampleRate: 0.1,
  })
}
