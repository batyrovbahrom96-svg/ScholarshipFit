// Resend transactional email — singleton client + branded templates.
// Uses the modern `resend` SDK (v6+). All calls return { ok, error } — never throws
// to the API route, so we can gracefully degrade if the provider has an outage.
import { Resend } from 'resend'

const API_KEY   = process.env.RESEND_API_KEY || ''
const FROM_ADDR = process.env.EMAIL_SENDER_ADDRESS || 'verify@scholarshipfit.com'
const FROM_NAME = process.env.EMAIL_SENDER_NAME    || 'ScholarshipFit'
const FROM      = `${FROM_NAME} <${FROM_ADDR}>`

let _resend = null
function client() {
  if (!API_KEY) return null
  if (!_resend) _resend = new Resend(API_KEY)
  return _resend
}

/* ------------------------------------------------------------------ */
/*  Branded OTP email — dark theme + gold accent (matches ScholarshipFit)  */
/* ------------------------------------------------------------------ */
export function verificationEmailHtml({ code, name }) {
  const safeName = (name || 'there').replace(/[<>&"']/g, '')
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Your ScholarshipFit verification code</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
      Your ScholarshipFit verification code is ${code}. It expires in 10 minutes.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr><td align="center" style="padding:8px 0 24px 0;">
            <div style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:#D4AF37;">ScholarshipFit<span style="color:#ffffff;">.com</span></div>
            <div style="margin-top:4px;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(255,255,255,0.4);">AI Scholarship Command Center</div>
          </td></tr>

          <!-- Card -->
          <tr><td style="background:#111111;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:36px 28px;">
            <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D4AF37;">Verify your email</div>
            <h1 style="margin:8px 0 12px 0;font-size:26px;line-height:1.2;color:#ffffff;font-weight:600;">Hi ${safeName}, welcome to ScholarshipFit.</h1>
            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72);">
              Enter this 6-digit code in the verification screen to activate your account. This code expires in <strong style="color:#ffffff;">10 minutes</strong>.
            </p>

            <!-- Code block -->
            <div style="background:#000000;border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:22px;text-align:center;">
              <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:38px;font-weight:700;letter-spacing:14px;color:#D4AF37;">${code}</div>
            </div>

            <p style="margin:22px 0 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.5);">
              If you didn't try to sign up, someone probably typed your email by mistake. You can safely ignore this message — no account will be created.
            </p>
          </td></tr>

          <!-- Footer -->
          <tr><td align="center" style="padding:24px 0 8px 0;">
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">
              Real records · Official sources · Honest reasoning
            </div>
            <div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.35);">
              &copy; ${new Date().getFullYear()} ScholarshipFit · scholarshipfit.com
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export function verificationEmailText({ code, name }) {
  return `Hi ${name || 'there'},

Welcome to ScholarshipFit. Please use the verification code below to confirm your email:

  ${code}

This code expires in 10 minutes.

If you didn't try to sign up, you can safely ignore this email.

— The ScholarshipFit team
scholarshipfit.com`
}

/* ------------------------------------------------------------------ */
/*  Send a 6-digit verification OTP email                             */
/*  Returns { ok: true } on success or { ok: false, error } on failure */
/* ------------------------------------------------------------------ */
export async function sendVerificationEmail({ to, code, name }) {
  const c = client()
  if (!c) return { ok: false, error: 'Email provider not configured (RESEND_API_KEY missing).' }
  try {
    const { data, error } = await c.emails.send({
      from:    FROM,
      to,
      subject: `Your ScholarshipFit verification code: ${code}`,
      html:    verificationEmailHtml({ code, name }),
      text:    verificationEmailText({ code, name }),
      headers: { 'X-Entity-Ref-ID': `otp-${Date.now()}` },
    })
    if (error) return { ok: false, error: error.message || String(error) }
    return { ok: true, id: data?.id || null }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

/* ------------------------------------------------------------------ */
/*  Branded PASSWORD RESET email                                        */
/* ------------------------------------------------------------------ */
export function passwordResetEmailHtml({ resetUrl, name }) {
  const safeName = (name || 'there').replace(/[<>&"']/g, '')
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Reset your ScholarshipFit password</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
      Someone requested a password reset for your ScholarshipFit account.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr><td align="center" style="padding:8px 0 24px 0;">
            <div style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:#D4AF37;">ScholarshipFit<span style="color:#ffffff;">.com</span></div>
            <div style="margin-top:4px;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(255,255,255,0.4);">AI Scholarship Command Center</div>
          </td></tr>

          <tr><td style="background:#111111;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:36px 28px;">
            <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D4AF37;">Password reset requested</div>
            <h1 style="margin:8px 0 12px 0;font-size:26px;line-height:1.2;color:#ffffff;font-weight:600;">Hi ${safeName}, let's get you back in.</h1>
            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72);">
              Click the button below to choose a new password. This link expires in <strong style="color:#ffffff;">60 minutes</strong> and can only be used once.
            </p>

            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#D4AF37;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:999px;">Reset my password →</a>
            </div>

            <p style="margin:0 0 6px 0;font-size:12px;color:rgba(255,255,255,0.5);">Or copy this link into your browser:</p>
            <p style="margin:0 0 22px 0;font-size:11px;word-break:break-all;font-family:'SF Mono','Menlo','Consolas',monospace;color:rgba(212,175,55,0.85);">${resetUrl}</p>

            <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:16px;padding-top:16px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.55);">
                <strong style="color:rgba(255,255,255,0.75);">Didn't request this?</strong> You can safely ignore this email — your password will remain unchanged. For security, this link expires automatically in 60 minutes.
              </p>
            </div>
          </td></tr>

          <tr><td align="center" style="padding:24px 0 8px 0;">
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">Real records · Official sources · Honest reasoning</div>
            <div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.35);">&copy; ${new Date().getFullYear()} ScholarshipFit · scholarshipfit.com</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export function passwordResetEmailText({ resetUrl, name }) {
  return `Hi ${name || 'there'},

Someone (hopefully you) requested a password reset for your ScholarshipFit account.

Reset your password by clicking this link (expires in 60 minutes):

${resetUrl}

If you didn't request this, you can safely ignore this email — your password will remain unchanged.

— The ScholarshipFit team
scholarshipfit.com`
}

export async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const c = client()
  if (!c) return { ok: false, error: 'Email provider not configured (RESEND_API_KEY missing).' }
  try {
    const { data, error } = await c.emails.send({
      from:    FROM,
      to,
      subject: 'Reset your ScholarshipFit password',
      html:    passwordResetEmailHtml({ resetUrl, name }),
      text:    passwordResetEmailText({ resetUrl, name }),
      headers: { 'X-Entity-Ref-ID': `reset-${Date.now()}` },
    })
    if (error) return { ok: false, error: error.message || String(error) }
    return { ok: true, id: data?.id || null }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

/* ------------------------------------------------------------------ */
/*  Branded DEADLINE REMINDER email                                     */
/* ------------------------------------------------------------------ */
export function deadlineReminderEmailHtml({ name, scholarshipName, provider, sourceUrl, deadlineDate, daysLeft, unsubscribeUrl }) {
  const safeName = (name || 'there').replace(/[<>&"']/g, '')
  const safeSchool = (scholarshipName || 'your scholarship').replace(/[<>&"']/g, '')
  const safeProv   = (provider || '').replace(/[<>&"']/g, '')
  const urgencyColor = daysLeft <= 1 ? '#EF4444' : daysLeft <= 7 ? '#F59E0B' : '#D4AF37'
  const urgencyLabel = daysLeft <= 1 ? 'TOMORROW' : daysLeft <= 7 ? 'FINAL WEEK' : daysLeft <= 14 ? 'TWO WEEKS OUT' : 'ONE MONTH LEFT'
  const dateStr = new Date(deadlineDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return `<!doctype html>
<html>
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Deadline reminder: ${safeSchool}</title></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
      ${daysLeft} day${daysLeft === 1 ? '' : 's'} until ${safeSchool} closes. Deadline: ${dateStr}.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr><td align="center" style="padding:8px 0 24px 0;">
            <div style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:#D4AF37;">ScholarshipFit<span style="color:#ffffff;">.com</span></div>
          </td></tr>

          <tr><td style="background:#111111;border:1px solid ${urgencyColor}40;border-radius:16px;padding:36px 28px;">
            <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${urgencyColor}20;color:${urgencyColor};font-size:11px;letter-spacing:0.16em;font-weight:600;">${urgencyLabel}</div>

            <h1 style="margin:14px 0 8px 0;font-size:26px;line-height:1.25;color:#ffffff;font-weight:600;">${daysLeft === 1 ? "Tomorrow's the deadline." : daysLeft === 7 ? '7 days left.' : daysLeft === 14 ? '2 weeks left.' : '1 month to go.'}</h1>
            <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);">
              Hi ${safeName}, this is a friendly nudge about a scholarship you saved:
            </p>

            <div style="background:#000000;border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:18px 20px;margin-bottom:22px;">
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(212,175,55,0.75);">${safeProv || 'Scholarship'}</div>
              <div style="margin-top:4px;font-size:18px;color:#ffffff;font-weight:600;line-height:1.35;">${safeSchool}</div>
              <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.65);">
                <strong style="color:${urgencyColor};">Deadline: ${dateStr}</strong>
              </div>
            </div>

            ${sourceUrl ? `<div style="text-align:center;margin:24px 0;">
              <a href="${sourceUrl}" style="display:inline-block;background:#D4AF37;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;">Open the official application →</a>
            </div>` : ''}

            <p style="margin:22px 0 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.6);">
              <strong style="color:#ffffff;">Quick pre-flight checklist:</strong><br/>
              1. Motivation letter tailored to this program (not recycled)<br/>
              2. Two references confirmed and briefed<br/>
              3. Transcripts + English test score uploaded<br/>
              4. Application form fully complete
            </p>
          </td></tr>

          <tr><td align="center" style="padding:20px 8px 8px 8px;">
            <div style="font-size:11px;color:rgba(255,255,255,0.35);">You're getting this because you saved this scholarship on ScholarshipFit.</div>
            ${unsubscribeUrl ? `<div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.35);">
              <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Turn off deadline reminders</a>
            </div>` : ''}
            <div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.35);">&copy; ${new Date().getFullYear()} ScholarshipFit · scholarshipfit.com</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export function deadlineReminderEmailText({ name, scholarshipName, provider, sourceUrl, deadlineDate, daysLeft, unsubscribeUrl }) {
  return `Hi ${name || 'there'},

${daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`} until this scholarship closes:

  ${scholarshipName}
  ${provider ? `Provider: ${provider}\n` : ''}  Deadline: ${new Date(deadlineDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${sourceUrl ? `Open the application:\n${sourceUrl}\n` : ''}
Pre-flight checklist:
  1. Motivation letter tailored to THIS program
  2. Two references confirmed and briefed
  3. Transcripts + English test uploaded
  4. Application form 100% complete

— The ScholarshipFit team
${unsubscribeUrl ? `\nTurn off deadline reminders: ${unsubscribeUrl}` : ''}`
}

export async function sendDeadlineReminderEmail(payload) {
  const c = client()
  if (!c) return { ok: false, error: 'Email provider not configured.' }
  try {
    const { data, error } = await c.emails.send({
      from:    FROM,
      to:      payload.to,
      subject: payload.daysLeft === 1
        ? `⏰ Deadline tomorrow: ${payload.scholarshipName}`
        : `${payload.daysLeft} days left: ${payload.scholarshipName}`,
      html: deadlineReminderEmailHtml(payload),
      text: deadlineReminderEmailText(payload),
      headers: { 'X-Entity-Ref-ID': `dl-${Date.now()}` },
    })
    if (error) return { ok: false, error: error.message || String(error) }
    return { ok: true, id: data?.id || null }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

/* ------------------------------------------------------------------ */
/*  Generic branded email — reused later for founder-blast, reminders */
/* ------------------------------------------------------------------ */
export async function sendEmail({ to, subject, html, text }) {
  const c = client()
  if (!c) return { ok: false, error: 'Email provider not configured.' }
  try {
    const { data, error } = await c.emails.send({ from: FROM, to, subject, html, text })
    if (error) return { ok: false, error: error.message || String(error) }
    return { ok: true, id: data?.id || null }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

export const EMAIL_FROM_ADDRESS = FROM_ADDR
export const EMAIL_FROM_NAME    = FROM_NAME
