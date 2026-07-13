// Next.js instrumentation entry \u2014 auto-loaded once per server process.
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//
// We branch on runtime so Sentry loads with the right config for Node vs Edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Global request-error handler \u2014 lets Sentry capture unhandled errors in
// server actions, route handlers, and RSCs (Next.js 15+ hook).
export async function onRequestError(err, request, context) {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError?.(err, request, context)
}
