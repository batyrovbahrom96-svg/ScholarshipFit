// Verified testimonials — the source of truth.
//
// STRICT RULES for anything added here:
//   1. Real full name (first + last-initial minimum, verified via LinkedIn).
//   2. Real LinkedIn profile URL — MUST resolve to the person's public profile.
//   3. `verified: true` — only set after we've manually confirmed the story
//      (either by DMing the person on LinkedIn OR they submitted via
//      /share-your-story with an email that matches their LinkedIn).
//   4. `scholarship` — real scholarship name.
//   5. `year` — year they won or started.
//   6. `photo_url` — optional; if provided, use a URL you have permission to
//      display (person's LinkedIn photo with permission, or a photo they
//      uploaded themselves).
//   7. `quote` — their words (edited for length/grammar only, never
//      re-worded to change meaning).
//
// If TESTIMONIALS is empty, the TestimonialWall component shows an honest
// "we're a young company" empty state. NEVER fill this with placeholders,
// generated content, or AI-written quotes — that's the exact trust failure
// we're fixing.
export const TESTIMONIALS = [
  // Example structure (COMMENTED OUT — real entries only):
  //
  // {
  //   id: 'unique-slug',
  //   name: 'Full Name',
  //   country: 'Nigeria',
  //   university: 'University of Oxford',
  //   scholarship: 'Chevening Scholarship',
  //   year: 2026,
  //   linkedin_url: 'https://www.linkedin.com/in/their-handle/',
  //   photo_url: 'https://…',       // OPTIONAL. Must have permission to display.
  //   quote: 'Their real words, edited only for clarity.',
  //   verified: true,
  //   verified_at: '2026-07-12',
  //   verified_by: 'Founder',        // who confirmed it
  // },
]

// Guard: at build time, ensure every entry has the required fields OR is
// flagged as verified. This prevents accidental un-verified entries slipping
// into production.
for (const t of TESTIMONIALS) {
  if (!t.verified) throw new Error(`Testimonial ${t.id || t.name} is missing verified:true`)
  if (!t.linkedin_url || !/^https?:\/\/(www\.)?linkedin\.com\//i.test(t.linkedin_url)) {
    throw new Error(`Testimonial ${t.id || t.name} has invalid or missing linkedin_url`)
  }
  if (!t.name || !t.scholarship || !t.quote) {
    throw new Error(`Testimonial ${t.id || t.name} is missing required fields`)
  }
}

export function getVerifiedTestimonials() {
  return TESTIMONIALS.filter((t) => t.verified === true)
}
