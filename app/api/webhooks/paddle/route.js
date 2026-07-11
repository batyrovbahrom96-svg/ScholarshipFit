// Paddle Billing webhook receiver — verifies Paddle-Signature (ts + h1 HMAC
// SHA-256) against PADDLE_NOTIFICATION_SECRET, then updates the user's
// subscription based on the event payload.
//
// Signature spec: `Paddle-Signature: ts=<unix>;h1=<hmac_sha256_hex>`
// HMAC input:      `<ts>:<raw_body>`   (colon-separated; raw body, not parsed)
// Replay window:   5 minutes (reject if now-ts > 300s)
//
// Dedicated route file because raw body access is REQUIRED for signature
// verification — the [[...path]] catch-all uses request.json() which mutates
// the body stream.
//
// Events handled:
//   subscription.created / .updated / .resumed / .past_due  → activate/refresh
//   subscription.canceled / .paused                          → cancel
//   transaction.completed / .paid                            → activate lifetime (if plan=lifetime)
//   transaction.payment_failed                               → mark past_due

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME   = process.env.DB_NAME   || 'scholarshipfit'

let _client = null
async function db() {
  if (!_client) { _client = new MongoClient(MONGO_URL); await _client.connect() }
  return _client.db(DB_NAME)
}

function timingSafeEqualHex(aHex, bHex) {
  try {
    const a = Buffer.from(String(aHex || ''), 'hex')
    const b = Buffer.from(String(bHex || ''), 'hex')
    if (a.length !== b.length || a.length === 0) return false
    return crypto.timingSafeEqual(a, b)
  } catch { return false }
}

// Map Paddle subscription status → our internal status
function mapStatus(paddleStatus) {
  switch ((paddleStatus || '').toLowerCase()) {
    case 'trialing': return 'trialing'
    case 'active':   return 'active'
    case 'past_due': return 'past_due'
    case 'paused':   return 'paused'
    case 'canceled': return 'cancelled'
    default:         return paddleStatus || 'active'
  }
}

// Same PLAN_META shape we use for LemonSqueezy — kept in sync so the billing
// timeline in /dashboard/billing looks consistent regardless of processor.
const PLAN_META = {
  monthly:     { price_usd: 14.99, days: 30 },
  quarterly:   { price_usd: 29,    days: 90 },
  half_yearly: { price_usd: 49,    days: 180 },
  lifetime:    { price_usd: 79,    days: null },
}

