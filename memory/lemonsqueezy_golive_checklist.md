# LemonSqueezy Go-Live Checklist

When your LS account is approved, flip these switches (in this order) to move from **preorder** mode → **live payments**.

## 1. Create Products & Variants in LemonSqueezy

Store → Products → New product (or single product with 4 variants):

| Variant name  | Price   | Billing        | Free trial | Notes                          |
|---------------|---------|----------------|------------|--------------------------------|
| Monthly       | $14.99  | Monthly        | 7 days     | Subscription                   |
| Quarterly     | $29.00  | Every 3 months | 7 days     | Subscription                   |
| Half-Yearly   | $49.00  | Every 6 months | 7 days     | Subscription                   |
| Lifetime VIP  | $79.00  | One-time       | —          | Single payment (not sub)       |

For each **subscription variant**: scroll to Pricing → toggle **"Has free trial?"** ON → 7 days.

## 2. Grab the IDs / Secrets

- **API key** → Settings → API → Create new API key
- **Store ID** → Settings → Stores (the numeric ID)
- **Variant IDs** → click each variant, ID is in the URL: `.../variants/12345`
- **Webhook secret** → Settings → Webhooks → Create webhook
  - URL: `https://scholarshipfit.com/api/webhooks/lemonsqueezy`
  - Signing secret: generate a random 32-char string (save it)
  - Events: **check all** subscription_* + order_created + subscription_payment_success + subscription_payment_failed

## 3. Fill in `/app/.env`

```
NEXT_PUBLIC_PAYMENT_MODE=live
PAYMENT_MODE=live
LEMONSQUEEZY_API_KEY=lsq_...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=your-random-string
LS_VARIANT_MONTHLY=11111
LS_VARIANT_QUARTERLY=22222
LS_VARIANT_HALF_YEARLY=33333
LS_VARIANT_LIFETIME=44444
```

Then: `sudo supervisorctl restart nextjs`

## 4. Verify

- Log in → `/pricing` → CTAs should now say "Start 7-day free trial" / "Claim lifetime access" (no longer "Reserve founder pricing")
- Click a plan → redirects to `checkout.lemonsqueezy.com/...`
- Use LS test card `4242 4242 4242 4242` (Test Mode ON in LS dashboard)
- After checkout → back to `/dashboard?activated=1`
- `/dashboard/billing` should show your active subscription with the correct status
- MongoDB `subscription_events` collection should have a row for the LS webhook

## 5. Founder Preorder Migration (One-time)

After LS is live, run this against your `preorders` collection to email everyone:

```js
db.preorders.find({ status: 'reserved' }).toArray()
```

Send each user a personalised checkout URL (use `/api/checkout/create-session` with their user_id).
The webhook will automatically flip `preorders.status` → `migrated` and `users.entitlement` → `founder`.

## 6. Rollback

If anything breaks: set `NEXT_PUBLIC_PAYMENT_MODE=preorder` in `/app/.env` and restart. The site instantly reverts to the FounderReservationModal flow — no data loss.

## Endpoints Cheat Sheet

| Endpoint                             | Purpose                                   |
|--------------------------------------|-------------------------------------------|
| `POST /api/checkout/create-session`  | Creates LS checkout URL for signed-in user (auth-gated) |
| `POST /api/webhooks/lemonsqueezy`    | LS webhook receiver (HMAC-verified)       |
| `GET  /api/webhooks/lemonsqueezy`    | Health check — shows `configured: true/false` |
| `POST /api/preorder`                 | Preorder capture (used while PAYMENT_MODE=preorder) |
| `GET  /api/subscription/status`      | Current user's subscription state         |
| `POST /api/subscription/cancel`      | Cancel current subscription               |
| `/dashboard/billing`                 | User-facing subscription management page  |
