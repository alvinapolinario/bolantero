# Bolantero MVP Happy Path

## 1. Bootstrap

1. `pnpm install`
2. `pnpm db:start` then `pnpm db:reset`
3. Copy keys into `.env` and app env files
4. `pnpm seed`
5. `pnpm api:smoke` (TC-08…TC-11 against live RPCs)

## 2. Identity

1. Customer opens app → submits ID + selfie
2. Rider/merchant onboarding creates Level 3/4 submissions
3. Admin → Verifications → Approve
4. UI shows **Bolantero Verified**

## 3. Order loop (food)

1. Customer opens Food from the service home
2. Adds items → checkout shows merchant subtotal + delivery fee separately
3. `place_order` RPC creates order, items, delivery (`awaiting_rider`), payments
4. Merchant Orders page receives realtime update → Confirm → Preparing → Ready
5. Rider goes Online → Accept → Arrived → Picked up → Upload POD → Delivered
6. Customer Orders screen tracks delivery status and can rate rider

## 4. Ride / Padala loop

1. Customer home shows Ride | Padala | Food
2. Ride: pick launch area + pickup/dropoff landmarks → `quote_trip` → confirm (`request_trip`)
3. Padala: same plus item description, size, recipient name/phone
4. Unverified (level 1) request is rejected (TC-08)
5. Padala without recipient/item is rejected (TC-10)
6. Rider inbox shows the trip → Accept → Arrived pickup → In progress → Completed
7. Customer can cancel while `requested`; Activity/Track updates realtime
8. Food `place_order` still works after a completed ride (TC-11)

## 5. Ops checks

- Admin Live Deliveries shows food status changes
- Admin Live Trips shows Ride/Padala status changes
- Admin Fees configures food rules and ride vs padala fare rules
- Merchant Sales and Admin Reports prove zero commission on product sales
- Admin Reports show three columns: merchant product ≠ food fees ≠ trip platform fee

## RLS smoke checks

- Customer cannot read another customer's addresses
- Merchant can update only own products/orders
- Rider can accept only `awaiting_rider` jobs and `requested` trips
- Customer cannot read another customer's trips
- Rider cannot set trip fare or insert `trip_payments` directly
- Only admin can call `review_verification`