export async function POST(request) {
  const secret = process.env.PADDLE_NOTIFICATION_SECRET
  if (!secret) {
    console.warn('[Paddle webhook] PADDLE_NOTIFICATION_SECRET not set — event ignored')
    return NextResponse.json({ ok: true, ignored: 'no-secret' })
  }

  // Read raw body FIRST (mandatory for signature verification)
  const raw = await request.text()

  // Parse the Paddle-Signature header — format: "ts=1671552777;h1=eb4d0..."
  const sigHeader = request.headers.get('paddle-signature') || ''
  const parts = Object.fromEntries(
    sigHeader.split(';').map(p => {
      const [k, v] = p.split('=')
      return [String(k || '').trim(), String(v || '').trim()]
    })
  )
  const ts = parts.ts
  const h1 = parts.h1
  if (!ts || !h1) {
    return NextResponse.json({ error: 'Malformed Paddle-Signature header' }, { status: 401 })
  }

  // Replay window (5 min) — reject old signatures
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - Number(ts)) > 300) {
    return NextResponse.json({ error: 'Signature timestamp expired' }, { status: 401 })
  }

  const expected = crypto.createHmac('sha256', secret).update(`${ts}:${raw}`).digest('hex')
  if (!timingSafeEqualHex(h1, expected)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try { payload = JSON.parse(raw) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = payload?.event_type || 'unknown'
  const data      = payload?.data       || {}
  const custom    = data?.custom_data   || {}
  const userId    = custom.user_id || null
  const planKey   = custom.plan_key || null
  const database  = await db()

  // Always audit — even signature-valid events we don't act on
  await database.collection('subscription_events').insertOne({
    id: uuidv4(),
    provider: 'paddle',
    event: eventType,
    user_id: userId,
    plan: planKey,
    paddle_id: data.id || null,
    paddle_status: data.status || null,
    raw: payload,
    created_at: new Date(),
  }).catch(() => {})

  if (!userId) {
    return NextResponse.json({ ok: true, warn: 'no user_id in custom_data', event: eventType })
  }

  const users     = database.collection('users')
  const preorders = database.collection('preorders')

  // Migrate any founder-preorder documents for this user
  await preorders.updateMany(
    { $or: [{ user_id: userId }, { email: String(data?.customer?.email || '').toLowerCase() }] },
    { $set: { status: 'migrated', migrated_at: new Date() } },
  ).catch(() => {})
  await users.updateOne(
    { id: userId, entitlement: 'founder_pending' },
    { $set: { entitlement: 'founder' } },
  ).catch(() => {})

  const meta   = PLAN_META[planKey] || {}
  const nowIso = new Date()

  if (['subscription.created', 'subscription.updated', 'subscription.resumed', 'subscription.past_due'].includes(eventType)) {
    const status   = mapStatus(data.status)
    const renewsAt = data.next_billed_at || data.current_billing_period?.ends_at || null
    const trialEnd = data.trial_dates?.ends_at || null
    const expires  = renewsAt ? new Date(renewsAt) : (meta.days
      ? new Date(nowIso.getTime() + meta.days * 24 * 60 * 60 * 1000)
      : null)

    await users.updateOne(
      { id: userId },
      { $set: {
          'subscription.plan':               planKey,
          'subscription.status':             status,
          'subscription.provider':           'paddle',
          'subscription.paddle_subscription_id': String(data.id || ''),
          'subscription.paddle_customer_id': data.customer_id ? String(data.customer_id) : null,
          'subscription.paddle_price_id':    data?.items?.[0]?.price?.id ? String(data.items[0].price.id) : null,
          'subscription.price_usd':          meta.price_usd || null,
          'subscription.billing_cycle_days': meta.days || null,
          'subscription.renews_at':          renewsAt ? new Date(renewsAt) : null,
          'subscription.trial_end':          trialEnd ? new Date(trialEnd) : null,
          'subscription.expires_at':         expires,
          'subscription.trial_used':         !!trialEnd || status === 'active',
          'subscription.activated_at':       nowIso,
          'subscription.updated_at':         nowIso,
        } },
    )
  } else if (['subscription.canceled', 'subscription.paused'].includes(eventType)) {
    await users.updateOne(
      { id: userId },
      { $set: {
          'subscription.status':       eventType === 'subscription.paused' ? 'paused' : 'cancelled',
          'subscription.cancelled_at': nowIso,
          'subscription.renews_at':    data.next_billed_at ? new Date(data.next_billed_at) : null,
          'subscription.updated_at':   nowIso,
        } },
    )
  } else if (['transaction.completed', 'transaction.paid'].includes(eventType)) {
    // Lifetime one-time purchase → activate forever. Subscription orders are
    // handled by the subscription.* events above.
    const isLifetime = planKey === 'lifetime' && data.status === 'completed'
    if (isLifetime) {
      await users.updateOne(
        { id: userId },
        { $set: {
            'subscription.plan':          'lifetime',
            'subscription.status':        'active',
            'subscription.provider':     'paddle',
            'subscription.paddle_transaction_id': String(data.id || ''),
            'subscription.price_usd':     PLAN_META.lifetime.price_usd,
            'subscription.expires_at':    null,
            'subscription.activated_at':  nowIso,
            'subscription.trial_end':     null,
            'subscription.trial_used':    true,
            'subscription.updated_at':    nowIso,
          } },
      )
    }
  } else if (eventType === 'transaction.payment_failed') {
    await users.updateOne(
      { id: userId },
      { $set: { 'subscription.status': 'past_due', 'subscription.updated_at': nowIso } },
    )
  }

  return NextResponse.json({ ok: true, handled: eventType })
}

// Public health check — lets you visit the URL in a browser to confirm the
// endpoint is live and the secret is configured.
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'ScholarshipFit Paddle Billing webhook',
    configured: !!process.env.PADDLE_NOTIFICATION_SECRET,
    env: process.env.PADDLE_ENV || 'production',
  })
}
