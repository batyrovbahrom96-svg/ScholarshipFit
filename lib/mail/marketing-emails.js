// Marketing / retention transactional emails: abandoned checkout, referral welcome, etc.
// Premium tone — guarantee-based, not discount-based. Matches the dark + gold
// brand.
import { sendEmail } from './resend'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com').replace(/\/$/, '')

// ------------------------------------------------------------------
// ABANDONED CHECKOUT — 1-hour follow-up, guarantee-forward
// ------------------------------------------------------------------
export function abandonedCheckoutHtml({ name, plan, matchCount }) {
  const safeName = (name || 'there').replace(/[<>&"']/g, '')
  const planLabel = ({ monthly: 'Monthly', annual: 'Annual', lifetime: 'Lifetime' }[plan] || 'Pro')
  const ctaUrl = `${BASE_URL}/pricing`
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>Your matches are waiting</title></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr><td align="center" style="padding:8px 0 24px 0;">
            <div style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:#D4AF37;">ScholarshipFit<span style="color:#ffffff;">.com</span></div>
          </td></tr>
          <tr><td style="background:#111111;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:36px 28px;">
            <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D4AF37;">Your shortlist is ready</div>
            <h1 style="margin:8px 0 12px 0;font-size:26px;line-height:1.2;color:#ffffff;font-weight:600;">Hey ${safeName}, your matches are waiting.</h1>
            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72);">
              You looked at <strong style="color:#fff;">${planLabel}</strong>${matchCount ? ` after matching <strong style="color:#D4AF37;">${matchCount} scholarships</strong>` : ''} but didn't finish activating. Deadlines don't wait — top awards close applications on a rolling basis, and your shortlist is only useful while the awards are still open.
            </p>
            <div style="background:#000000;border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:22px;margin:16px 0 22px 0;">
              <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D4AF37;">The ScholarshipFit promise</div>
              <div style="margin-top:8px;font-size:16px;line-height:1.5;color:#ffffff;font-weight:500;">30-day money-back guarantee. No questions asked.</div>
              <div style="margin-top:6px;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.65);">If ScholarshipFit doesn't help you match, apply, and submit — we refund every cent within 30 days. Zero risk, zero forms to fill.</div>
            </div>
            <div style="text-align:center;margin:22px 0 8px 0;">
              <a href="${ctaUrl}" style="display:inline-block;background:#D4AF37;color:#0a0a0a;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;font-size:15px;">Activate my ${planLabel} plan →</a>
            </div>
            <p style="margin:22px 0 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.5);">
              Not for you right now? Reply and tell us why — we read every message. If ScholarshipFit isn't the right fit we'd rather know than nag you.
            </p>
          </td></tr>
          <tr><td align="center" style="padding:20px 0;font-size:11px;color:rgba(255,255,255,0.4);">
            ScholarshipFit · AI Scholarship Command Center · You received this because you started activation on ${BASE_URL}.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export function abandonedCheckoutText({ name, plan, matchCount }) {
  const planLabel = ({ monthly: 'Monthly', annual: 'Annual', lifetime: 'Lifetime' }[plan] || 'Pro')
  return `Hey ${name || 'there'},

You were looking at the ${planLabel} plan${matchCount ? ` after matching ${matchCount} scholarships` : ''} but didn't finish activating.

30-day money-back guarantee — no questions asked. If ScholarshipFit doesn't help you match, apply, and submit, we refund every cent within 30 days.

Activate here: ${BASE_URL}/pricing

Not for you? Just reply and tell us why.

— The ScholarshipFit team`
}

export async function sendAbandonedCheckoutEmail({ to, name, plan, matchCount }) {
  return sendEmail({
    to,
    subject: `Your ${matchCount || 'scholarship'} matches are ready — 30-day guarantee`,
    html: abandonedCheckoutHtml({ name, plan, matchCount }),
    text: abandonedCheckoutText({ name, plan, matchCount }),
  })
}

// ------------------------------------------------------------------
// REFERRAL WELCOME — premium, no percentage-off callouts
// ------------------------------------------------------------------
export function referralWelcomeHtml({ name, code, shareUrl }) {
  const safeName = (name || 'there').replace(/[<>&"']/g, '')
  return `<!doctype html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#0a0a0a;font-family:-apple-system,sans-serif;color:#fff;">
  <table width="100%" style="background:#0a0a0a;"><tr><td align="center" style="padding:32px 16px;">
    <table width="600" style="max-width:600px;">
      <tr><td style="background:#111;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:32px;">
        <div style="font-size:22px;color:#D4AF37;font-weight:700;">ScholarshipFit</div>
        <h1 style="font-size:24px;margin:16px 0 12px 0;">Hey ${safeName} — your invite link is live.</h1>
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;">Every friend you invite gets access to the same premium scholarship command center you use — and you earn <strong style="color:#D4AF37;">30 days of Pro credit</strong> when they upgrade. Three paid friends = 3 months completely free.</p>
        <div style="background:#000;border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Your invite code</div>
          <div style="font-family:monospace;font-size:28px;color:#D4AF37;letter-spacing:6px;margin-top:6px;">${code}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:8px;">${shareUrl}</div>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export async function sendReferralWelcomeEmail({ to, name, code, shareUrl }) {
  return sendEmail({
    to,
    subject: 'Your ScholarshipFit invite link is live',
    html: referralWelcomeHtml({ name, code, shareUrl }),
    text: `Hey ${name || 'there'},\n\nYour ScholarshipFit invite link is live. Every friend who upgrades earns you 30 days of Pro:\n${shareUrl}\n\n— The ScholarshipFit team`,
  })
}
