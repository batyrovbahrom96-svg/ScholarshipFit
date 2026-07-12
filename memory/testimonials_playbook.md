# Verified Testimonials — Playbook

## What changed (2026-07-12)

1. **Deleted `WinnerTicker.jsx`** — the floating "Marcus D. won $40k DAAD" pill was obviously fake and undermined trust. Gone.
2. **Rewrote `TestimonialWall.jsx`** — now reads from `/app/lib/testimonials.js` and shows ONLY entries that have:
   - `verified: true`
   - A valid `linkedin_url` (must match `https://(www.)?linkedin.com/`)
   - All required fields (name, scholarship, quote)
3. **Honest empty state** — when the testimonials list is empty, the wall shows: *"We're a young company. We won't fake the numbers."* + a CTA to the submission form.
4. **New `/share-your-story` page** — public submission form for real users to send in their success stories. Validates:
   - LinkedIn URL must be a linkedin.com profile
   - All required fields present
   - Rate-limited to 3 submissions per email per 24h
5. **New API endpoint `POST /api/testimonials/submit`** — writes to a moderation queue (`testimonial_submissions` collection). PostHog event fires on submit.
6. **New admin endpoint `GET /api/admin/testimonials?password=…&status=pending`** — view pending submissions.
7. **`OutcomeVideoCard.jsx` — added LinkedIn verify pill** — when an outcome has `linkedin_url`, the card renders a small "Verify" LinkedIn link next to their university.

## How to publish a new verified testimonial

**Step 1: Someone submits via `/share-your-story`**
Their submission lands in `testimonial_submissions` collection with `status: 'pending'`.

**Step 2: Admin reviews via `GET /api/admin/testimonials?password=…`**
Open the LinkedIn URL — confirm it's really them, confirm the scholarship story makes sense. Reach out via email to double-confirm consent.

**Step 3: Add to `/app/lib/testimonials.js`**
```js
export const TESTIMONIALS = [
  {
    id: 'adaora-okafor-chevening-2026',
    name: 'Adaora Okafor',
    country: 'Nigeria',
    university: 'University of Oxford',
    scholarship: 'Chevening Scholarship',
    year: 2026,
    linkedin_url: 'https://www.linkedin.com/in/adaora-okafor/',
    photo_url: 'https://…',   // optional, only if you have permission
    quote: 'Her actual words, edited only for clarity — never re-worded.',
    verified: true,
    verified_at: '2026-07-15',
    verified_by: 'Founder',
  },
]
```

**Step 4: Update submission status**
Mark the corresponding row in `testimonial_submissions` as `status: 'published'` for admin trail.

## How to add LinkedIn URLs to existing video outcomes

Open `/app/lib/outcomes-data.js` and add `linkedin_url` field to any student who's on LinkedIn:

```js
{
  slug: 'jasur-yaxshilikov',
  name: 'Jasur Yaxshilikov',
  university: 'Stanford University',
  university_short: 'Stanford',
  scholarship: '...',
  linkedin_url: 'https://www.linkedin.com/in/jasur-y/',  // ← add this line
  ...
}
```

A small `Linkedin · Verify` pill will render automatically on the outcome card.

## Guardrails baked into the code

- `/app/lib/testimonials.js` has a runtime **assertion loop** at module load — every entry must have `verified: true`, a valid LinkedIn URL, and required fields. If any entry fails validation, the whole module throws at import time (fails the build). This makes it impossible to accidentally ship an unverified entry.
- Submission API validates LinkedIn URL format server-side.
- Rate-limited to prevent spam submissions.
