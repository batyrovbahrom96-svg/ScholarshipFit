// Server-side PostHog helper (Node runtime API routes).
// Usage:
//   import { captureServerEvent } from '@/lib/posthog-server'
//   await captureServerEvent({ distinctId: user.id, event: 'checkout_completed', properties: { plan } })
import { PostHog } from 'posthog-node'

let _client = null

function getClient() {
  if (_client) return _client
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  if (!key) return null
  _client = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  })
  return _client
}

export async function captureServerEvent({ distinctId, event, properties = {} }) {
  try {
    const client = getClient()
    if (!client) return
    client.capture({
      distinctId: distinctId ? String(distinctId) : 'anonymous_server',
      event,
      properties,
    })
    // Flush immediately for serverless-safe delivery
    await client.shutdown()
    _client = null
  } catch (_) { /* swallow */ }
}

export async function identifyServerUser({ distinctId, properties = {} }) {
  try {
    const client = getClient()
    if (!client || !distinctId) return
    client.identify({ distinctId: String(distinctId), properties })
    await client.shutdown()
    _client = null
  } catch (_) { /* swallow */ }
}
