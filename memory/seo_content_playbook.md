# SEO Content Playbook — ScholarshipFit

## What's live now (2026-07-12)

### 50 SEO landing pages
File: `/app/lib/seo-slugs.js` — the single source of truth. Add/reorder here.

- **20 nationality-scoped**: `/scholarships/for-nigerian-students`, `-indian-`, `-pakistani-`, `-kenyan-`, `-bangladeshi-`, `-egyptian-`, `-ghanaian-`, `-south-african-`, `-vietnamese-`, `-filipino-`, `-chinese-`, `-turkish-`, `-mexican-`, `-brazilian-`, `-colombian-`, `-moroccan-`, `-ethiopian-`, `-tanzanian-`, `-ugandan-`, `-cameroonian-`
- **12 destination-country**: `/scholarships/in-uk`, `-germany`, `-usa`, `-canada`, `-australia`, `-france`, `-netherlands`, `-japan`, `-sweden`, `-italy`, `-spain`, `-switzerland`
- **6 degree-level**: `/scholarships/masters`, `-phd`, `-undergraduate`, `-mba`, `-postdoc`, `-fully-funded`
- **12 field**: `/scholarships/engineering`, `-computer-science`, `-medicine`, `-business`, `-law`, `-arts-humanities`, `-natural-sciences`, `-social-sciences`, `-economics`, `-public-health`, `-education`, `-agriculture`

### 10 evergreen blog posts (live)
File: `/app/lib/blog-posts.js`

1. `chevening-scholarship-complete-guide`
2. `daad-scholarship-complete-guide`
3. `commonwealth-scholarship-guide`
4. `winning-scholarship-motivation-letter`
5. `fully-funded-phd-germany`
6. `ielts-vs-toefl-for-scholarships`
7. `seven-documents-every-scholarship-needs`
8. `common-scholarship-mistakes`
9. `best-scholarships-african-students`
10. `how-to-explain-study-gap`

### 10 more evergreen post ideas (drop-in ready, follow same pattern in blog-posts.js)

11. **"How to Write a Winning Research Proposal for a PhD Scholarship"** — target keyword: "phd research proposal template scholarship"
12. **"How to Get Strong Letters of Recommendation (Even If Your Professors Don't Know You Well)"** — "scholarship recommendation letter"
13. **"How to Fund a Master's Degree Without Loans: 5 Realistic Paths"** — "how to pay for masters degree"
14. **"Fully Funded vs Partial Scholarships: What's Realistic in 2026"** — "fully funded scholarships vs partial"
15. **"How to Reapply After a Scholarship Rejection: The 4-Step Recovery Plan"** — "scholarship reapplication"
16. **"Best Country to Study Abroad on a Budget"** — "cheap countries to study abroad"
17. **"Fulbright Scholarship: The Complete Country-by-Country Guide"** — "fulbright scholarship application" (link to fulbright scraper when added)
18. **"Erasmus Mundus Joint Master's: How the Two-Country Model Actually Works"** — "erasmus mundus"
19. **"Chevening Interview: 20 Questions and How to Answer Them"** — "chevening interview questions"
20. **"How to Apply to 15 Scholarships in a Month Without Burning Out"** — "scholarship application strategy"

To add: open `/app/lib/blog-posts.js`, copy an existing post as a template, edit content. Sitemap auto-updates. No rebuild needed for content-only changes (ISR revalidates daily).

## SEO plumbing summary

### Metadata
Each landing page + blog post uses Next.js `generateMetadata()`:
- Dynamic `<title>` (60 char sweet spot)
- Dynamic `<description>` (155 char)
- Canonical URL
- Open Graph tags
- Twitter card
- Robots meta (`index: true, follow: true`)

### Structured data (JSON-LD)
- **Scholarship pages** → `ItemList` of `EducationalOccupationalProgram` (Google rich results for course listings)
- **Blog posts** → `BlogPosting` (Google news / article carousels)

### Sitemap
- File: `/app/app/sitemap.js`
- URL: `https://scholarshipfit.com/sitemap.xml`
- **Auto-includes:** 19 static pages + 50 landing pages + all blog posts
- Currently: **79 URLs**

### robots.txt
- File: `/app/app/robots.js`
- Disallows: `/dashboard`, `/admin`, `/api/`, `/verify-email`, `/reset-password`, `/forgot-password`, `/my-cabinet`
- Blocks: **CCBot** (Common Crawl) fully; **GPTBot** allowed for `/blog/` only
- Points to sitemap.xml

### Internal linking
- Each landing page shows 8 related pages (same category)
- Each blog post shows 3 related posts by tag overlap
- Navbar surfaces `/scholarships` (hub) and `/blog`
- Blog CTA links to `/quiz`
- Landing-page CTA links to `/quiz` and `/sample-report`
- Blog body includes inline links to relevant landing pages

## Submitting to search engines (post-deploy)

1. **Google Search Console**
   - Add and verify `scholarshipfit.com`
   - Submit `https://scholarshipfit.com/sitemap.xml`
   - Request indexing on top 10 landing pages manually via URL Inspection tool

2. **Bing Webmaster Tools**
   - Same sitemap submission
   - Bing tends to index new pages faster than Google in early stages

3. **IndexNow** (Bing + Yandex + Naver)
   - Consider adding IndexNow ping on new blog post publish (~15 min build)

## Content velocity roadmap

To dominate scholarship SEO within 6-12 months:
- **Week 1-4:** Write 10 more evergreen posts from the list above
- **Month 2-3:** Add 20 country-specific deep-dive guides (e.g. "Complete Nigeria-to-UK Study Guide 2026")
- **Month 4-6:** Add 30 university-specific pages (e.g. "Oxford Financial Aid Guide", "Harvard Scholarships for International Students")
- **Month 7-12:** Programmatic content — auto-generate 200+ combo pages ("Chevening for Nigerian MBA applicants", "DAAD Engineering Programs")

Each phase compounds — internal linking gets denser, topic authority builds, rankings improve.
