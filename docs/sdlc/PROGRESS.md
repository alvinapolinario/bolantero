# Implementation progress

Living log. Newest entry first. Tie work to requirement IDs.

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
