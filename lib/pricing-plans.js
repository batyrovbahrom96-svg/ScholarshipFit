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
      'Unlimited AI scholarship matches',
      'Unlimited Application Readiness Scores',
      'Unlimited AI advisor · Claude Sonnet 4.5',
      'Cabinet documents (transcript + essay)',
      'Application Tracker (kanban board)',
      'Deadline calendar + email reminders',
      'PDF match-report export',
      'Priority support',
    ],
    highlighted: true,
    badge: 'Recommended',
  },
  {
    key: 'elite',
    name: 'Elite',
    tagline: 'Human concierge + expert review',
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
      'Everything in Pro',
      'Claude Opus advisor (deeper reasoning)',
      '2 essay reviews / month by expert editor',
      '1 × 30-min strategy call / month',
      'Deadline concierge (we hand-check deadlines)',
      'Priority support · same-day replies',
      'Early access to new scholarships',
    ],
    highlighted: false,
  },
]

/* Lifetime Founder Deal — cash-flow booster, first 100 signups only.
   Rendered as a bonus card on /pricing below the main three plans. */
export const LIFETIME_DEAL = {
  key: 'lifetime',
  name: 'Lifetime Founder',
  tagline: 'Pay once. Pro tier for life.',
  price: '$199',
  unit: 'one-time',
  originalValue: '$684 over 3 years at Pro founder pricing',
  cta: 'Claim Lifetime Access',
  limitedTo: 100,
  features: [
    'All Pro features — forever, no monthly bills',
    'Locked in before the regular $19/mo price goes live',
    'First access to every new feature',
    'Direct DM line to the founding team',
    'Displayed on your profile: Founding Member badge',
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
