// Marketing / retention transactional emails: abandoned checkout, referral welcome, etc.
// All templates match the same dark + gold branding as verification emails.
import { sendEmail } from './resend'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com').replace(/\/$/, '')

// ------------------------------------------------------------------
// ABANDONED CHECKOUT — 1-hour follow-up with 10% off (LAUNCH50 fallback)
// ------------------------------------------------------------------
export function abandonedCheckoutHtml({ name, plan, matchCount, discountCode = 'LAUNCH50', percentOff = 50 }) {
  const safeName = (name || 'there').replace(/[<>&"']/g, '')
  const planLabel = ({ monthly: 'Monthly', annual: 'Annual', lifetime: 'Lifetime' }[plan] || 'Pro')
  const ctaUrl = `${BASE_URL}/pricing?code=${discountCode}`
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
            <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D4AF37;">Your matches are waiting</div>
            <h1 style="margin:8px 0 12px 0;font-size:26px;line-height:1.2;color:#ffffff;font-weight:600;">Hey ${safeName}, don't lose your matches.</h1>
            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72);">
              You looked at <strong style="color:#fff;">${planLabel}</strong>${matchCount ? ` after matching <strong style="color:#D4AF37;">${matchCount} scholarships</strong>` : ''} but didn't finish. Every day you wait, deadlines pass — and top-tier awards close their applications on rolling basis.
            </p>
            <div style="background:#000000;border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:22px;text-align:center;margin:16px 0 22px 0;">
              <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Founder-week discount</div>
              <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#D4AF37;margin-top:8px;">${discountCode}</div>
              <div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.6);">${percentOff}% off any plan · expires in 48h</div>
            </div>
            <div style="text-align:center;margin:22px 0 8px 0;">
              <a href="${ctaUrl}" style="display:inline-block;background:#D4AF37;color:#0a0a0a;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;font-size:15px;">Claim my ${percentOff}% off →</a>
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

export function abandonedCheckoutText({ name, plan, matchCount, discountCode = 'LAUNCH50', percentOff = 50 }) {
  const planLabel = ({ monthly: 'Monthly', annual: 'Annual', lifetime: 'Lifetime' }[plan] || 'Pro')
  return `Hey ${name || 'there'},\n\nYou were looking at the ${planLabel} plan${matchCount ? ` after matching ${matchCount} scholarships` : ''} but didn't finish activating.\n\nUse code ${discountCode} for ${percentOff}% off — expires in 48h:\n${BASE_URL}/pricing?code=${discountCode}\n\nNot for you? Just reply and tell us why.\n\n— The ScholarshipFit team`
}

export async function sendAbandonedCheckoutEmail({ to, name, plan, matchCount, discountCode, percentOff }) {
  return sendEmail({
    to,
    subject: `Your ${matchCount || 'scholarship'} matches are 1 click away — ${percentOff || 50}% off inside`,
    html: abandonedCheckoutHtml({ name, plan, matchCount, discountCode, percentOff }),
    text: abandonedCheckoutText({ name, plan, matchCount, discountCode, percentOff }),
  })
}

// ------------------------------------------------------------------
// REFERRAL WELCOME — sent when user first views /dashboard/referrals
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
        <h1 style="font-size:24px;margin:16px 0 12px 0;">Hey ${safeName} — you're now a referrer.</h1>
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;">Every friend who signs up with your link gets <strong style="color:#fff;">20% off any plan</strong> — and you earn <strong style="color:#D4AF37;">30 days of Pro credit</strong> when they upgrade. Three paid referrals = 3 months completely free.</p>
        <div style="background:#000;border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Your code</div>
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
    subject: 'Your ScholarshipFit referral link is live',
    html: referralWelcomeHtml({ name, code, shareUrl }),
    text: `Hey ${name || 'there'},\n\nYou're now a ScholarshipFit referrer. Share this link and earn 30 days of Pro for every paid referral:\n${shareUrl}\n\n— The ScholarshipFit team`,
  })
}
