# ScholarshipFit — Real Working Marketing Playbook

Last updated: June 2025 · MVP launch mode

## TL;DR — 3-week launch plan
| Week | Focus | Target |
|------|-------|--------|
| 1 | Reddit + Referral program + 3 discount codes live | 500 signups |
| 2 | ProductHunt + TikTok + University WhatsApp groups | 5,000 signups |
| 3 | YouTube collab + Twitter/X threads + Cold email | 10,000 signups / 100 paid |

Baseline conversion assumption: 2% signup → paid = **200 paid users at $89/yr = $17,800 MRR-equivalent**.

---

## 1. Everything already built in-app (READY TO USE)

### Referral program — `/dashboard/referrals`
- Every logged-in user gets a unique code `SFxxxxxx` and shareable link `https://scholarshipfit.com/?ref=SFxxxxxx`.
- Referred friends get **20% off** any plan (applied automatically via `?ref=` capture in localStorage).
- Referrer earns **30 days of Pro credit** per paid referral. 3 paid = 3 months free.
- One-click share: Twitter, WhatsApp, Email, native share sheet.
- Pre-written copy in Twitter, WhatsApp, Email formats — user just clicks Copy.
- Admin view: `/api/admin/referrals` (returns all rows sorted by paid referrals DESC).

### Discount codes — auto-seeded on first boot
| Code | Discount | Cap | Expires |
|------|----------|-----|---------|
| `LAUNCH50` | 50% off | 200 uses | 30 days |
| `STUDENT20` | 20% off | 500 uses | 365 days |
| `EARLYBIRD` | 30% off Lifetime | 100 uses | 90 days |

Validation is real-time (`/api/discounts/validate`) — the paywall & pricing page have a "Have a code?" input. Codes stack **on top** of regional PPP discount for max headline savings.

Auto-apply flow: any incoming URL with `?code=LAUNCH50` on `/pricing` pre-validates & applies the code before the user even clicks.

Admin can add more via `POST /api/admin/discounts` (header: `x-admin-key: <ADMIN_PASSWORD>`).

### Abandoned checkout email — `/api/cron/abandoned-checkout`
- PaywallModal fires `/api/paywall/track` when opened (records email + plan + match count).
- Cron scans events aged 1h–72h with no purchase and no email sent, then sends a branded Resend email with the `LAUNCH50` code (50% off, 48h expiry).
- Idempotent: `abandoned_email_sent` flag prevents spam. Dedup within 48h across all events for one email.
- **Wire this to your cron** (Vercel Cron / cron-job.org / BetterUptime):
  ```
  GET https://scholarshipfit.com/api/cron/abandoned-checkout
  Header: x-cron-key: <CRON_SECRET>
  Every: 30 minutes
  ```

### PostHog funnel tracking — already wired
Events fired: `signup_completed`, `quiz_started`, `quiz_step_completed`, `quiz_completed`, `paywall_view`, `checkout_initiated`, `advisor_message_sent`, `exit_intent_captured`, `scholarship_saved`, `signup_verified`, `otp_sent`, `otp_failed`.

**Build your funnel in PostHog:**
Insights → New funnel → `signup_completed` → `quiz_completed` → `paywall_view` → `checkout_initiated` → `paddle_subscription_created` (fires from webhook).

Watch for the biggest drop-off. If quiz→paywall is < 30%, kill 2 questions. If paywall→checkout is < 8%, discount your entry price temporarily.

---

## 2. LAUNCH CHANNELS — Copy-paste ready

### 🔴 Reddit (highest ROI for the first 500 users)

**Subs that convert (post at 9am ET on Tuesdays):**
- r/ApplyingToCollege (2.3M)
- r/scholarships (89K)
- r/EngineeringStudents (700K)
- r/GradSchool (350K)
- r/ExchangeStudents (30K)
- r/IntlToUSA (68K)
- r/PakistaniStudents, r/IndianStudentsAbroad, r/NigerianStudentsAbroad (smaller but 3-5% conversion)
- r/Fulbright, r/CheveningScholarship, r/Erasmus (targeted, engaged)
- r/EducationUSA

