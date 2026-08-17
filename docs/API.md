# Bolantero API

**Status:** Local API running (2026-08-17). Auth health 200 at `http://127.0.0.1:54321`. `pnpm api:smoke` passed TC-08…TC-11.  
**Style:** Supabase BaaS — Auth + PostgREST + security-definer RPCs + Realtime + Storage  
**There is no custom Node/Express API.** Clients call this stack directly (ADR-007).

Refs: FR-TRIP-*, FR-FEE-*, FR-KYC-*, NFR-SEC-01, NFR-REL-01

## 1. Base URL (local)

| Service | URL |
|---------|-----|
| API (Auth, REST, RPC) | `http://127.0.0.1:54321` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | `http://127.0.0.1:54323` |

Headers for user calls: `apikey: <anon>` and `Authorization: Bearer <user jwt>`.  
Service role is for `pnpm seed` and CI only — never in mobile or browser apps.

## 2. Auth

| Method | Use |
|--------|-----|
| `POST /auth/v1/token?grant_type=password` | Demo email login (FR-AUTH-01) |
| `POST /auth/v1/otp` | Phone OTP when SMS is configured (FR-AUTH-02) |

A trigger `handle_new_user` inserts `profiles` (role from `user_metadata.role`, default `customer`, verification_level 1).

| Gate | Rule |
|------|------|
| Book food or trip | `role = customer` and `verification_level >= 2` |
| Accept food or trip | `role = rider` and `verification_level >= 4` |
| Review KYC / fee writes | `role = admin` |

## 3. Money RPCs (authoritative)

Clients must not insert `orders`, `trips`, or payment rows. RLS denies those inserts. Fees are recomputed in Postgres; the client cannot submit its own fare.

### Food

| RPC | Who | Does |
|-----|-----|------|
| `place_order` | Customer L2+ | Writes `orders` + items + `deliveries` + `payments`. Merchant keeps 100% of `subtotal`. |
| `accept_delivery` | Rider L4 | Claims `awaiting_rider` delivery. |

### Ride / Padala

| RPC | Who | Does |
|-----|-----|------|
| `quote_trip` | Authenticated | Returns JSON fare; validates pickup/dropoff in launch areas. |
| `request_trip` | Customer L2+ | Recomputes quote, writes `trips` + `trip_payments` (`platform` / `rider` only). Padala requires item + recipient. |
| `accept_trip` | Rider L4 | Exclusive claim of `requested`. |
| `advance_trip` | Assigned rider | `accepted → arrived_pickup → in_progress → completed`. |
| `cancel_trip` | Customer if `requested`; rider if in progress; admin | Sets `cancelled`. |

### Admin

| RPC | Who | Does |
|-----|-----|------|
| `review_verification` | Admin | Approve/reject KYC; may raise `verification_level`. |

`quote_trip` response shape:

```json
{
  "distanceKm": 0.4,
  "baseFee": 40,
  "distanceFee": 0,
  "sizeSurcharge": 0,
  "fare": 40,
  "platformFee": 8,
  "riderEarning": 32
}
```

Invariant: `fare = platformFee + riderEarning` (FR-FEE-05). No merchant payee on trips (FR-FEE-04).

## 4. Read models (PostgREST)

Typical table reads (RLS still applies):

- Customer: `trips`, `orders`, `addresses`, `merchants` (approved), `products`
- Rider: `trips` where `requested` or own, `deliveries` where `awaiting_rider` or own, `rider_presence`
- Merchant: own `merchants`, `products`, `orders`
- Admin: all of the above plus `verification_submissions`, `delivery_fee_rules`, `trip_fare_rules`, `payments`, `trip_payments`

Realtime publication includes `orders`, `deliveries`, `trips`.

## 5. Storage (private)

| Bucket | Who writes | Path |
|--------|------------|------|
| `ids`, `selfies` | Owner | `{user_id}/...` |
| `merchant-docs` | Merchant | `{user_id}/...` |
| `delivery-proofs` | Rider | `{user_id}/...` |
| `parcel-photos` | Customer | `{user_id}/...` |

## 6. Bring-up

```bash
pnpm install
pnpm db:start
pnpm db:reset
# keys: copy from `supabase start` output into gitignored `.env`
pnpm seed
pnpm api:smoke
```

Demo password: `password123`  
`admin@` / `customer@` / `merchant@` / `rider@bolantero.local`

## 7. Error strings (clients should surface these)

- `verification level 2 required to place orders`
- `verification level 2 required to request trips`
- `verified rider required`
- `padala requires an item description`
- `padala requires recipient name and phone`
- `pickup is outside the selected service area`
- `dropoff is outside launch areas`
- `trip unavailable` / `illegal trip transition`
- `customer can cancel only while requested`

## 8. Out of scope for this API

Custom REST gateway, PSP charge APIs, auto-dispatch, Maps SDK, third-party KYC vendor.
