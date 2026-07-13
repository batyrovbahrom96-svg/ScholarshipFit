// Abandoned-checkout recovery cron.
// Runs periodically (Vercel cron, or manual GET). Finds paywall_events older
// than 1h whose owning user hasn't purchased yet, and sends a discount email.
// Idempotent — flips `abandoned_email_sent: true` so we never spam.
//
// Ping this every 15-30 minutes from your cron of choice:
//   curl -H 'x-cron-key: $CRON_SECRET' https://scholarshipfit.com/api/cron/abandoned-checkout

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { sendAbandonedCheckoutEmail } from '@/lib/mail/marketing-emails'

export const runtime = 'nodejs'
export const maxDuration = 60

let _client = null
async function db() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
  }
  return _client.db(process.env.DB_NAME || undefined)
}

function authorized(req) {
  const provided = req.headers.get('x-cron-key') || new URL(req.url).searchParams.get('key')
  const expected = process.env.CRON_SECRET
  if (!expected) return true // dev mode — allow
  return provided === expected
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const database = await db()
  const events = database.collection('paywall_events')
  const users = database.collection('users')
  const subs = database.collection('subscriptions')

  // Find candidates: created > 1h ago, < 72h ago, no email sent yet, not purchased.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)

  const candidates = await events.find({
    created_at: { $gte: seventyTwoHoursAgo, $lte: oneHourAgo },
    abandoned_email_sent: { $ne: true },
    purchased: { $ne: true },
  }).sort({ created_at: 1 }).limit(50).toArray()

  let sent = 0
  let skipped = 0
  const results = []

  for (const ev of candidates) {
    try {
      const email = ev.email
      if (!email) { skipped++; continue }

      // Check if user has since purchased (paddle_subscriptions or subscriptions collection)
      let purchased = false
      if (ev.user_id) {
        const s = await subs.findOne({ user_id: ev.user_id, status: { $in: ['active', 'trialing', 'lifetime'] } }).catch(() => null)
        if (s) purchased = true
      }
      if (purchased) {
        await events.updateOne({ id: ev.id }, { $set: { purchased: true, abandoned_email_sent: true, skipped_reason: 'already_purchased' } })
        skipped++
        continue
      }

      // Skip if we already emailed this address in last 48h for another event
      const recentEmailed = await events.findOne({
        email,
        abandoned_email_sent: true,
        abandoned_email_sent_at: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      })
      if (recentEmailed) {
        await events.updateOne({ id: ev.id }, { $set: { abandoned_email_sent: true, skipped_reason: 'recently_emailed' } })
        skipped++
        continue
      }

      const user = ev.user_id ? await users.findOne({ id: ev.user_id }) : await users.findOne({ email })
      const mailRes = await sendAbandonedCheckoutEmail({
        to: email,
        name: user?.name,
        plan: ev.plan,
        matchCount: ev.match_count,
        discountCode: 'LAUNCH50',
        percentOff: 50,
      })
      if (mailRes?.ok) {
        sent++
        await events.updateOne({ id: ev.id }, { $set: { abandoned_email_sent: true, abandoned_email_sent_at: new Date() } })
        results.push({ email, ok: true })
      } else {
        results.push({ email, ok: false, error: mailRes?.error || 'unknown' })
      }
    } catch (e) {
      results.push({ id: ev?.id, ok: false, error: String(e?.message || e) })
    }
  }

  return NextResponse.json({ ok: true, scanned: candidates.length, sent, skipped, results })
}
