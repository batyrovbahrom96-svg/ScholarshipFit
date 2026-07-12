# Cron Setup — Two Jobs to Configure on cron-job.org

Both endpoints are protected by the same `CRON_SECRET`. Set that env-var in your production dashboard (value in `/app/.env`).

## Job 1 — Weekly scholarship scraper

- **Title:** ScholarshipFit — Weekly Scholarship Scrape
- **URL:** `https://scholarshipfit.com/api/cron/scrape?secret=YOUR_CRON_SECRET`
- **Schedule:** `0 3 * * 1` (every Monday 03:00 UTC)
- **Timeout:** 300 s
- **Purpose:** grows the `scholarships` collection each week; idempotent

## Job 2 — Daily deadline-reminder emails ⭐ NEW

- **Title:** ScholarshipFit — Daily Deadline Reminders
- **URL:** `https://scholarshipfit.com/api/cron/deadline-reminders?secret=YOUR_CRON_SECRET`
- **Schedule:** `0 9 * * *` (every day 09:00 UTC — ~5am US East, ~10am UK, ~2:30pm India)
- **Timeout:** 300 s
- **Purpose:** for every save whose deadline is 30/14/7/1 days away, sends a branded reminder email; marks `reminders_sent` so no email fires twice.

### Query parameters

| Param | Purpose |
|---|---|
| `secret=` | **Required.** Must equal `CRON_SECRET`. |
| `dry_run=1` | Runs the whole flow WITHOUT sending emails or persisting `reminders_sent`. Great for verifying who would be emailed today. |
| `debug=1` | Also returns a `sample_sent` and `sample_errors` in the response (10 items each). |

### Expected response

```json
{
  "ok": true,
  "dry_run": false,
  "candidates": 27,
  "per_window": { "30": 6, "14": 9, "7": 8, "1": 4 },
  "total_sent": 27,
  "errors_count": 0,
  "skipped": {
    "already_sent": 12,
    "no_user": 0,
    "user_off": 3,
    "no_email": 0,
    "out_of_window": 41
  }
}
```

### Manual trigger — verify from your machine

```bash
# Dry-run (no emails, no DB writes)
curl "https://scholarshipfit.com/api/cron/deadline-reminders?secret=YOUR_CRON_SECRET&dry_run=1&debug=1"

# Real run (sends emails via Resend)
curl "https://scholarshipfit.com/api/cron/deadline-reminders?secret=YOUR_CRON_SECRET"
```

## User-facing controls (already live)

- Global toggle at `/dashboard/deadlines` (top of page)
- Per-scholarship bell toggle inline
- One-click unsubscribe link in every email → `/api/unsubscribe/<token>` — sets `user.reminders_pref='off'`

## Data model

**`saved_scholarships` collection** (auto-created on first save):
```
{
  id, user_id, scholarship_id, scholarship_slug,
  scholarship_name, scholarship_provider, scholarship_url,
  deadline_date,           // null until user sets it via /cabinet/set-deadline
  reminders_enabled,       // per-scholarship bool
  reminders_sent: { '30': null|Date, '14': ..., '7': ..., '1': ... },
  created_at, updated_at
}
```

**`unsubscribe_tokens` collection**:
```
{ id, user_id, token, created_at }
```
Long-lived; one token per user, reused across every reminder email.

**User fields:**
- `reminders_pref`: `'on'` | `'off'` (default `'on'` if absent).

## Deployment checklist for Job 2

- [ ] `CRON_SECRET` present in production env
- [ ] `RESEND_API_KEY` present in production env
- [ ] Domain `scholarshipfit.com` verified in Resend (already done)
- [ ] Add second cron-job.org job with the URL above
- [ ] Click "Execute now" once → should return `total_sent >= 0, errors_count: 0`
- [ ] Save a test scholarship + set a deadline 7 days out → next-day cron should send exactly 1 email

## Backup plan (if cron-job.org is down)