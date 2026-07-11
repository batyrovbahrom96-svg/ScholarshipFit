// LemonSqueezy webhook receiver — verifies HMAC-SHA256 signature against
// LEMONSQUEEZY_WEBHOOK_SECRET (Signing Secret from LS dashboard), then updates
// the user's subscription based on the event payload.
//
// IMPORTANT: This file is intentionally its own route (not part of the
// [[...path]] catch-all) so we can read the RAW request body BEFORE parsing —
// signature verification requires the exact byte-for-byte payload.
//
// Events we handle:
//   subscription_created / subscription_updated / subscription_payment_success
//     → set user.subscription.status = 'active' | 'trialing', persist LS ids
//   subscription_cancelled / subscription_expired / subscription_payment_failed
//     → set user.subscription.status = 'cancelled' | 'expired' | 'past_due'
//   order_created (lifetime one-time purchase)
//     → activate lifetime access
// Any preorder document tagged for this user is marked 'migrated'.

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { getPostHogClient } from '@/lib/posthog-server'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME   = process.env.DB_NAME   || 'scholarshipfit'

let _client = null
async function db() {
  if (!_client) {
    _client = new MongoClient(MONGO_URL)
    await _client.connect()
  }
  return _client.db(DB_NAME)
}

function timingSafeEqualHex(aHex, bHex) {
  const a = Buffer.from(aHex, 'hex')
  const b = Buffer.from(bHex, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// Map LS subscription status → our internal status.
function mapStatus(lsStatus) {
  switch ((lsStatus || '').toLowerCase()) {
    case 'on_trial': return 'trialing'
    case 'active':   return 'active'
    case 'paused':   return 'paused'
    case 'past_due': return 'past_due'
    case 'unpaid':   return 'past_due'
    case 'cancelled':return 'cancelled'
    case 'expired':  return 'expired'
    default:         return lsStatus || 'active'
  }
}

// Plan pricing (mirrors /lib/pricing-plans.js on the server side so we can
// stamp price_usd / expires_at from the webhook if LS didn't include it).
const PLAN_META = {
  monthly:     { price_usd: 14.99, days: 30 },
  quarterly:   { price_usd: 29,    days: 90 },
  half_yearly: { price_usd: 49,    days: 180 },
  lifetime:    { price_usd: 79,    days: null },
}

export async function POST(request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    // Return 200 so LS doesn't retry endlessly; log and no-op.
    console.warn('[LS webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set — ignoring event')
    return NextResponse.json({ ok: true, ignored: 'no-secret' })
  }

  const raw = await request.text()
  const signature = request.headers.get('x-signature') || ''
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  if (!signature || !timingSafeEqualHex(signature, expected)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName  = payload?.meta?.event_name || 'unknown'
  const customData = payload?.meta?.custom_data || {}
  const attrs      = payload?.data?.attributes  || {}
  const dataType   = payload?.data?.type        || ''
  const dataId     = payload?.data?.id          || null
  const userId     = customData.user_id || null
  const planKey    = customData.plan_key || null

  const database = await db()
  const users    = database.collection('users')
  const events   = database.collection('subscription_events')
  const preorders= database.collection('preorders')

  // Always audit
  await events.insertOne({
    id: uuidv4(),
    provider: 'lemonsqueezy',
    event: eventName,
    user_id: userId,
    plan: planKey,
    ls_id: dataId,
    ls_type: dataType,
    ls_status: attrs.status || null,
    raw: payload,
    created_at: new Date(),
  }).catch(() => {})

  if (!userId) {
    // No user_id in custom_data — nothing we can do beyond auditing.
    return NextResponse.json({ ok: true, warn: 'no user_id in custom_data' })
  }

  // Migrate any founder-preorder documents for this user
  await preorders.updateMany(
    { $or: [{ user_id: userId }, { email: (attrs.user_email || '').toLowerCase() }] },
    { $set: { status: 'migrated', migrated_at: new Date() } },
  ).catch(() => {})
  await users.updateOne(
    { id: userId, entitlement: 'founder_pending' },
    { $set: { entitlement: 'founder' } },
  ).catch(() => {})

  const meta = PLAN_META[planKey] || {}
  const nowIso = new Date()

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_resumed':
    case 'subscription_unpaused':
    case 'subscription_payment_success': {
      const status  = mapStatus(attrs.status)
      const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null
      const trialEnds = attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null
      const expiresAt = renewsAt || (meta.days
        ? new Date(nowIso.getTime() + meta.days * 24 * 60 * 60 * 1000)
        : null)

      await users.updateOne(
        { id: userId },
        {
          $set: {
            'subscription.plan':               planKey,
            'subscription.status':             status,
            'subscription.provider':           'lemonsqueezy',
            'subscription.ls_subscription_id': String(dataId || ''),
            'subscription.ls_customer_id':     attrs.customer_id ? String(attrs.customer_id) : null,
            'subscription.ls_order_id':        attrs.order_id ? String(attrs.order_id) : null,
            'subscription.ls_variant_id':      attrs.variant_id ? String(attrs.variant_id) : null,
            'subscription.price_usd':          meta.price_usd || null,
            'subscription.billing_cycle_days': meta.days || null,
            'subscription.renews_at':          renewsAt,
            'subscription.trial_end':          trialEnds,
            'subscription.expires_at':         expiresAt,
            'subscription.trial_used':         !!trialEnds || status === 'active',
            'subscription.updated_at':         nowIso,
          },
        },
      )
      if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
        const ph = getPostHogClient()
        ph.capture({
          distinctId: userId,
          event: 'subscription_activated',
          properties: {
            plan: planKey,
            status,
            price_usd: meta.price_usd || null,
            provider: 'lemonsqueezy',
            is_trial: status === 'trialing',
          },
        })
        await ph.flush()
      }
      break
    }
    case 'subscription_cancelled': {
      // LS still allows access until end of billing period. Preserve access
      // by keeping status active/trialing until renews_at, but mark cancelled.
      await users.updateOne(
        { id: userId },
        {
          $set: {
            'subscription.status':       'cancelled',
            'subscription.cancelled_at': nowIso,
            'subscription.renews_at':    attrs.renews_at ? new Date(attrs.renews_at) : null,
            'subscription.updated_at':   nowIso,
          },
        },
      )
      const ph = getPostHogClient()
      ph.capture({
        distinctId: userId,
        event: 'subscription_cancelled',
        properties: { plan: planKey, provider: 'lemonsqueezy' },
      })
      await ph.flush()
      break
    }
    case 'subscription_expired':
    case 'subscription_payment_failed': {
      const status = eventName === 'subscription_expired' ? 'expired' : 'past_due'
      await users.updateOne(
        { id: userId },
        { $set: {
            'subscription.status':     status,
            'subscription.updated_at': nowIso,
          } },
      )
      break
    }
    case 'order_created': {
      // Only care about paid lifetime orders here (subscription orders are handled
      // by subscription_* events).
      const isLifetime = planKey === 'lifetime' && (attrs.status === 'paid' || attrs.status === 'active')
      if (isLifetime) {
        await users.updateOne(
          { id: userId },
          {
            $set: {
              'subscription.plan':          'lifetime',
              'subscription.status':        'active',
              'subscription.provider':      'lemonsqueezy',
              'subscription.ls_order_id':   String(dataId || ''),
              'subscription.price_usd':     PLAN_META.lifetime.price_usd,
              'subscription.expires_at':    null,
              'subscription.activated_at':  nowIso,
              'subscription.trial_end':     null,
              'subscription.trial_used':    true,
              'subscription.updated_at':    nowIso,
            },
          },
        )
      }
      break
    }
    default:
      // Ignore unknown events but keep audit row.
      break
  }

  return NextResponse.json({ ok: true, handled: eventName })
}

// Some proxies may probe with GET — respond with a friendly health message.
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'ScholarshipFit LemonSqueezy webhook',
    configured: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  })
}