**Rules — don't get shadowbanned:**
- Never post a link in your first comment
- Use a 6+ month old account with karma > 100
- Ask a genuine question or share a learning, not a pitch
- Only drop the URL when someone asks

**Post template 1 — "I built this because I was drowning" (works everywhere):**
```
Title: I applied to 47 scholarships in my senior year and won 3. Here's the sorting method that saved my sanity.

Body:
Most scholarship sites list 10,000 awards you'll never qualify for. After
three months of eligibility-checking hell, I sat down and built a matcher
that only shows scholarships I can actually win.

The rules I coded in:
- Filter by nationality + country of study + GPA + field of study
- Show deadline urgency (< 30 days = red)
- Skip any award with no verified source URL
- Skip "essay contest" scam pages

Now I'm sharing it with anyone who wants — you get 20% off if you sign
up with my link (below in comments). No paywall on the matcher itself,
paywall is only on the AI advisor + application tracker.

Questions welcome — I'll DM the essay template that got me the Global
Scholars award to anyone who reports back with a win.
```
Comment 1 minute later: "Link's here for anyone interested: https://scholarshipfit.com/?ref=SFxxxxxx (20% off with my link). Honest question — what's your biggest scholarship pain point?"

**Post template 2 — "list post" (works in r/scholarships):**
```
Title: 20 scholarships for [nationality] students closing in June 2025 — verified source URLs inside

Body:
Pulled from my scholarship tracker. All source-linked (no aggregator
spam), deadlines < 60 days:

1. [Name] — [$Amount] — deadline [Date] — [official URL]
2. ...

Full list of 800 (filtered to your profile in 60 seconds):
https://scholarshipfit.com/?ref=SFxxxxxx (20% off with my code)
```

### 🟠 Twitter/X thread — 10-tweet pattern

```
1/ Applied to 47 scholarships as an international student. Won 3.
Total: $54,000. Here's every trick I used — and the AI tool I now
sell that automates all of them:

2/ Trick #1 — Skip aggregators.
Fastweb, Scholarships.com — 80% of listings are dead links or
sponsored garbage. Only apply to awards with an official .edu/.org
source URL. I hard-coded this filter into ScholarshipFit.

3/ Trick #2 — Nationality is the #1 filter.
Most scholarships have a citizenship requirement buried in paragraph 3.
Sort your list by "eligible-for-my-passport" first, then by deadline.

4/ Trick #3 — Read the "past winners" page.
Every serious scholarship publishes essay excerpts. Reverse-engineer
the theme (usually: leadership + adversity + concrete metric).

... [continue with 6 more tips] ...

10/ TL;DR — 800 scholarships filtered to your exact profile in 60s:
https://scholarshipfit.com/?ref=SFxxxxxx

DM me "essay" for the SOP template that got me the Global Scholars
award. Reply with your target countries — I'll shortlist 3.
```

Post at 10am ET Tuesday, Wednesday, or Thursday. Not Friday or weekends.

### 🟡 TikTok / Instagram Reels — 15s hook pattern

**Video 1 — "duet with fastweb search":**
Screen-record: search "engineering scholarship for pakistani students" on Fastweb → 30 spam ads. Cut to ScholarshipFit → 12 matches with source URLs.
Caption: "POV: you actually want scholarships not ads 🎓 → link in bio, 20% off with code STUDENT20"

**Video 2 — "$247,000 in scholarships nobody applied for":**
Text-on-screen: "These 5 scholarships had < 20 applicants last year." Show 5 real ones from your DB with $ amounts.
End screen: "Full list → link in bio → LAUNCH50 for 50% off"

**Video 3 — "essay generator demo":**
Screen record: fill quiz → click Generate SOP → real-time streaming text → shows the finished 700-word SOP.
Voiceover: "This is Claude 3.5 writing a personal statement in real-time based on your profile. Try it free."

Aim for **1 post per day for 21 days** — 21 posts is the TikTok discovery threshold.

### 🟢 ProductHunt launch — Day 22

