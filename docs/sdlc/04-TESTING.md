# Test Strategy & Plan — Bolantero MVP

## 1. Test levels

| Level | Owner | Tooling | Focus |
|-------|-------|---------|-------|
| Unit | Engineering | Vitest (`packages/shared`) | Fee math, role gates, pure helpers |
| Integration | Engineering | Supabase local + `pnpm api:smoke` | RPC money split, KYC gates, RLS smoke |
| System / E2E | QA + Engineering | Manual checklist → later Maestro/Playwright | Happy path across 4 apps |
| UAT | Product/stakeholders | Staging demo | Business acceptance |

## 2. Priority test areas

1. **Money invariant** — food subtotal untouched; platform = delivery + COD fees; trip fare = platform fee + rider earning; no merchant payee on trips
2. **Verification gating** — Level 2+ for orders and trips; Level 4 for accept delivery/trip
3. **Order and trip state machines** — merchant transitions + rider food/trip transitions
4. **RLS** — users cannot read/write others’ private data
5. **Fee rules** — food base/distance/express/scheduled/COD; trip base/distance/size + platform bps

## 3. MVP test cases (system)

| ID | Steps | Expected | Maps to |
|----|-------|----------|---------|
| TC-01 | Seed + admin login | Dashboard loads | FR-ADMIN-01 |
| TC-02 | Customer Level 2 places COD order | Order + delivery + payments created | FR-CUST-02, FR-FEE-* |
| TC-03 | Merchant confirm → ready | Status updates realtime | FR-MERCH-03/04 |
| TC-04 | Rider online → accept → deliver + POD | Delivery completed; earning recorded | FR-RIDE-* |
| TC-05 | Customer rates rider | Rating stored | FR-CUST-05 |
| TC-06 | Admin reports | Merchant product ≠ platform fees | FR-ADMIN-05, FR-FEE-02 |
| TC-07 | Unverified customer checkout | Rejected by `place_order` | FR-KYC-06 |
| TC-08 | Unverified customer trip request | Rejected by `request_trip` | FR-TRIP-03 |
| TC-09 | Quote then Ride request | Trip + trip_payments; no merchant | FR-TRIP-02/03, FR-FEE-04/05 |
| TC-10 | Padala without recipient/item | Rejected by `request_trip` | FR-TRIP-04 |
| TC-11 | Rider completes Ride; food still placeable | Earning recorded; `place_order` still works | FR-RIDE-06/07 |
| TC-12 | Admin reports | Merchant product ≠ food fees ≠ trip platform fee | FR-ADMIN-05/06, FR-FEE-04 |
| TC-13 | Admin at 375 / 768 / 1280 widths | Nav, tables, fee forms usable without horizontal page scroll | NFR-USAB-01 |
| TC-14 | New user: notice without age/privacy/terms stays blocked; marketing stays optional; one of Apple/Google/OTP | Continue disabled until required consents; social is not KYC | FR-AUTH-04/05, NFR-PRIV-02 |
| TC-15 | Customer home: Where to? + Ride/Padala/Food; quote then book | Map sheet + tabs; fare still `quote_trip` / `request_trip` | NFR-USAB-01, FR-TRIP-01 |

Full operator script: [../HAPPY_PATH.md](../HAPPY_PATH.md)

## 4. Defect severity

| Severity | Example | SLA (target) |
|----------|---------|----------------|
| S1 Blocker | Money split wrong; auth broken | Immediate |
| S2 Critical | Cannot complete delivery loop | Same day |
| S3 Major | UI broken but workaround exists | Next sprint |
| S4 Minor | Copy/style | Backlog |

## 5. Exit criteria for release

- All Must-priority FRs have at least one mapped test
- Unit tests for fee engine passing in CI
- Happy-path TC-01…TC-12 executed and recorded
- No open S1/S2 defects
