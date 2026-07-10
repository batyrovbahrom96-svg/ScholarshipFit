/* Shared pricing plans data — imported by /pricing and landing page section.
   Founder pricing (`founderPrice`/`founderYearly`) is what's shown while
   PAYMENT_MODE = 'preorder'. When we flip to 'live', regular price shows.

   Pricing strategy: "Value-based reset with founder scarcity" (Option A).
   Regular prices anchor the true value ($19 / $49) while founder pricing
   rewards early believers with a permanent lock-in ($9 / $24). The
   Lifetime Founder Deal ($199) is a limited cash-flow booster.
*/

export const PLANS = [
  {
    key: 'free',
    name: 'Free',
    tagline: 'Try before you commit',
    price: '$0',
    unit: '/ month',
    cta: 'Get Started',
    ctaVariant: 'outline',
    features: [
      '2 AI scholarship matches / month',
      '2 Readiness Scores / month',
      'Browse full 68+ scholarship database',
      'Access to Application Tracker',
      '5 AI advisor messages / month',
    ],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'Everything serious applicants need',
    price: '$19',
    unit: '/ month',
    yearlyPrice: '$149',
    yearlyUnit: '/ year',
    yearlySavings: 'save 35%',
    founderPrice: '$9',
    founderYearly: '$79',
    cta: 'Get Started',
    ctaVariant: 'gold',
    features: [
      'Unlock all 303 source-linked scholarships (60 countries)',
      'Unlimited AI Match reports · Claude Sonnet 4.5',
      'Unlimited Application Readiness Scores + gap analysis',
      'AI transcript + essay parser (PDF, DOCX, TXT)',
      'Cabinet: unlimited document storage',
      'Application Tracker · Kanban (Applied / Won / Rejected)',
      'Deadline calendar + auto email reminders (7/3/1 day)',
      'One-click PDF Match Report export (branded)',
      'Save unlimited favorites & custom shortlists',
      'Advanced filters: country, funding, GPA, deadline, degree',
      'Nova AI advisor — unlimited 24/7 chat',
      'Weekly personalised scholarship email digest',
      'New scholarships added every week',
      'Priority email support · < 24h reply',
      '7-day money-back guarantee',
    ],
    highlighted: true,
    badge: 'Recommended',
  },
  {
    key: 'elite',
    name: 'Elite',
    tagline: 'Human experts + AI on your side',
    price: '$49',
    unit: '/ month',
    yearlyPrice: '$399',
    yearlyUnit: '/ year',
    yearlySavings: 'save 32%',
    founderPrice: '$24',
    founderYearly: '$199',
    cta: 'Contact Sales',
    ctaVariant: 'outline',
    features: [
      'Everything in Pro — unlimited',
      'Claude Opus 4.5 advisor (deeper reasoning, longer context)',
      '2 essay reviews / month by professional editor',
      '1 × 30-min 1:1 strategy call / month with an advisor',
      'Deadline concierge — we hand-verify every deadline',
      'Same-day priority support · live chat < 2h',
      '48h early access to newly-added scholarships',
      'Personalised outreach templates for committees',
      'Recommender-letter template library + coaching',
      'CV / résumé review by career expert',
      'Mock interview + feedback session (once/quarter)',
      'Application fee-waiver assistance (US universities)',
      'WhatsApp / Telegram direct line to Elite team',
      'Locked-in founding-cohort price forever',
    ],
    highlighted: false,
  },
]

/* Lifetime Founder Deal — cash-flow booster, first 100 signups only.
   Rendered as a bonus card on /pricing below the main three plans. */
export const LIFETIME_DEAL = {
  key: 'lifetime',
  name: 'Lifetime Founder',
  tagline: 'Pay once. Never pay again. Ever.',
  price: '$199',
  unit: 'one-time',
  originalValue: '$684 over 3 years at Pro founder pricing',
  cta: 'Claim Lifetime Access',
  limitedTo: 100,
  features: [
    'All Pro features — forever · no renewals · no monthly bills',
    'Locked in before the $19/mo regular price goes live',
    'First access to every new feature (before Pro & Elite)',
    'Direct Slack / DM line to the founding team',
    '🏆 Founding Member badge on your profile',
    'Lifetime access to every scholarship added in the future',
    '2 free essay reviews per year (bonus, worth $99)',
    'Annual 30-min strategy call with a founder',
    'Refer-a-friend: 30% commission for life',
    'Exclusive Founder alumni network + private community',
    'Guaranteed price lock — you\u2019ll never pay more',
    'Priority support · forever',
  ],
  disclaimer: 'Limited to the first 100 signups. When they\u2019re gone, this offer disappears.',
}

/* Compact 3-feature summaries for the landing page preview */
export const PLAN_PREVIEWS = {
  free: [
    '2 AI matches / month',
    'Browse 68+ database',
    'Application Tracker',
  ],
  pro: [
    'Unlimited AI matches + Readiness',
    'Deadline reminders + PDF export',
    'Cabinet documents',
  ],
  elite: [
    'Everything in Pro',
    'Essay reviews by experts',
    '1:1 strategy calls',
  ],
}
