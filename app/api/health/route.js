// ================================================================
// /api/health — Uptime + system health probe.
// ----------------------------------------------------------------
// Pinged every ~30-60 seconds by uptime monitors (BetterStack,
// UptimeRobot, Pingdom, etc.). Must be fast, unauthenticated,
// and cache-hostile.
//
// Returns:
//   200 OK             \u2192 healthy (all checks passing)
//   503 Service Unavailable  \u2192 something's degraded (db down, etc.)
//
// Body:
//   {
//     status:     "ok" | "degraded",
//     timestamp:  ISO8601,
//     uptime_s:   process uptime in seconds,
//     checks: {
//       db:            { ok: bool, latency_ms: number, error?: string },
//       env:           { ok: bool, missing?: string[] },
//     },
//     version:    git commit SHA (if available),
//     env_name:   "production" | "preview" | "development"
//   }
// ================================================================

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export const dynamic  = 'force-dynamic'
export const runtime  = 'nodejs'
export const revalidate = 0

let cachedClient
async function db() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 3000,   // fail fast if mongo is down
      connectTimeoutMS:         3000,
    })
    await cachedClient.connect()
  }
  return cachedClient.db(process.env.DB_NAME)
}

// Env vars that MUST be present in production for the app to function.
const REQUIRED_ENV = [
  'MONGO_URL',
  'DB_NAME',
  'NEXT_PUBLIC_BASE_URL',
]

async function checkDb() {
  const t0 = Date.now()
  try {
    const database = await db()
    // Cheapest possible query \u2014 just pings and returns ok.
    await database.command({ ping: 1 })
    return { ok: true, latency_ms: Date.now() - t0 }
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - t0, error: String(e?.message || e).slice(0, 120) }
  }
}

function checkEnv() {
  const missing = REQUIRED_ENV.filter(k => !process.env[k])
  return { ok: missing.length === 0, ...(missing.length ? { missing } : {}) }
}

export async function GET() {
  const [dbCheck, envCheck] = await Promise.all([checkDb(), Promise.resolve(checkEnv())])
  const healthy = dbCheck.ok && envCheck.ok

  const payload = {
    status:     healthy ? 'ok' : 'degraded',
    timestamp:  new Date().toISOString(),
    uptime_s:   Math.round(process.uptime()),
    checks: {
      db:  dbCheck,
      env: envCheck,
    },
    version:  process.env.VERCEL_GIT_COMMIT_SHA || process.env.EMERGENT_COMMIT_SHA || 'unknown',
    env_name: process.env.NODE_ENV === 'production' ? 'production' : (process.env.EMERGENT_ENV || 'preview'),
  }

  return NextResponse.json(payload, {
    status: healthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
    },
  })
}

// Uptime monitors sometimes fire HEAD before GET \u2014 respond identically.
export const HEAD = GET
