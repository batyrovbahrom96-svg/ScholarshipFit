// Weekly cron endpoint that runs all scholarship scrapers.
//
// Auth: send the CRON_SECRET as either an `x-cron-secret` header OR a
// `?secret=` query parameter. This keeps configuration flexible so cron
// providers that only support URL parameters (e.g., cron-job.org free tier)
// still work.
//
// Set up cron-job.org:
//   URL: https://scholarshipfit.com/api/cron/scrape?secret=<CRON_SECRET>
//   Schedule: 0 3 * * 1  (every Monday 03:00 UTC)
//   Timeout: 300s
//
// Also supports GET (for cron-job.org and manual triggers via browser)
// AND POST (for programmatic triggers).
import { NextResponse } from 'next/server'
import { runAllScrapers, listScrapers } from '@/lib/scrapers'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 300  // seconds

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const url  = new URL(request.url)
  const q    = url.searchParams.get('secret')
  const h    = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return q === secret || h === secret
}

async function handle(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry_run') === '1' || url.searchParams.get('dryRun') === '1'

  try {
    const result = await runAllScrapers({ dryRun })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET(request)  { return handle(request) }
export async function POST(request) { return handle(request) }

// Nice-to-have: OPTIONS handler for CORS preflight (not really needed since
// cron providers don't preflight, but keeps parity with the rest of the API).
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-cron-secret,Authorization',
    },
  })
}

// (Debug) list registered scrapers without running them — hit with ?list=1
// This is safe to leave enabled since scraper names are public.
export function listRegisteredScrapers() {
  return listScrapers()
}
