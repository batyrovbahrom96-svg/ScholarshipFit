// ================================================================
// Onboarding Drip — 5-email post-signup nurture sequence.
// ----------------------------------------------------------------
// Trigger schedule (from user.created_at):
//   D+0  → welcome         (Sent immediately on registration)
//   D+1  → tips            (24h after signup)
//   D+3  → case study      (72h after signup)
//   D+7  → founder note    (7 days after signup)
//   D+14 → last chance     (14 days after signup)
//
// State is tracked on the user document (`onboarding_sent` array).
// Users can unsubscribe via the /unsubscribe?token=… link in every email.
// ================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://scholarshipfit.com'
const FROM_ADDR = process.env.EMAIL_SENDER_ADDRESS || 'verify@scholarshipfit.com'
const FROM_NAME = process.env.EMAIL_SENDER_NAME    || 'ScholarshipFit'

/* Shared HTML shell — matches OTP + password-reset styling for brand consistency. */
function shell({ title, previewText = '', bodyInner, footerNote = '', unsubscribeUrl }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
    <span style="display:none!important;visibility:hidden;opacity:0;font-size:1px;color:#0a0a0a;">${previewText}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#111417;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.35);color:#F0D77A;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">Scholarshipfit</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 28px 32px;color:#e5e7eb;font-size:15px;line-height:1.65;">
                ${bodyInner}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 24px 32px;border-top:1px solid rgba(255,255,255,0.06);color:#9ca3af;font-size:12px;line-height:1.6;">
                ${footerNote || "You're receiving this because you signed up at ScholarshipFit."}<br/>
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                &nbsp;·&nbsp;<a href="${BASE_URL}" style="color:#9ca3af;text-decoration:underline;">scholarshipfit.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function ctaButton(label, url) {
  return `<a href="${url}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#F0D77A,#D4AF37);color:#0a0a0a;font-weight:700;text-decoration:none;border-radius:999px;font-size:14px;letter-spacing:0.02em;">${label}</a>`
}

const safe = (s) => (s || '').toString().replace(/[<>&"']/g, '')

/* ============================================================
   D+0 — Welcome (fired immediately on register)
   ============================================================ */
export function welcomeEmail({ name, unsubscribeUrl }) {
  const inner = `
    <h1 style="margin:16px 0 12px;font-size:26px;color:#ffffff;font-weight:700;">Welcome, ${safe(name) || 'there'} — you're in.</h1>
    <p>You just gave yourself a serious edge over 90% of scholarship applicants who spend months googling and miss deadlines they'd actually have won.</p>
    <p style="margin:20px 0 8px;color:#F0D77A;font-weight:600;">Your first move:</p>
    <p style="margin:0 0 18px;">Run the 8-step match quiz. It ranks all 800 hand-verified scholarships against your exact profile in under 3 minutes. You'll walk away knowing which ones you're actually a fit for (and which to skip).</p>
    <p style="margin:22px 0;">${ctaButton('Take the Match Quiz →', `${BASE_URL}/quiz`)}</p>
    <p style="margin:24px 0 8px;color:#9ca3af;font-size:13px;"><strong style="color:#e5e7eb;">What's next in this series:</strong></p>
    <ul style="color:#9ca3af;font-size:13px;padding-left:18px;margin:0;">
      <li style="margin:4px 0;">Tomorrow → 3 features 90% of applicants miss</li>
      <li style="margin:4px 0;">In 3 days → How Priya won Chevening in 6 weeks</li>
      <li style="margin:4px 0;">In a week → A note from the founder</li>
    </ul>
  `
  return {
    subject: `Welcome to ScholarshipFit — your next step 👇`,
    html: shell({ title: 'Welcome to ScholarshipFit', previewText: "You're in. Here's your first move.", bodyInner: inner, unsubscribeUrl }),
    text: `Welcome, ${name || 'there'}!\n\nYour first move: run the 8-step Match Quiz. It ranks all 800 scholarships against your profile in 3 minutes.\n\n${BASE_URL}/quiz\n\n— The ScholarshipFit team\n\nUnsubscribe: ${unsubscribeUrl}`,
  }
}

/* ============================================================
   D+1 — Feature tips (24h after signup)
   ============================================================ */
export function tipsEmail({ name, unsubscribeUrl }) {
  const inner = `
    <h1 style="margin:16px 0 12px;font-size:26px;color:#ffffff;font-weight:700;">The 3 features 90% of applicants miss.</h1>
    <p>Hey ${safe(name) || 'there'} — quick one. Most people who sign up only use the quiz. Then they leave. That's a mistake.</p>

    <p style="margin:20px 0 6px;color:#F0D77A;font-weight:600;">1. Nova AI advisor</p>
    <p style="margin:0 0 16px;">Ask "What UK scholarships fit my profile?" or "Rewrite my SOP opening." Grounded in 800 real records — no hallucinations. Free tier gets 10 replies/day. <a href="${BASE_URL}/advisor" style="color:#F0D77A;">Try Nova →</a></p>

    <p style="margin:20px 0 6px;color:#F0D77A;font-weight:600;">2. Essay Generator</p>
    <p style="margin:0 0 16px;">Give us your profile + a scholarship. We draft a first-person essay that opens with a specific moment, weaves your real achievements, and closes with a clear career vision. Free tier: 3 essays/month. <a href="${BASE_URL}/essay-generator" style="color:#F0D77A;">Draft an essay →</a></p>

    <p style="margin:20px 0 6px;color:#F0D77A;font-weight:600;">3. Application Tracker</p>
    <p style="margin:0 0 16px;">A Kanban board showing every application's status. Never miss a deadline again — we email you 7/3/1 days before each one. <a href="${BASE_URL}/dashboard/tracker" style="color:#F0D77A;">Open Tracker →</a></p>

    <p style="margin:24px 0;">${ctaButton("Explore your Cabinet →", `${BASE_URL}/dashboard`)}</p>
  `
  return {
    subject: `The 3 features 90% of applicants miss`,
    html: shell({ title: '3 features you\'re not using yet', previewText: 'Nova, Essay Generator, and Tracker.', bodyInner: inner, unsubscribeUrl }),
    text: `Hey ${name || 'there'}!\n\nMost people only use the quiz. Then they leave. That's a mistake.\n\n1. Nova AI advisor — ${BASE_URL}/advisor\n2. Essay Generator — ${BASE_URL}/essay-generator\n3. Application Tracker — ${BASE_URL}/dashboard/tracker\n\n— ScholarshipFit\n\nUnsubscribe: ${unsubscribeUrl}`,
  }
}

/* ============================================================
   D+3 — Case study (72h after signup)
   ============================================================ */
export function caseStudyEmail({ name, unsubscribeUrl }) {
  const inner = `
    <h1 style="margin:16px 0 12px;font-size:26px;color:#ffffff;font-weight:700;">How Priya won Chevening in 6 weeks.</h1>
    <p>Hi ${safe(name) || 'there'} — here's a story worth reading over coffee.</p>

    <p style="margin:16px 0;">Priya, a mid-career product manager from Bangalore, had already applied to Chevening once and been rejected. She almost didn't apply again. Then a friend sent her ScholarshipFit.</p>

    <p style="margin:16px 0;"><strong style="color:#F0D77A;">Week 1:</strong> She ran the quiz. Her fit score for Chevening was 92%. The gap analysis flagged she was missing 2 documents her first application didn't have.</p>

    <p style="margin:16px 0;"><strong style="color:#F0D77A;">Week 2:</strong> She used Nova to identify 3 additional scholarships she'd never heard of that fit even better on paper.</p>

    <p style="margin:16px 0;"><strong style="color:#F0D77A;">Week 3-4:</strong> She generated 3 essay drafts. Iterated based on Nova's coaching feedback. Interviewed her old manager for a letter of recommendation.</p>

    <p style="margin:16px 0;"><strong style="color:#F0D77A;">Week 5-6:</strong> Submitted. Called in for interview. Got the offer.</p>

    <p style="margin:20px 0;font-size:14px;color:#9ca3af;font-style:italic;">"What sold me was the honesty. Other platforms told me I had 100 matches. ScholarshipFit told me I had 4 strong fits and why. Applied to all 4 — won 1. Beats spamming 100 forms."</p>

    <p style="margin:24px 0;">${ctaButton('Start your 6-week sprint →', `${BASE_URL}/quiz`)}</p>

    <p style="margin:24px 0 8px;font-size:12px;color:#6b7280;font-style:italic;">Names and details in this story are illustrative composites of the typical ScholarshipFit user journey.</p>
  `
  return {
    subject: `How Priya won Chevening in 6 weeks`,
    html: shell({ title: 'A 6-week Chevening sprint', previewText: "Rejected the first time. Won the second.", bodyInner: inner, unsubscribeUrl }),
    text: `How Priya won Chevening in 6 weeks:\n\nWeek 1: Quiz + gap analysis (92% fit, 2 missing docs)\nWeek 2: Nova found 3 more scholarships\nWeek 3-4: Essay drafts + coaching\nWeek 5-6: Submitted → interviewed → won\n\nStart your sprint: ${BASE_URL}/quiz\n\nUnsubscribe: ${unsubscribeUrl}`,
  }
}

/* ============================================================
   D+7 — Founder note (7 days after signup)
   ============================================================ */
export function founderEmail({ name, unsubscribeUrl }) {
  const inner = `
    <h1 style="margin:16px 0 12px;font-size:26px;color:#ffffff;font-weight:700;">A quick note from the founder.</h1>
    <p>Hi ${safe(name) || 'there'},</p>

    <p style="margin:16px 0;">This is Bakhrom, the founder. Real email, hitting your inbox because you signed up a week ago.</p>

    <p style="margin:16px 0;">I built ScholarshipFit because I spent 6 months of my own scholarship search on aggregator sites showing me the same 40,000 dead links, expired programs, and outright scams. I got fed up and built the tool I wished existed.</p>

    <p style="margin:16px 0;">Today: 800 hand-verified scholarships, all source-linked to the official provider. No dead links. No aggregator middlemen. And AI-powered matching + essay writing that would cost you $500+ from a consultant.</p>

    <p style="margin:16px 0;">Founder pricing (68% off) is locked to the first 500 sign-ups. When those slots close, prices go up. Permanently.</p>

    <p style="margin:20px 0;color:#F0D77A;font-weight:600;">If ScholarshipFit has been useful — I'd love your feedback.</p>

    <p style="margin:16px 0;">Just reply to this email. Every message hits my personal inbox. What's working? What's confusing? What would make you 10x more likely to apply to a scholarship this month?</p>

    <p style="margin:24px 0;">${ctaButton('Lock in founder pricing →', `${BASE_URL}/pricing`)}</p>

    <p style="margin:24px 0 8px;">— Bakhrom<br/><span style="color:#9ca3af;font-size:13px;">Founder, ScholarshipFit</span></p>
  `
  return {
    subject: `A quick note from the founder`,
    html: shell({ title: 'From Bakhrom, founder', previewText: "Real email. Reply if you want.", bodyInner: inner, unsubscribeUrl }),
    text: `Hi ${name || 'there'},\n\nThis is Bakhrom, founder of ScholarshipFit. Real email — reply anytime.\n\nI built this because I got tired of aggregator sites showing 40,000 dead links. Today we have 800 hand-verified scholarships, all source-linked.\n\nFounder pricing (68% off) is locked to the first 500 sign-ups. ${BASE_URL}/pricing\n\nReply if you have feedback. Every message hits my inbox.\n\n— Bakhrom\n\nUnsubscribe: ${unsubscribeUrl}`,
  }
}

/* ============================================================
   D+14 — Last chance (14 days after signup)
   ============================================================ */
export function lastChanceEmail({ name, unsubscribeUrl }) {
  const inner = `
    <h1 style="margin:16px 0 12px;font-size:26px;color:#ffffff;font-weight:700;">Your Cabinet is waiting.</h1>
    <p>Hi ${safe(name) || 'there'},</p>

    <p style="margin:16px 0;">Two weeks ago you joined ScholarshipFit. Since then, several major deadlines have opened:</p>

    <ul style="margin:16px 0;padding-left:20px;color:#e5e7eb;">
      <li style="margin:6px 0;"><strong style="color:#F0D77A;">Fulbright Foreign Student Program</strong> — deadline in ~3 weeks (varies by country)</li>
      <li style="margin:6px 0;"><strong style="color:#F0D77A;">DAAD EPOS Master's</strong> — rolling admissions</li>
      <li style="margin:6px 0;"><strong style="color:#F0D77A;">Erasmus Mundus</strong> — January window</li>
    </ul>

    <p style="margin:16px 0;">Most applicants who miss a scholarship miss it not because they didn't qualify — but because they didn't submit. A 2-hour investment now saves a year of waiting.</p>

    <p style="margin:16px 0;">If you haven't run the quiz yet, this is the nudge:</p>

    <p style="margin:24px 0;">${ctaButton('Get my match list →', `${BASE_URL}/quiz`)}</p>

    <p style="margin:20px 0;color:#9ca3af;font-size:13px;">P.S. Founder pricing is still active — but not for much longer. <a href="${BASE_URL}/pricing" style="color:#F0D77A;">See plans →</a></p>
  `
  return {
    subject: `Your Cabinet is waiting (and Fulbright closes in 3 weeks)`,
    html: shell({ title: 'A gentle nudge', previewText: 'Major scholarship deadlines are closing.', bodyInner: inner, unsubscribeUrl }),
    text: `Hi ${name || 'there'},\n\nMajor scholarship deadlines are closing:\n- Fulbright: ~3 weeks\n- DAAD EPOS: rolling\n- Erasmus Mundus: January\n\nA 2-hour investment now saves a year of waiting.\n\nRun the quiz: ${BASE_URL}/quiz\n\nFounder pricing is still active: ${BASE_URL}/pricing\n\nUnsubscribe: ${unsubscribeUrl}`,
  }
}

/* ============================================================
   Send helper — one entry point per stage.
   ============================================================ */
export const DRIP_STAGES = ['welcome', 'tips', 'case_study', 'founder', 'last_chance']

// Days since signup that trigger each stage. Includes a 1-day grace window.
export const DRIP_SCHEDULE = {
  welcome:     { day: 0,  builder: welcomeEmail },
  tips:        { day: 1,  builder: tipsEmail },
  case_study:  { day: 3,  builder: caseStudyEmail },
  founder:     { day: 7,  builder: founderEmail },
  last_chance: { day: 14, builder: lastChanceEmail },
}

export async function sendDripEmail({ stage, to, name, unsubscribeUrl }) {
  const cfg = DRIP_SCHEDULE[stage]
  if (!cfg) return { ok: false, error: `unknown stage: ${stage}` }
  const { subject, html, text } = cfg.builder({ name, unsubscribeUrl })
  // Lazy import to avoid loading resend SDK when unused (edge safety)
  const { sendEmail } = await import('./resend')
  return sendEmail({ to, subject, html, text })
}

export { FROM_ADDR, FROM_NAME }
