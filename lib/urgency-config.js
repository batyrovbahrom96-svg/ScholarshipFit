// Central urgency configuration for founder-launch scarcity signals.
// Kept in one file so the countdown end-date and founder-cap can be
// updated in a single place if we need to extend the campaign.
//
// Everything is honest: end-date is fixed, spots_claimed is a live count
// from the DB (not fake). If you extend the campaign, bump END_ISO here
// and keep the promise.

// ================== CAMPAIGN CONFIG ==================
// Founder-pricing ends at this UTC timestamp. Update to extend.
export const FOUNDER_END_ISO   = '2026-09-30T23:59:59.000Z'
export const FOUNDER_TOTAL     = 500           // total founder spots offered
export const FOUNDER_MIN_FLOOR = 50            // if actual DB count is lower, we don't show < this to preserve social proof (never inflates above real count)

/** Return the campaign status. Pure (no DB). */
export function campaignSchedule(now = new Date()) {
  const end = new Date(FOUNDER_END_ISO)
  const msLeft = end.getTime() - now.getTime()
  const isOver = msLeft <= 0
  const totalSec = Math.max(0, Math.floor(msLeft / 1000))
  const days  = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins  = Math.floor((totalSec % 3600) / 60)
  const secs  = totalSec % 60
  return {
    end_iso: FOUNDER_END_ISO,
    is_over: isOver,
    seconds_left: totalSec,
    days, hours, mins, secs,
  }
}

/** Given a real claimed count from DB, return the display-safe spots value.
 *  Never inflates the actual count. Only uses MIN_FLOOR when the actual
 *  count is smaller (early-launch social proof — same as before), still
 *  capped at FOUNDER_TOTAL.
 */
export function displaySpots(realCount) {
  const n = Math.max(0, Number(realCount) || 0)
  const shown = Math.max(n, FOUNDER_MIN_FLOOR)
  return {
    claimed: Math.min(shown, FOUNDER_TOTAL),
    total:   FOUNDER_TOTAL,
    percent: Math.min(100, Math.round((Math.min(shown, FOUNDER_TOTAL) / FOUNDER_TOTAL) * 100)),
    remaining: Math.max(0, FOUNDER_TOTAL - Math.min(shown, FOUNDER_TOTAL)),
    real_count: n,  // for admin inspection (not shown to users)
  }
}