**Prep (do 7 days before launch):**
- Register the ScholarshipFit product page (choose Education category)
- Line up 15 "hunters" — students, mentors, teachers you know — to upvote in the first 4h
- Prep 5 comments from real users (from your `/testimonials` collection) they can post
- Ship gallery: 6 screenshots + 30s demo video

**Launch day timing:** Post at 12:01am PT (Pacific). Reply to every comment within 5 min for the first 3h.

**Tagline options:**
- "AI scholarship matcher for international students — 800 verified awards, matched in 60s"
- "Notion for scholarships — track, match, apply from one dashboard"

**First comment (as maker):**
```
Hey PH! I built ScholarshipFit after applying to 47 scholarships as an
international student and losing 3 months to spam listings. It matches you
against 800 hand-verified scholarships (every source URL is live — no
aggregator garbage), writes SOP drafts with Claude 3.5, and tracks
applications like a Kanban board.

Free forever tier. Paid ($89/yr) unlocks unlimited matches + AI advisor.

PH exclusive: use code PRODUCTHUNT50 for 50% off (48h only).

Ask me anything — I'll respond to every comment today.
```

**PostHog goal:** 1,500 clicks from PH → 300 signups → 15 paid.

### 🔵 YouTube — 3 videos, 3 formats

**Video 1 (10 min, LONG) — "How I won $54,000 in scholarships as an international student":**
- Story arc: hook (won 3 scholarships) → problem (spam sites) → 5 tactics → tool reveal at 7:00.
- Link in description with `?ref=` code.
- Sponsor: DIY (feature ScholarshipFit as "the tool I built").

**Video 2 (30s, SHORTS) — "Type ONE query, get ONE scholarship you can actually win":**
Screen record end-to-end quiz completion. Zero voiceover. Text-on-screen only.

**Video 3 — collab with an existing YouTuber:**
Reach out to 5 YouTube channels with 5K–50K subs (small = affordable, engaged):
- "College Match" (US-focused)
- "Studies On Demand" (SA-focused)
- "Wemi Adisa" (African student focus)
Offer: **$500 flat + 30% of any conversion revenue for 90 days** (tracked via `?ref=YT-CHANNEL` codes you create).

### 🟣 Cold email — universities & counselors

**Target:** International student office contact emails at 200 mid-tier US colleges.
**Where to source:** naces.org, iiuservices.org, individual `.edu/international-students` pages.

**Template (send from `founder@scholarshipfit.com`):**
```
Subject: Free scholarship tool for your 2025 intake

Hi [Name],

I'm the founder of ScholarshipFit — a scholarship matcher used by
2,000+ international students to find funding they qualify for.

Would it help your admissions team to share a free tool with incoming
students? No cost, no data grab — we just ask that we mention your
institution to our verified users searching for [State/Region]
scholarships.

If yes, I'll send you a co-branded landing page in 24h with a
"[University Name] students save 20%" code.

Reply YES and I'll set it up today.

— [Your name], founder
scholarshipfit.com
```

Follow-up 3 business days later: "Just checking — happy to send a 30-sec Loom demo if helpful."

Expect 3–5% reply rate. Every "yes" = 20–200 new users.

### 🟤 WhatsApp / Telegram — the underground channel

International students live in WhatsApp groups. Every top university has 2-5 unofficial applicant groups. Find them via:
- @IITalumni_official Telegram
- r/PakistaniAcademia Discord → server list
- Facebook groups: "Fulbright 2025 applicants", "Chevening 2025 hopefuls"

**Message template (post as an existing member, not admin):**
```
Not sure if this has been shared here — I was drowning in scholarship
listings and a friend showed me this AI matcher last week. It filtered
my 800+ options down to 27 I actually qualify for in 60 seconds.

Free to try + they auto-apply 20% off if you sign up here:
scholarshipfit.com/?ref=[YOUR_CODE]

Sharing so nobody else wastes 3 weeks like I did.
```

⚠️ Do not spam — one message per group. Wait 3 weeks before posting again if you must.

---

## 3. RETENTION / RENEWAL LEVERS

