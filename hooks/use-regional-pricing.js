'use client'
import { useEffect, useState, useCallback } from 'react'

// -----------------------------------------------------------------------------
// useRegionalPricing — fetches server-side detected tier and per-plan adjusted
// prices. Client can override via country code (persisted in localStorage).
// -----------------------------------------------------------------------------
const STORAGE_KEY = 'sf_region_override'

export function useRegionalPricing() {
  const [region, setRegion] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (overrideCode) => {
    setLoading(true)
    try {
      const qs = overrideCode ? `?country=${encodeURIComponent(overrideCode)}` : ''
      const res = await fetch(`/api/pricing/region${qs}`, { credentials: 'include' })
      const data = await res.json()
      setRegion(data)
    } catch (e) {
      setRegion(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let override = null
    if (typeof window !== 'undefined') {
      override = window.localStorage.getItem(STORAGE_KEY)
    }
    load(override)
  }, [load])

  const setOverride = useCallback((code) => {
    if (typeof window !== 'undefined') {
      if (code) window.localStorage.setItem(STORAGE_KEY, code)
      else window.localStorage.removeItem(STORAGE_KEY)
    }
    load(code)
  }, [load])

  // Convenience: return per-plan price for a given plan key.
  const priceFor = useCallback((planKey, field = 'adjusted_monthly') => {
    const p = region?.plans?.find(x => x.key === planKey)
    return p ? p[field] : null
  }, [region])

  return { region, loading, setOverride, priceFor }
}

// Curated list of countries for the override selector (grouped by tier for clarity).
export const REGION_SELECTOR = [
  { code: '',   label: 'Auto-detect' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'SG', label: 'Singapore' },
  { code: 'JP', label: 'Japan' },
  // Tier B
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'TR', label: 'Türkiye' },
  { code: 'PL', label: 'Poland' },
  { code: 'TH', label: 'Thailand' },
  { code: 'MY', label: 'Malaysia' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'CN', label: 'China' },
  { code: 'RU', label: 'Russia' },
  // Tier C
  { code: 'IN', label: 'India' },
  { code: 'PK', label: 'Pakistan' },
  { code: 'BD', label: 'Bangladesh' },
  { code: 'NP', label: 'Nepal' },
  { code: 'LK', label: 'Sri Lanka' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'KE', label: 'Kenya' },
  { code: 'GH', label: 'Ghana' },
  { code: 'EG', label: 'Egypt' },
  { code: 'MA', label: 'Morocco' },
  { code: 'VN', label: 'Vietnam' },
  { code: 'PH', label: 'Philippines' },
]
