// ================================================================
// Daily onboarding-drip cron endpoint.
//
// Trigger: cron-job.org (or GitHub Actions), daily at ~09:00 UTC.
// URL:     https://scholarshipfit.com/api/cron/onboarding-drip?secret=CRON_SECRET
//
// What it does:
//   1. Scans users where email_verified === true and drip_unsubscribed !== true.
//   2. For each drip stage (welcome, tips, case_study, founder, last_chance),
//      finds users whose (now - created_at) matches the stage's day-window
//      AND who haven't received that stage yet (idempotent).
//   3. Sends the email via Resend.
//   4. Appends the stage key to user.onboarding_sent[] with a timestamp.
//
// Idempotency guarantee: each user gets each stage exactly ONCE, ever.
// If the cron misses a day, the "window" is generous (day 1 = 1-2 days,
// day 3 = 3-5 days, etc.) so late-fires still catch users.
// ================================================================

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { sendDripEmail, DRIP_SCHEDULE, DRIP_STAGES } from '@/lib/mail/onboarding-drip'

export const runtime      = 'nodejs'
export const dynamic      = 'force-dynamic'
export const maxDuration  = 300

const DAY_MS = 24 * 60 * 60 * 1000

// How generous the day window is for catching users late.
// day 0 = 0-1 days · day 1 = 1-2 · day 3 = 3-5 · day 7 = 7-10 · day 14 = 14-20
const WINDOWS = {
  welcome:     { min: 0,  max: 1  },
  tips:        { min: 1,  max: 2  },
  case_study:  { min: 3,  max: 5  },
  founder:     { min: 7,  max: 10 },
  last_chance: { min: 14, max: 20 },
}

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const url = new URL(request.url)
  const q   = url.searchParams.get('secret')
  const h   = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return q === secret || h === secret
}

let _client
async function db() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
  }
  return _client.db(process.env.DB_NAME)
}

async function getOrCreateUnsubscribeToken(database, userId) {
  const col = database.collection('unsubscribe_tokens')
  const existing = await col.findOne({ user_id: userId })
  if (existing) return existing.token
  const token = crypto.randomBytes(24).toString('base64url')
  await col.insertOne({ id: uuidv4(), user_id: userId, token, created_at: new Date().toISOString() })
  return token
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const database = await db()
  const users    = database.collection('users')
  const now      = Date.now()
  const results  = { stages: {}, total_sent: 0, total_skipped: 0, errors: [] }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'

  for (const stage of DRIP_STAGES) {
    const win = WINDOWS[stage]
    const minCutoff = new Date(now - win.max * DAY_MS).toISOString()
    const maxCutoff = new Date(now - win.min * DAY_MS).toISOString()

    // Find users created in the window who haven't received this stage yet
    const candidates = await users.find({
      email_verified: true,
      drip_unsubscribed: { $ne: true },
      created_at: { $gte: minCutoff, $lte: maxCutoff },
      onboarding_sent: { $not: { $elemMatch: { stage } } },
    }).limit(500).toArray()

    let sent = 0, skipped = 0
    for (const u of candidates) {
      try {
        const token = await getOrCreateUnsubscribeToken(database, u.id)
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${token}?scope=drip`
        const r = await sendDripEmail({
          stage,
          to:   u.email,
          name: u.name || u.first_name || '',
          unsubscribeUrl,
        })
        if (r?.ok || !r?.error) {
          await users.updateOne(
            { id: u.id },
            { $push: { onboarding_sent: { stage, sent_at: new Date().toISOString() } } }
          )
          sent++
        } else {
          skipped++
          results.errors.push({ user_id: u.id, stage, err: String(r?.error).slice(0, 120) })
        }
      } catch (e) {
        skipped++
        results.errors.push({ user_id: u.id, stage, err: String(e?.message || e).slice(0, 120) })
      }
    }
    results.stages[stage] = { candidates: candidates.length, sent, skipped }
    results.total_sent    += sent
    results.total_skipped += skipped
  }

  return NextResponse.json({
    ok: true,
    ran_at: new Date().toISOString(),
    ...results,
  })
}
