/* Shared pricing plans data — imported by /pricing and landing page section.
   Founder pricing (`founderPrice`/`founderYearly`) is what's shown while
   PAYMENT_MODE = 'preorder'. When we flip to 'live', regular price shows. */

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
      '1 AI scholarship match per week',
      'Browse full 28+ record database',
      '3 favourites in your cabinet',
      '10 AI advisor messages · lifetime',
      'Weekly deadline digest',
    ],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'Everything serious applicants need',
    price: '$9.90',
    unit: '/ month',
    yearlyPrice: '$79',
    yearlyUnit: '/ year',
    yearlySavings: 'save 33%',
    founderPrice: '$4.90',
    founderYearly: '$49',
    cta: 'Get Started',
    ctaVariant: 'gold',
    features: [
      'Unlimited AI scholarship matches',
      'Unlimited AI advisor · Claude Sonnet 4.5',
      'Unlimited favourites & saved searches',
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
    price: '$29',
    unit: '/ month',
    yearlyPrice: '$249',
    yearlyUnit: '/ year',
    yearlySavings: 'save 28%',
    founderPrice: '$19',
    founderYearly: '$149',
    cta: 'Contact Sales',
    ctaVariant: 'outline',
    features: [
      'Everything in Pro',
      'Claude Opus advisor (deeper reasoning)',
      '2 essay reviews / month by expert editor',
      '1 × 30-min strategy call / month',
      'Deadline concierge (we hand-check deadlines)',
      'Early access to new scholarships',
    ],
    highlighted: false,
  },
]

/* Compact 3-feature summaries for the landing page preview */
export const PLAN_PREVIEWS = {
  free: [
    '1 AI match / week',
    'Browse 28+ database',
    '3 favourites',
  ],
  pro: [
    'Unlimited AI matches',
    'Unlimited advisor + PDF export',
    'Deadline reminders',
  ],
  elite: [
    'Everything in Pro',
    'Essay reviews by experts',
    '1:1 strategy calls',
  ],
}
