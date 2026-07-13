// Sentry example API endpoint.
// Throws deliberately so we can verify that server-side errors are being
// captured. Safe to delete this file (and /app/sentry-example-page) once
// you've confirmed both errors reach your Sentry Issues inbox.

import { NextResponse } from 'next/server'

class SentryExampleAPIError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SentryExampleAPIError'
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  throw new SentryExampleAPIError('Sentry server-side test error — you can safely resolve this in the Sentry inbox.')
  // Unreachable, kept so the function has a valid return type:
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: false }, { status: 500 })
}
