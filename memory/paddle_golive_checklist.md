# Paddle Billing Go-Live Checklist

Follow these steps in order to flip payments from preorder → live once your Paddle vendor account is approved.

## 1. Create Products & Prices in Paddle vendor dashboard
vendors.paddle.com → **Catalog** → **Products** → New product ("ScholarshipFit Access")

Then under that product, create **4 Prices**:

| Price name    | Type          | Amount | Billing cycle    | Trial |
|---------------|---------------|--------|------------------|-------|
| Monthly       | Recurring     | $14.99 | Every 1 month    | 7 days |
| Quarterly     | Recurring     | $29.00 | Every 3 months   | 7 days |
| Half-Yearly   | Recurring     | $49.00 | Every 6 months   | 7 days |
| Lifetime VIP  | One-time      | $79.00 | —                | — |

For subscription Prices, enable **Trial period → 7 days**.

Grab each Price ID — they look like `pri_01hxyz...` — after saving.

## 2. Get your API credentials
vendors.paddle.com → **Developer Tools**:

- **Authentication → API keys** → Create new server-side key → save as `PADDLE_API_KEY`
- **Authentication → Client-side tokens** → Create → save as `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- **Notifications** → Add a destination:
  - URL: `https://scholarshipfit.com/api/webhooks/paddle`
  - Events: **check all** subscription.* + transaction.completed + transaction.paid + transaction.payment_failed
  - Save the **Secret key** shown → save as `PADDLE_NOTIFICATION_SECRET`

## 3. Fill in `/app/.env`
```env
NEXT_PUBLIC_PAYMENT_MODE=live
PAYMENT_MODE=live
PAYMENT_PROCESSOR=paddle

PADDLE_ENV=production            # or 'sandbox' while testing
NEXT_PUBLIC_PADDLE_ENV=production
PADDLE_API_KEY=apikey_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
PADDLE_NOTIFICATION_SECRET=pdl_ntfset_...
PADDLE_PRICE_MONTHLY=pri_01...
PADDLE_PRICE_QUARTERLY=pri_01...
PADDLE_PRICE_HALF_YEARLY=pri_01...
PADDLE_PRICE_LIFETIME=pri_01...
```
Then redeploy (or `sudo supervisorctl restart nextjs` locally).

## 4. Verify
- Log in → `/pricing` → CTAs should now say "Start 7-day free trial" / "Claim lifetime access" (no more "Reserve founder pricing")
- Click a plan → redirects to `pay.paddle.io/hsc_...` or your custom checkout URL
- Use Paddle sandbox test card `4242 4242 4242 4242` (only when `PADDLE_ENV=sandbox`)
- After checkout → back to `/dashboard?activated=1`
- `/dashboard/billing` shows active subscription
- `subscription_events` MongoDB collection has a row for the Paddle webhook

## 5. Webhook health check
Visit `https://scholarshipfit.com/api/webhooks/paddle` in a browser. You should see:
```json
{ "ok": true, "service": "ScholarshipFit Paddle Billing webhook", "configured": true, "env": "production" }
```
`configured: true` confirms `PADDLE_NOTIFICATION_SECRET` is set. If false, re-check your env vars & redeploy.

## 6. Founder Preorder Migration (one-time)
After go-live, email everyone in `preorders` (status: `reserved`) a personalized checkout URL. The Paddle webhook will automatically flip:
- `preorders.status` → `migrated`
- `users.entitlement` → `founder`

## 7. Rollback
If anything breaks: set `NEXT_PUBLIC_PAYMENT_MODE=preorder` in `.env` and redeploy. Site reverts to FounderReservationModal — zero data loss.

## Endpoints Cheat Sheet

| Endpoint                            | Purpose                                                  |
|-------------------------------------|----------------------------------------------------------|
| `POST /api/checkout/create-session` | Auth-gated; POSTs to Paddle `/transactions` and returns `checkout.url` |
| `POST /api/webhooks/paddle`         | Paddle webhook receiver (HMAC-verified)                  |
| `GET  /api/webhooks/paddle`         | Health check                                             |
| `POST /api/preorder`                | Preorder capture (used while `PAYMENT_MODE=preorder`)    |
| `GET  /api/subscription/status`     | Current user's subscription state                        |
| `/dashboard/billing`                | User-facing subscription management + Paddle portal link |

## Switching processors later
The code supports both Paddle and LemonSqueezy simultaneously. To switch:
```env
PAYMENT_PROCESSOR=lemonsqueezy   # or 'paddle'
```
Both webhook endpoints coexist at `/api/webhooks/paddle` and `/api/webhooks/lemonsqueezy`.