### Trial-ending email (Day 5 of 7-day trial)
Once Paddle is live, wire a webhook listener for `subscription.trialing` events → schedule Resend email at trial+5d:
```
Subject: 2 days left — 8 scholarships closing this week
Body: Reminder that your trial ends Wednesday. You still have $[X] in
matched scholarships expiring. Keep going for $[plan_price] or cancel
in 2 clicks from your dashboard.
```

### Renewal reminder (7 days before annual renewal)
```
Subject: Your ScholarshipFit renewal + a thank-you gift
Body: You've been with us for 358 days. Thanks 🙏 Here's a personal
$20 credit code for a friend: FRIEND20-[USER_ID_SHORT]. Renewal date:
[date]. Nothing else to do — just wanted to say thanks.
```

### Win-back (30 days after cancel)
```
Subject: Come back? 3 new scholarships match your profile.
Body: We added 47 new awards since you left. 3 of them match your
exact criteria: [list them]. Come back with LAUNCH50 for 50% off
your first month.
```

### Streak / gamification
Award badges in `/dashboard`: "First application submitted", "5 applications tracked", "10 scholarships saved". Every badge = share prompt = potential viral loop.

---

## 4. PAID GROWTH — only when organic is proven

**Don't spend > $500/mo on ads until you have a 2%+ organic conversion rate.**

Once you do, the two channels that work for edtech:
1. **Reddit Ads** — target r/college, r/ApplyingToCollege. Bid $0.30 CPC. Landing page: `/quiz` (bypass homepage).
2. **Meta (Instagram) — Advantage+ Shopping campaigns** — target 17–22 y/o interested in "study abroad". Creative: 15s TikTok-style video.

Skip Google Ads for the first 90 days — it's expensive and low-intent for a discovery-phase product.

---

## 5. DAILY RITUAL — 30 min/day marketing routine

Every morning at 9am:
1. Post 1 Reddit reply (not a top-level post — reply to an existing thread with your `?ref=` link)
2. Post 1 TikTok short (batch-shoot 7 on Sunday)
3. Reply to 3 tweets from a target influencer (education Twitter)
4. Check PostHog funnel — note yesterday's dropoff step
5. Send 5 cold emails to counselors

Every Friday:
1. Ship 1 SEO blog post (target long-tail: "best scholarships for [nationality] students in [year]")
2. Send weekly digest to email list (5 new scholarships + 1 tip)
3. Post 1 Twitter/X thread

**In 30 days this rhythm compounds to ~500 daily visitors from organic + word-of-mouth.**

---

## 6. NUMBERS TO WATCH

Track weekly in a Notion doc:
- Signups (goal: 100/wk by week 3)
- Signup → quiz completion % (goal: > 60%)
- Quiz completion → paywall view % (goal: > 80%)
- Paywall view → checkout initiated % (goal: > 15%)
- Checkout initiated → paid % (goal: > 40% once live)
- Referral clicks → signups (goal: > 25%)
- Cost per acquired user via ads (goal: < $8 for month 1, < $4 by month 3)

If any of these fall > 30% below target → drop that channel, double down on what's working.

---

## 7. LEGAL / COMPLIANCE — don't skip

- ✅ AI disclosure page is live at `/how-our-ai-works` (needed for Paddle approval)
- ✅ Turnstile bot protection on `/signup`
- ✅ Every marketing email has an unsubscribe link (built-in via Resend)
- ⚠️ CAN-SPAM: cold emails must include a physical address in footer
- ⚠️ GDPR: PostHog is EU-compliant when configured with `api_host=https://eu.posthog.com`

---

## 8. What to say when someone asks "does it actually work?"

Point them to:
1. `/how-our-ai-works` — full transparency page
2. `/methodology` — deterministic filtering explanation
3. `/testimonials` — 6 verified user stories
4. `/pricing` — 7-day free trial + refund policy

Never claim: "guaranteed win", "AI predicts admission", "100% match rate".
Always claim: "matched from a verified database of 800 scholarships based on your explicit criteria".

The difference is what saved us from a second Paddle rejection.
