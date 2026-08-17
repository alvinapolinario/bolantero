# Implementation progress

Living log. Newest entry first. Tie work to requirement IDs.

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
