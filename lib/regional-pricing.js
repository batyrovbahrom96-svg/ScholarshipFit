// -----------------------------------------------------------------------------
// Regional / PPP (Purchasing Power Parity) pricing for ScholarshipFit.
//
// Because our buyers are international students — including many from low-income
// countries — a flat USD price would kill conversions in Tier B/C markets.
// This module maps ISO country codes to tier (A/B/C) with a discount % applied
// to the base SUBSCRIPTION_PLANS pricing.
//
// Server-verified: the /api/subscription/activate route re-checks the tier
// server-side so the client cannot spoof a bigger discount.
// -----------------------------------------------------------------------------

export const REGION_TIERS = {
  A: { key: 'A', discount: 0.00, label: 'Standard pricing',        note: 'No regional adjustment' },
  B: { key: 'B', discount: 0.40, label: 'Regional pricing — 40% off', note: 'Emerging economies' },
  C: { key: 'C', discount: 0.60, label: 'Regional pricing — 60% off', note: 'Lower-income countries' },
}

// ISO 3166-1 alpha-2 country codes.
// Tier A (Standard) = the default for anything NOT listed below.
// (Includes US, UK, EU, Canada, Australia, GCC, Singapore, Japan, HK, SK,
// Switzerland, Norway, Sweden, Denmark, etc.)

export const COUNTRY_TO_TIER = {
  // ---------------------------------------------------------------------------
  // Tier B — 40% off (emerging / middle-income)
  // ---------------------------------------------------------------------------
  // Latin America (except AR/CL/UY which trend higher)
  BR: 'B', MX: 'B', CO: 'B', PE: 'B', EC: 'B', BO: 'B', PY: 'B', VE: 'B',
  GT: 'B', HN: 'B', SV: 'B', NI: 'B', DO: 'B', CU: 'B', PA: 'B', CR: 'B',

  // SE Asia (except SG which is Tier A)
  TH: 'B', ID: 'B', PH: 'B', VN: 'B', MY: 'B', BN: 'B',

  // Eastern Europe / Balkans / Türkiye
  PL: 'B', RO: 'B', HU: 'B', BG: 'B', RS: 'B', HR: 'B', SK: 'B', CZ: 'B',
  SI: 'B', LT: 'B', LV: 'B', EE: 'B', UA: 'B', BY: 'B', MD: 'B', MK: 'B',
  AL: 'B', BA: 'B', ME: 'B', XK: 'B',
  TR: 'B',

  // Central Asia
  KZ: 'B', UZ: 'B', TM: 'B', TJ: 'B', KG: 'B', GE: 'B', AM: 'B', AZ: 'B',

  // Mid-tier MENA
  JO: 'B', LB: 'B', TN: 'B',

  // Africa (upper-middle income)
  ZA: 'B', MU: 'B', NA: 'B', BW: 'B',

  // Others
  CN: 'B', RU: 'B', MN: 'B',

  // ---------------------------------------------------------------------------
  // Tier C — 60% off (lower-income / high-need scholarship markets)
  // ---------------------------------------------------------------------------
  // South Asia
  IN: 'C', PK: 'C', BD: 'C', LK: 'C', NP: 'C', BT: 'C', MV: 'C', AF: 'C',

  // Sub-Saharan Africa
  NG: 'C', KE: 'C', UG: 'C', TZ: 'C', GH: 'C', ET: 'C', RW: 'C', ZM: 'C',
  ZW: 'C', MW: 'C', MZ: 'C', CM: 'C', SN: 'C', CI: 'C', ML: 'C', BF: 'C',
  NE: 'C', TD: 'C', SD: 'C', SS: 'C', SO: 'C', ER: 'C', DJ: 'C', BJ: 'C',
  TG: 'C', LR: 'C', SL: 'C', GN: 'C', CF: 'C', CG: 'C', CD: 'C', GA: 'C',
  AO: 'C', MG: 'C', LS: 'C', SZ: 'C', GM: 'C', GW: 'C',

  // Low-income MENA
  EG: 'C', MA: 'C', DZ: 'C', YE: 'C', SY: 'C', IQ: 'C', IR: 'C', LY: 'C', PS: 'C',

  // Lower-income SE Asia
  MM: 'C', KH: 'C', LA: 'C', TL: 'C', PG: 'C',

  // Others
  HT: 'C',
}

// Given an ISO2 country code, return the tier config.
export function tierForCountry(code) {
  const normalized = (code || '').toUpperCase().trim()
  const tierKey = COUNTRY_TO_TIER[normalized] || 'A'
  return { country: normalized || null, ...REGION_TIERS[tierKey] }
}

// Apply the regional discount to a base USD price. Round to 2 decimals.
export function applyRegionalDiscount(basePrice, tierKey) {
  const t = REGION_TIERS[tierKey] || REGION_TIERS.A
  const adjusted = Number(basePrice) * (1 - t.discount)
  return Math.round(adjusted * 100) / 100
}

// Server-side helper: read country from common CDN/proxy headers.
// Priority: Cloudflare > Vercel > Netlify > Fastly > x-country-code fallback.
export function detectCountryFromHeaders(headers) {
  if (!headers) return null
  const get = (k) => {
    // Support both real Headers and plain objects.
    if (typeof headers.get === 'function') return headers.get(k)
    return headers[k] || headers[k.toLowerCase()]
  }
  const candidates = [
    'cf-ipcountry',
    'x-vercel-ip-country',
    'x-country-code',
    'x-appengine-country',
    'fastly-country-code',
  ]
  for (const h of candidates) {
    const v = get(h)
    if (v && typeof v === 'string' && v.length === 2) return v.toUpperCase()
  }
  return null
}
