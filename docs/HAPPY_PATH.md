# Bolantero MVP Happy Path

## 1. Bootstrap

1. `pnpm install`
2. `pnpm db:start` then `pnpm db:reset`
3. Copy keys into `.env` and app env files
4. `pnpm seed`

## 2. Identity

1. Customer opens app → submits ID + selfie
2. Rider/merchant onboarding creates Level 3/4 submissions
3. Admin → Verifications → Approve
4. UI shows **Bolantero Verified**

## 3. Order loop

1. Customer browses Phase 1 food merchants
2. Adds items → checkout shows merchant subtotal + delivery fee separately
3. `place_order` RPC creates order, items, delivery (`awaiting_rider`), payments
4. Merchant Orders page receives realtime update → Confirm → Preparing → Ready
5. Rider goes Online → Accept → Arrived → Picked up → Upload POD → Delivered
6. Customer Orders screen tracks delivery status and can rate rider

## 4. Ops checks

- Admin Live Deliveries shows status changes
- Admin Fees configures base/km/express/COD fees
- Merchant Sales and Admin Reports prove zero commission on product sales

## RLS smoke checks

- Customer cannot read another customer's addresses
- Merchant can update only own products/orders
- Rider can accept only `awaiting_rider` jobs
- Only admin can call `review_verification`
