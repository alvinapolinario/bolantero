# Implementation progress

Living log. Newest entry first. Tie work to requirement IDs.

## 2026-08-18 — Customer mobility UI

**Goal:** Customer app map-first home like PH super-apps (NFR-USAB-01, FR-TRIP-01). No money-model change. Landmarks still used instead of a Google Maps SDK.

| Item | Status |
|------|--------|
| Home | Map canvas + Where to? + Ride / Padala / Food |
| Book / Track | Bottom sheet, A/B pins, sticky fare |
| Tabs | Home · Activity · Account |
| Food | Search, category chips, merchant cards |

Open: `pnpm --filter customer dev` (8081) · `customer@bolantero.local` / `password123`.

**Next:** Rider inbox (accept/advance trips).

## 2026-08-18 — DPA progressive registration

**Goal:** Register after unbundled privacy notice, then one of Apple / Google / PH OTP (FR-AUTH-04/05, NFR-PRIV-02). No money-model change. Social login is not KYC.

| Item | Status |
|------|--------|
| Notice step | Age 18+, Privacy Notice, Terms required; marketing optional |
| Method step | Apple, Google, PH mobile; email demo fallback |
| Consent columns | `profiles` privacy/terms/age/marketing/phone_verified_at |
| Unit | TC-14 helpers in `packages/shared` |

Open: rider http://localhost:8082 → Create an account. Demo sign-in still `rider@bolantero.local` / `password123`. Apply migration (`pnpm db:reset` or equivalent) for new profile columns.

**Next:** Connect Google/Apple in Supabase Auth for production; rider inbox.

## 2026-08-18 — Rider login screen

**Goal:** Design the Expo rider login (FR-AUTH-01/02, NFR-USAB-01). No money-model change.

| Item | Status |
|------|--------|
| Hero + partner copy | Food / Ride / Padala chips · motorcycle · SK cities |
| Email / Phone OTP | Segmented tabs, 44px inputs, show/hide password |
| Keyboard | Avoiding view + scroll on small phones |
| Local keys | `apps/rider/.env` gitignored; client ignores `app.json` placeholder |
| Web blank screen | Installed `react-dom` + `react-native-web` so Metro can bundle login |

Open: `pnpm --filter rider dev` (port 8082) · `rider@bolantero.local` / `password123`.

**Next:** Rider inbox (accept/advance trips).

## 2026-08-18 — Customer Expo against local API

**Goal:** Run `apps/customer` (Expo, iOS + Android) against local Supabase and prove Ride/Padala booking (FR-TRIP-01…05). No Flutter rewrite (ADR-004).

| Item | Status |
|------|--------|
| Local keys | `apps/customer/.env` (gitignored). Client ignores `app.json` placeholder |
| Session storage | SecureStore on native; `localStorage` on web |
| `pnpm --filter customer dev` | **Up** — Metro http://localhost:8081 (env loaded) |
| Login `customer@bolantero.local` | OK — verification_level 2 |
| Ride `quote_trip` | fare ₱40 = platform ₱8 + rider ₱32 |
| Ride `request_trip` | `TRP-260817-0F269B` requested; payees `platform,rider` |
| Padala without item | Rejected (`padala requires an item description`) |
| Padala with item + recipient | `TRP-260817-AC3218` requested; no merchant payee |
| Cancel while requested | Ride → `cancelled` |
| Unverified book | Rejected (`verification level 2 required`) |
| Food catalog | 3 approved merchants still readable |

Open: scan the Expo QR or http://localhost:8081 · login `customer@bolantero.local` / `password123`.

**Next:** Rider inbox (accept/advance trips), then polish customer UI if needed.

## 2026-08-18 — AdminLTE 4 font and colors

**Goal:** Match the AdminLTE 4 screenshot: Source Sans 3, `#007bff` / `#28a745` / `#ffc107` / `#dc3545`, `#343a40` sidebar, `#f4f6f9` canvas. Dropped Bolantero cream tokens from admin.

## 2026-08-18 — AdminLTE polish

**Goal:** Match AdminLTE chrome (NFR-USAB-01): Source Sans, white navbar, small-boxes, card headers. No money/ops change.

## 2026-08-18 — Admin sidebar console

**Goal:** Replace the pill-nav layout with a current admin-dashboard pattern (NFR-USAB-01). No money/ops change.

| Item | Status |
|------|--------|
| Dark grouped sidebar | Desktop ≥960px persistent |
| Mobile drawer + backdrop | <960px hamburger |
| Sticky topbar + KPI cards | Overview + reports |
| Split login | Brand panel + form |
| Stacked tables / fee grids | Kept from prior polish |

**Next:** Customer app (book Ride/Padala), then Rider inbox.

## 2026-08-17 — Admin web against local API

**Goal:** Run `apps/admin` on port 3001 and confirm trip ops pages talk to live Supabase.

| Item | Status |
|------|--------|
| `pnpm --filter admin dev` | **Up** — http://localhost:3001 |
| Login `admin@bolantero.local` | OK |
| `/trips` `/fees` `/reports` `/dashboard` | HTTP 200 |
| Admin `trips` query | 3 rows (2 completed rides + 1 requested padala) |
| Trip fare rules | Ride + Padala active |
| Reports | trip platform ₱25.80; merchant product ₱0 (no food payments in this DB yet) |
| Live trips (non-terminal) | 1 (`TRP-DEMO-PAD1` requested) |

Open: http://localhost:3001/login then Live Trips, Fee Rules, Reports.

**Next:** Customer app (book Ride/Padala), then Rider inbox.

## 2026-08-17 — API slice (local Supabase)

**Goal:** Run Bolantero’s API as local Supabase (Auth + PostgREST + RPCs). No custom Node server (ADR-007).

| Item | Status |
|------|--------|
| Food RPCs (`place_order`, `accept_delivery`, `review_verification`) | Live on local API |
| Trip RPCs (`quote_trip`, `request_trip`, `accept_trip`, `advance_trip`, `cancel_trip`) | Live on local API |
| RLS + Realtime on `trips` | Applied |
| `service_role` table grants (seed/server) | `20260817000001_service_role_grants.sql` |
| Analytics containers | Disabled locally so start can finish |
| Contract | [`docs/API.md`](../API.md) |
| `pnpm db:start` | **Up** — `http://127.0.0.1:54321` Auth health 200 |
| `pnpm db:reset` + `pnpm seed` | **Done** — demo users + merchants + demo trips |
| `pnpm api:smoke` | **Passed** TC-08, TC-09, TC-10, TC-11 |

Smoke evidence (2026-08-17):

- TC-09 `quote_trip` fare 40; `request_trip` payees `platform,rider` (no merchant)
- TC-10 padala without item rejected
- TC-08 unverified customer rejected (`verification level 2 required`)
- TC-11 ride completed (earning 32); `place_order` still works

**Next:** Admin web (fee rules, live trips, reports), then Customer + Rider apps against this API.

**Not in this slice:** custom HTTP gateway, PSP, auto-dispatch.
