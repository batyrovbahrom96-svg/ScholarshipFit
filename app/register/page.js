import { redirect } from 'next/navigation'

// /register is a ScholarshipOwl-style alias to our multi-step onboarding
// flow. Preserves any query params (e.g. ?country=US&level=Master's).
export default function Register({ searchParams }) {
  const params = searchParams instanceof Promise ? {} : (searchParams || {})
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, String(v))
  redirect('/onboarding' + (qs.toString() ? `?${qs.toString()}` : ''))
}
