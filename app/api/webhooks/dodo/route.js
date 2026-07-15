// Dodo Payments webhook handler.
//
// Receives payment / subscription events from Dodo, verifies signature, and
// updates the user's subscription status in MongoDB.
//
// Configured in Dodo dashboard → Developer → Webhooks:
//   URL: https://scholarshipfit.com/api/webhooks/dodo
//   Secret: whsec_... (stored in DODO_PAYMENTS_WEBHOOK_SECRET)
//
// Events we care about (server-side filtered — we accept all and switch):
//   payment.succeeded          → grant lifetime for one-time purchases
//   subscription.active        → grant subscription (monthly/annual)
//   subscription.created       → same
//   subscription.renewed       → refresh renews_at
//   subscription.on_hold       → mark past_due
//   subscription.cancelled     → mark cancelled (keep access until period end)
//   subscription.expired       → revoke access
//   subscription.failed        → mark failed
//
// CRITICAL: use req.text() (raw body) for signature verification. Do NOT use
// req.json() before verifying — Next.js consumes the stream and HMAC fails.

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import DodoPayments from 'dodopayments'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

let _client = null
async function db() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
  }
  return _client.db(process.env.DB_NAME || undefined)
}

function dodoClient() {
  const isLive = (process.env.DODO_MODE || 'live').toLowerCase() === 'live'
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: isLive ? 'live_mode' : 'test_mode',
  })
}

// Extract metadata & subscription info from various event shapes
function extractContext(data = {}) {
  const md = data.metadata || data.custom_data || {}
  return {
    user_id: md.user_id || null,
    user_email: md.user_email || data.customer?.email || data.email || null,
    plan_key: (md.plan_key || '').toLowerCase() || null,
    discount_code: md.discount_code || null,
    subscription_id: data.subscription_id || data.id || null,
    payment_id: data.payment_id || data.transaction_id || data.id || null,
    status: (data.status || '').toLowerCase(),
    amount_cents: data.total_amount || data.amount || null,
    currency: data.currency || 'USD',
    next_billing_date: data.next_billing_date || data.current_period_end || null,
    product_id: (data.product_cart?.[0]?.product_id) || data.product_id || null,
  }
}

// Compute renewal date fallback (monthly = +30d, annual = +365d)
function computeRenewsAt(plan, provided) {
  if (provided) {
    const d = new Date(provided)
    if (!isNaN(d.getTime())) return d
  }
  const now = Date.now()
  if (plan === 'annual') return new Date(now + 365 * 24 * 3600 * 1000)
  if (plan === 'monthly') return new Date(now + 30 * 24 * 3600 * 1000)
  return null
}

// Match plan_key from product_id if metadata is missing (defensive)
function planFromProductId(pid) {
  if (!pid) return null
  const map = {
    [process.env.DODO_PRODUCT_ID_MONTHLY]:  'monthly',
    [process.env.DODO_PRODUCT_ID_ANNUAL]:   'annual',
    [process.env.DODO_PRODUCT_ID_LIFETIME]: 'lifetime',
  }
  return map[pid] || null
}

async function upgradeUser(database, ctx) {
  const users = database.collection('users')
  const subs  = database.collection('subscriptions')

  // Try to find the user by id first, then by email
  let user = null
  if (ctx.user_id) user = await users.findOne({ id: ctx.user_id })
  if (!user && ctx.user_email) user = await users.findOne({ email: String(ctx.user_email).toLowerCase() })
  if (!user) {
    console.warn('Dodo webhook: could not resolve user', ctx)
    return { ok: false, reason: 'user_not_found' }
  }

  const plan = ctx.plan_key || planFromProductId(ctx.product_id) || 'monthly'
  const isLifetime = plan === 'lifetime'
  const renewsAt = isLifetime ? null : computeRenewsAt(plan, ctx.next_billing_date)

  const subDoc = {
    user_id: user.id,
    user_email: user.email,
    processor: 'dodo',
    plan_key: plan,
    status: isLifetime ? 'lifetime' : 'active',
    subscription_id: ctx.subscription_id,
    payment_id: ctx.payment_id,
    amount_cents: ctx.amount_cents,
    currency: ctx.currency || 'USD',
    discount_code: ctx.discount_code || null,
    renews_at: renewsAt,
    started_at: new Date(),
    updated_at: new Date(),
  }

  await subs.updateOne(
    { user_id: user.id },
    { $set: subDoc, $setOnInsert: { id: uuidv4(), created_at: new Date() } },
    { upsert: true },
  )

  await users.updateOne(
    { id: user.id },
    { $set: {
        plan: isLifetime ? 'lifetime' : plan,
        subscription_status: isLifetime ? 'lifetime' : 'active',
        is_pro: true,
        pro_activated_at: new Date(),
        pro_processor: 'dodo',
    } },
  )

  // Mark checkout_intent as fulfilled (best-effort — for reconciliation)
  await database.collection('checkout_intents').updateOne(
    { user_id: user.id, processor: 'dodo', plan_key: plan },
    { $set: { fulfilled: true, fulfilled_at: new Date(), webhook_ctx: ctx } },
    { sort: { created_at: -1 } },
  ).catch(() => {})

  // Referral credit — if this user was referred, bump the referrer's paid count
  // and grant 30 days of Pro credit (unless referrer is lifetime).
  try {
    if (user.referred_by_code) {
      const refDoc = await database.collection('referrals').findOne({ code: user.referred_by_code })
      if (refDoc && refDoc.user_id !== user.id) {
        // Don't double-credit — check if this user already counted as a paid ref
        const already = (refDoc.paid_user_ids || []).includes(user.id)
        if (!already) {
          await database.collection('referrals').updateOne(
            { code: user.referred_by_code },
            {
              $inc: { paid: 1, credits_earned_days: 30 },
              $addToSet: { paid_user_ids: user.id },
              $set: { last_paid_at: new Date() },
            },
          )
        }
      }
    }
  } catch (e) {
    console.warn('Dodo webhook: referral credit failed (non-fatal):', e?.message)
  }

  return { ok: true, user_id: user.id, plan }
}

