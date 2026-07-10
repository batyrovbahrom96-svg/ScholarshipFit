// -----------------------------------------------------------------------------
// SUBSCRIPTION PLANS — length-based tiering (2026-07 pricing reset).
//
// The pricing philosophy:
//   1. Anchor Monthly at $14.99/mo — below ScholarshipOwl ($19.95), premium feel
//   2. Progressive discount for longer commitments (Quarterly, Half-Yearly)
//   3. Lifetime VIP $79 — one-time cash-flow booster (drop after first 500 sales)
//   4. All recurring plans include 7-day FREE TRIAL with card capture.
//      Lifetime has no trial (one-time purchase, forever access).
//
// Effective $/mo math:
//   Monthly     :  $14.99 / 30d  = $14.99/mo   (baseline)
//   Quarterly   :  $29    / 90d  = $9.67/mo    (save 35%)  <-- MOST POPULAR
//   Half-Yearly :  $49    / 180d = $8.17/mo    (save 45%)  <-- BEST VALUE
//   Lifetime    :  $79    forever                          <-- Founding member
// -----------------------------------------------------------------------------

// Core features shared across ALL subscription tiers (Monthly / Quarterly / Half-Yearly / Lifetime)
const CORE_FEATURES = [
  'Unlock all 303 source-linked scholarships (60 countries)',
  'Unlimited AI Match reports · Claude Sonnet 4.5',
  'Unlimited Application Readiness Scores + gap analysis',
  'Cabinet · Tracker · deadline reminders · PDF export',
  'Nova AI advisor — unlimited 24/7 chat',
  'Weekly personalised scholarship digest',
  'New scholarships added every week',
  'Priority email support · < 24h reply',
]

// Extra perks only unlocked on Lifetime VIP
const LIFETIME_EXTRAS = [
  'One 500-word essay professionally reviewed each year',
  'Founding-member badge on your profile',
  'Direct DM line to the founding team',
  '48h early access to newly-added scholarships',
  'Refer-a-friend: 30% commission for life',
  'Guaranteed price lock — you will never pay more',
]

export const SUBSCRIPTION_PLANS = [
  {
    key: 'monthly',
    name: 'Monthly',
    display_price: 14.99,        // number shown as $X/mo (effective rate)
    total_charge: 14.99,         // amount actually billed per cycle
    unit: '/mo',
    billing: 'billed monthly',
    days: 30,
    trial_days: 7,
    tier_type: 'subscription',
    ribbon: null,
    accent: 'orange',
    tagline: 'Full flexibility — cancel anytime',
    savings_pct: 0,
    savings_label: null,
    highlight: false,
    cta: 'Start 7-day free trial',
    trial_note: '7 days free · then $14.99/mo · cancel anytime',
    features: CORE_FEATURES,
  },
  {
    key: 'quarterly',
    name: 'Quarterly',
    display_price: 9.67,
    total_charge: 29,
    unit: '/mo',
    billing: 'billed $29 every 3 months',
    days: 90,
    trial_days: 7,
    tier_type: 'subscription',
    ribbon: 'Most Popular',
    accent: 'green',
    tagline: 'Save 35% — one full application cycle',
    savings_pct: 35,
    savings_label: 'Save 35%',
    highlight: true,
    cta: 'Start 7-day free trial',
    trial_note: '7 days free · then $29 every 3 months · cancel anytime',
    features: CORE_FEATURES,
  },
  {
    key: 'half_yearly',
    name: 'Half-Yearly',
    display_price: 8.17,
    total_charge: 49,
    unit: '/mo',
    billing: 'billed $49 every 6 months',
    days: 180,
    trial_days: 7,
    tier_type: 'subscription',
    ribbon: 'Best Value',
    accent: 'gold',
    tagline: 'Save 45% — for multi-cycle applicants',
    savings_pct: 45,
    savings_label: 'Save 45%',
    highlight: false,
    cta: 'Start 7-day free trial',
    trial_note: '7 days free · then $49 every 6 months · cancel anytime',
    features: CORE_FEATURES,
  },
  {
    key: 'lifetime',
    name: 'Lifetime VIP',
    display_price: 79,
    total_charge: 79,
    unit: 'one-time',
    billing: 'Pay once. Keep forever.',
    days: null,                  // no expiry
    trial_days: 0,               // no trial — instant lifetime activation
    tier_type: 'lifetime',
    ribbon: 'Never expires',
    accent: 'gold',
    tagline: 'Founding member — locked in forever',
    savings_pct: 100,
    savings_label: 'Best long-term value',
    highlight: false,
    cta: 'Claim lifetime access',
    trial_note: 'One-time payment · instant access · never renews',
    features: [...CORE_FEATURES, ...LIFETIME_EXTRAS],
  },
]

// Backend-friendly catalogue — used by /api/subscription/activate to compute
// expires_at and trial_end. Keep in sync with SUBSCRIPTION_PLANS above.
export const PLAN_CATALOGUE_V2 = Object.fromEntries(
  SUBSCRIPTION_PLANS.map(p => [p.key, {
    price: p.total_charge,
    days: p.days,
    monthly_rate: p.display_price,
    trial_days: p.trial_days,
    tier_type: p.tier_type,
  }])
)

// ---------------------------------------------------------------------------
// LEGACY exports below — kept for backward compatibility with the older
// /pricing page and any external test/preorder flows. Do NOT remove until
// the /pricing page rewrite is verified end-to-end.
// ---------------------------------------------------------------------------


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
