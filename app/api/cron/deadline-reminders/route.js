// Daily deadline-reminder cron endpoint.
//
// Trigger: cron-job.org, daily at 09:00 UTC.
// URL:     https://scholarshipfit.com/api/cron/deadline-reminders?secret=CRON_SECRET
//
// What it does:
//   1. Finds every saved_scholarship row with a deadline_date whose distance
//      from "now" falls into one of the reminder windows: 30, 14, 7, or 1 day.
//   2. Skips rows where reminders_enabled === false.
//   3. Skips rows where the owning user has reminders_pref === 'off'.
//   4. Skips rows where reminders_sent[N] is already set (idempotent).
//   5. Sends the email via Resend.
//   6. Marks reminders_sent[N] = new Date() so we never double-send.
//
// The endpoint returns per-window counts + a small sample so cron-job.org
// dashboards show useful data.
import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { sendDeadlineReminderEmail } from '@/lib/mail/resend'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 300

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const url = new URL(request.url)
  const q   = url.searchParams.get('secret')
  const h   = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return q === secret || h === secret
}

const WINDOWS = [30, 14, 7, 1]
const DAY_MS  = 24 * 60 * 60 * 1000

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
  await col.insertOne({
    id: uuidv4(),
    user_id: userId,
    token,
    created_at: new Date(),
  })
  return token
}

/** Return the reminder window (30/14/7/1) that this deadline falls into, or null. */
function whichWindow(deadlineDate, now = new Date()) {
  const diffDays = Math.round((new Date(deadlineDate).getTime() - now.getTime()) / DAY_MS)
  for (const w of WINDOWS) {
    // Send when we're exactly `w` days out (with a ±1 day tolerance for cron drift)
    if (Math.abs(diffDays - w) <= 0) return String(w)
  }
  return null
}

async function handle(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url    = new URL(request.url)
  const dryRun = url.searchParams.get('dry_run') === '1'
  const debug  = url.searchParams.get('debug')  === '1'

  try {
    const database = await db()
    const now      = new Date()
    const in35Days = new Date(now.getTime() + 35 * DAY_MS)

    // Fetch every save with a deadline within the next 35 days AND reminders enabled
    const candidates = await database.collection('saved_scholarships').find({
      deadline_date: { $gte: now, $lte: in35Days },
      reminders_enabled: { $ne: false },
    }).toArray()

    const perWindow = { 30: 0, 14: 0, 7: 0, 1: 0 }
    const sent = []
    const errors = []
    const skipped = { already_sent: 0, no_user: 0, user_off: 0, no_email: 0, out_of_window: 0 }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://scholarshipfit.com'

    for (const save of candidates) {
      const win = whichWindow(save.deadline_date, now)
      if (!win) { skipped.out_of_window++; continue }
      if (save.reminders_sent?.[win]) { skipped.already_sent++; continue }

      const user = await database.collection('users').findOne({ id: save.user_id })
      if (!user) { skipped.no_user++; continue }
      if (user.reminders_pref === 'off') { skipped.user_off++; continue }
      if (!user.email) { skipped.no_email++; continue }

      const token = await getOrCreateUnsubscribeToken(database, user.id)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${token}`

      if (!dryRun) {
        const res = await sendDeadlineReminderEmail({
          to:              user.email,
          name:            user.name || (user.email.split('@')[0]),
          scholarshipName: save.scholarship_name,
          provider:        save.scholarship_provider,
          sourceUrl:       save.scholarship_url,
          deadlineDate:    save.deadline_date,
          daysLeft:        Number(win),
          unsubscribeUrl,
        })
        if (res.ok) {
          await database.collection('saved_scholarships').updateOne(
            { _id: save._id },
            { $set: { [`reminders_sent.${win}`]: new Date() } },
          )
          perWindow[win]++
          sent.push({ user_id: user.id, scholarship_name: save.scholarship_name, days: Number(win) })
        } else {
          errors.push({ user_id: user.id, scholarship_id: save.scholarship_id, days: Number(win), error: res.error })
        }
      } else {
        perWindow[win]++
        sent.push({ user_id: user.id, scholarship_name: save.scholarship_name, days: Number(win), _dry_run: true })
      }
    }

    // Persist a run record for admin visibility
    await database.collection('reminder_runs').insertOne({
      id: uuidv4(),
      started_at: now,
      duration_ms: Date.now() - now.getTime(),
      dry_run: dryRun,
      candidates: candidates.length,
      per_window: perWindow,
      total_sent: Object.values(perWindow).reduce((a, b) => a + b, 0),
      errors_count: errors.length,
      skipped,
      created_at: new Date(),
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      dry_run: dryRun,
      candidates: candidates.length,
      per_window: perWindow,
      total_sent: Object.values(perWindow).reduce((a, b) => a + b, 0),
      errors_count: errors.length,
      skipped,
      ...(debug ? { sample_sent: sent.slice(0, 10), sample_errors: errors.slice(0, 5) } : {}),
    })
  } catch (e) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET(request)  { return handle(request) }
export async function POST(request) { return handle(request) }