async function downgradeUser(database, ctx, newStatus = 'cancelled') {
  const users = database.collection('users')
  const subs  = database.collection('subscriptions')

  let user = null
  if (ctx.user_id) user = await users.findOne({ id: ctx.user_id })
  if (!user && ctx.user_email) user = await users.findOne({ email: String(ctx.user_email).toLowerCase() })
  if (!user) return { ok: false, reason: 'user_not_found' }

  await subs.updateOne(
    { user_id: user.id },
    { $set: { status: newStatus, cancelled_at: new Date(), updated_at: new Date() } },
  )
  await users.updateOne(
    { id: user.id },
    { $set: { subscription_status: newStatus, is_pro: newStatus === 'cancelled' ? true : false } },
  )
  return { ok: true, user_id: user.id, status: newStatus }
}

export async function POST(request) {
  // 1. Read raw body for signature verification
  const payload = await request.text()

  // Collect webhook-* headers (Standard Webhooks spec used by Dodo/Svix)
  const headers = {}
  for (const [k, v] of request.headers.entries()) {
    if (k.startsWith('webhook-')) headers[k] = v
  }
  // Also accept svix-* prefix (Dodo uses Svix under the hood)
  for (const [k, v] of request.headers.entries()) {
    if (k.startsWith('svix-') && !headers[k.replace('svix-', 'webhook-')]) {
      headers[k.replace('svix-', 'webhook-')] = v
    }
  }

  // 2. Verify signature
  let event
  try {
    const client = dodoClient()
    event = await client.webhooks.unwrap(
      payload,
      headers,
      process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('Dodo webhook signature verification failed:', err?.message)
    // Log to Sentry if configured — signature failures could indicate an attack
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 3. Route by event type
  const database = await db()
  const type = event?.type || event?.event_type || ''
  const data = event?.data || event?.payload || event || {}
  const ctx = extractContext(data)

  // Record the raw event for audit/debug
  await database.collection('webhook_events').insertOne({
    id: uuidv4(),
    processor: 'dodo',
    event_type: type,
    ctx,
    raw: JSON.stringify(event).slice(0, 8000),
    received_at: new Date(),
  }).catch(() => {})

  try {
    // Grant access
    if (type === 'payment.succeeded' || type === 'payment.completed') {
      // For one-time purchases (Lifetime). For subscriptions the first payment
      // also fires this — we upgrade regardless (idempotent).
      const result = await upgradeUser(database, ctx)
      return NextResponse.json({ received: true, action: 'upgrade', ...result })
    }
    if (type === 'subscription.active' || type === 'subscription.created' || type === 'subscription.renewed') {
      const result = await upgradeUser(database, ctx)
      return NextResponse.json({ received: true, action: 'upgrade', ...result })
    }
    if (type === 'subscription.on_hold' || type === 'subscription.failed') {
      const result = await downgradeUser(database, ctx, 'past_due')
      return NextResponse.json({ received: true, action: 'past_due', ...result })
    }
    if (type === 'subscription.cancelled' || type === 'subscription.canceled') {
      // Keep access until period end — mark cancelled but not immediately expired
      const result = await downgradeUser(database, ctx, 'cancelled')
      return NextResponse.json({ received: true, action: 'cancel', ...result })
    }
    if (type === 'subscription.expired') {
      const result = await downgradeUser(database, ctx, 'expired')
      // Actually revoke pro access on expiry
      const users = database.collection('users')
      if (result.user_id) {
        await users.updateOne({ id: result.user_id }, { $set: { is_pro: false } })
      }
      return NextResponse.json({ received: true, action: 'expire', ...result })
    }

    // Anything else — acknowledged but no state change
    return NextResponse.json({ received: true, action: 'no_op', type })
  } catch (e) {
    console.error('Dodo webhook processing error:', e)
    return NextResponse.json({ error: 'Webhook handler failed', detail: e?.message }, { status: 500 })
  }
}

export async function GET() {
  // Sanity endpoint for humans — never invoked by Dodo
  return NextResponse.json({
    ok: true,
    endpoint: 'Dodo Payments webhook',
    note: 'This endpoint accepts POST from Dodo only. GET is for uptime pings.',
  })
}
