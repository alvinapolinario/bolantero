# Test Strategy & Plan — Bolantero MVP

## 1. Test levels

| Level | Owner | Tooling | Focus |
|-------|-------|---------|-------|
| Unit | Engineering | Vitest (`packages/shared`) | Fee math, role gates, pure helpers |
| Integration | Engineering | Supabase local + scripts | RPC money split, RLS smoke |
| System / E2E | QA + Engineering | Manual checklist → later Maestro/Playwright | Happy path across 4 apps |
| UAT | Product/stakeholders | Staging demo | Business acceptance |

## 2. Priority test areas

1. **Money invariant** — subtotal untouched; platform = delivery + COD fees
2. **Verification gating** — Level 2+ for orders; Level 4 for accept delivery
3. **Order state machine** — merchant transitions + rider transitions
4. **RLS** — users cannot read/write others’ private data
5. **Fee rules** — base/distance/express/scheduled/COD

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
- Happy-path TC-01…TC-07 executed and recorded
- No open S1/S2 defects
