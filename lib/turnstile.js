/**
 * Cloudflare Turnstile — server-side token verifier.
 *
 * Usage in API handlers:
 *   import { verifyTurnstile } from '@/lib/turnstile'
 *   const gate = await verifyTurnstile(body.turnstile_token, request)
 *   if (!gate.ok) return withCORS(NextResponse.json({ error: gate.error }, { status: 400 }))
 *
 * Behavior:
 *   - If TURNSTILE_SECRET_KEY is unset (dev without keys), the check is skipped
 *     and { ok: true, skipped: true } is returned. This means Turnstile is
 *     enforced ONLY when the env var is present, so forgetting to set it in
 *     preview/staging won't break auth flows.
 *   - Success: { ok: true }
 *   - Failure: { ok: false, error: <human string>, codes: <cf error codes[]> }
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(token, request) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Not configured — skip so dev never gets locked out. Log so it's visible.
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification')
    return { ok: true, skipped: true }
  }
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Please complete the security check to continue.', codes: ['missing-input-response'] }
  }

  const ip =
    (request?.headers?.get?.('cf-connecting-ip')) ||
    (request?.headers?.get?.('x-real-ip')) ||
    (request?.headers?.get?.('x-forwarded-for') || '').split(',')[0].trim() ||
    null

  try {
    const form = new URLSearchParams()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)

    const resp = await fetch(VERIFY_URL, {
      method: 'POST',
      body: form,
      // 8s timeout via AbortController so a Cloudflare hiccup can't hang a request forever
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    })
    const data = await resp.json().catch(() => ({}))

    if (data?.success === true) {
      return { ok: true, hostname: data.hostname || null, action: data.action || null, cdata: data.cdata || null }
    }
    const codes = Array.isArray(data?.['error-codes']) ? data['error-codes'] : []
    // Human-friendly mapping for common cases
    let msg = 'Security check failed. Please refresh the page and try again.'
    if (codes.includes('timeout-or-duplicate')) msg = 'Security check expired — please try again.'
    if (codes.includes('missing-input-response')) msg = 'Please complete the security check to continue.'
    return { ok: false, error: msg, codes }
  } catch (e) {
    console.error('[turnstile] siteverify failed:', e?.message || e)
    // Fail-closed on network issues — don't let bots slip through if CF is momentarily unreachable.
    return { ok: false, error: 'Security check temporarily unavailable. Please retry in a moment.', codes: ['network-error'] }
  }
}
