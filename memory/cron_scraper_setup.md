# Cron-job.org Setup — Weekly Scholarship Scraper

## What this does
Triggers `POST /api/cron/scrape` on your production server every Monday at 03:00 UTC. The endpoint runs all registered scrapers (Chevening, DAAD, Commonwealth — extendable), upserts new scholarships into the `scholarships` collection, and returns per-source stats.

## Prerequisites (production environment)
Make sure these env vars are set in your Emergent hosting dashboard:
- `MONGO_URL` (already present)
- `DB_NAME` (already present)
- `CRON_SECRET` — **NEW**. Copy from `/app/.env`:
  ```
  CRON_SECRET=2850f7cda10e75bd30c81e434e0f00d9923f19afd349f32ba4c1e8eeed1c3d0d
  ```
  ⚠️ Do **not** commit this to git. Set it via the hosting dashboard's env-var UI. If you rotate it, update both the server AND cron-job.org.

## cron-job.org setup (free, no credit card)

1. Go to https://cron-job.org and sign up (free forever).
2. Click **Create cronjob** (top right).
3. **Title:** `ScholarshipFit — Weekly Scholarship Scrape`
4. **URL:**
   ```
   https://scholarshipfit.com/api/cron/scrape?secret=YOUR_CRON_SECRET_HERE
   ```
   Replace `YOUR_CRON_SECRET_HERE` with the value from your `.env` — **URL-encode it if it contains special characters** (the current value is hex so no encoding needed).

5. **Schedule tab:**
   - Choose **Custom**
   - Pattern: `0 3 * * 1` (every Monday 03:00 UTC)
   - Timezone: **UTC**

6. **Advanced tab:**
   - Request method: **GET** (or POST — both work)
   - **Request timeout:** `300` seconds (scraper can take up to 2-3 minutes when all sources respond)
   - **Notifications:** enable email notification on failure

7. **Save.**

## Verify it works

After creating the cron, click **Execute now** on the cron-job.org dashboard to test immediately. You should see:
- HTTP 200
- JSON body with `ok: true`, `per_source`, and `total_scholarships_after`
- Response time: 1-30 seconds

If you get **401 unauthorized**, the `?secret=` is wrong or `CRON_SECRET` env var is not set on the server.

## Manual trigger (for testing)

You can also trigger a scrape yourself any time:
```bash
curl "https://scholarshipfit.com/api/cron/scrape?secret=YOUR_CRON_SECRET_HERE"
```

Or with a dry run (no DB writes, useful for previewing what would change):
```bash
curl "https://scholarshipfit.com/api/cron/scrape?secret=YOUR_CRON_SECRET_HERE&dry_run=1"
```

## Monitoring

The scraper writes a run record to the `scraper_runs` collection after every execution. View the last 10 runs via:
```
GET /api/admin/scraper-runs?password=<ADMIN_PASSWORD>
```

Or use the `/admin/stats` endpoint (existing) which now also includes:
- `scholarship_sources` — breakdown of scholarships by source
- `last_scrape` — summary of the most recent scrape run

## Adding more scrapers later

To hit 2,000+ scholarships, add more scraper modules in `/app/lib/scrapers/`:

**Priority recommendations (next batch):**
1. **Fulbright** (US State Dept) — https://us.fulbrightonline.org — ~150 country programs
2. **Erasmus+** — https://erasmus-plus.ec.europa.eu — ~200 joint Master's programmes
3. **Australia Awards** — https://www.dfat.gov.au/australia-awards — ~50 country programs
4. **JASSO** (Japan) — https://www.studyinjapan.go.jp — ~80 programs
5. **Fulbright Country-specific** (e.g., Fulbright Nigeria, Fulbright India) — ~40 programs

Each new scraper is a single file in `/app/lib/scrapers/` following the pattern of `chevening.js`. Register it in `/app/lib/scrapers/index.js` — the orchestrator picks it up automatically.

## Backup plan (if cron-job.org is down)
Alternatives that work with our endpoint (no code change needed):
- **EasyCron** (https://easycron.com) — free tier, more reliable SLA
- **UptimeRobot** monitor — set as a "keyword" monitor hitting the URL, effectively acts as a cron
- **GitHub Actions** — schedule workflow calling the endpoint
- **Emergent's built-in scheduler** if/when available on your hosting plan

## Security notes

- `CRON_SECRET` is a 32-byte hex string. Rotate every 90 days.
- Endpoint accepts secret via `x-cron-secret` header OR `?secret=` query param.
- The endpoint is idempotent — duplicate runs never create dupes (upsert by `slug`).
- Rate limit: not needed (cron runs weekly).
