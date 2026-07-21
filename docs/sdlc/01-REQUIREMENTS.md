# Software Requirements Specification (SRS) — Bolantero MVP

**Version:** 1.0  
**Status:** Baseline for Phase 1  
**Source:** Product Vision v1.0  

## 1. Introduction

### 1.1 Purpose
Define functional and non-functional requirements for the Bolantero Phase 1 food-delivery MVP.

### 1.2 Scope
In scope: Customer, Merchant, Rider, Admin apps; identity verification; food catalog; order + delivery loop; delivery-fee revenue model; service areas Tacurong, Lambayong, Isulan.

Out of scope (later phases): grocery, pharmacy, parcel, hardware; multi-stop/bulk/corporate/P2P UI; automated KYC vendor; full payment gateway settlement.

### 1.3 Definitions
- **Platform fee:** delivery fee and optional COD handling fee only.
- **Verification level:** 1 Registered → 2 Customer → 3 Merchant → 4 Rider.

## 2. Stakeholders

| Stakeholder | Need |
|-------------|------|
| Customer | Safe, tracked local food delivery |
| Merchant | Orders + delivery without sales commission |
| Rider | Fair, transparent delivery work |
| Administrator | Approvals, monitoring, fee control |
| Business owner | Logistics-only revenue model |

## 3. Functional requirements

### FR-AUTH — Authentication
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Users can register/sign in via email/password (MVP demo) | Must |
| FR-AUTH-02 | Users can sign in via mobile OTP when SMS provider configured | Should |
| FR-AUTH-03 | Session persists securely per client platform | Must |

### FR-KYC — Identity verification
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-KYC-01 | Users submit government ID + selfie for Level 2 | Must |
| FR-KYC-02 | Merchants submit business verification for Level 3 | Must |
| FR-KYC-03 | Riders require Level 4 before accepting jobs | Must |
| FR-KYC-04 | Admin can approve/reject submissions | Must |
| FR-KYC-05 | Approved users display “Bolantero Verified” | Must |
| FR-KYC-06 | Placing orders requires Level ≥ 2 | Must |

### FR-MERCH — Merchant
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MERCH-01 | Merchant manages business profile and hours | Must |
| FR-MERCH-02 | Merchant CRUD products in Phase 1 food categories | Must |
| FR-MERCH-03 | Merchant receives realtime incoming orders | Must |
| FR-MERCH-04 | Merchant can confirm/reject/prepare/ready orders | Must |
| FR-MERCH-05 | Sales report shows gross product sales with no commission deduction | Must |

### FR-CUST — Customer
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CUST-01 | Browse/search approved food merchants by area/category | Must |
| FR-CUST-02 | Cart and checkout with transparent fee breakdown | Must |
| FR-CUST-03 | Support delivery types: immediate, scheduled, express | Must |
| FR-CUST-04 | Live order/delivery status tracking | Must |
| FR-CUST-05 | Rate rider after delivery | Should |

### FR-RIDE — Rider
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RIDE-01 | Toggle online/offline presence | Must |
| FR-RIDE-02 | View and accept awaiting deliveries | Must |
| FR-RIDE-03 | Advance status: assigned → arrived → picked up → delivered | Must |
| FR-RIDE-04 | Upload proof of delivery | Must |
| FR-RIDE-05 | View earnings ledger from completed deliveries | Must |

### FR-ADMIN — Administration
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADMIN-01 | Verification queue management | Must |
| FR-ADMIN-02 | Merchant approval/suspension | Must |
| FR-ADMIN-03 | Live delivery monitoring | Must |
| FR-ADMIN-04 | Configure delivery fee rules | Must |
| FR-ADMIN-05 | Reports separating merchant product revenue vs platform fees | Must |

### FR-FEE — Pricing & money
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FEE-01 | Fee engine: base + distance + type surcharge + optional COD fee | Must |
| FR-FEE-02 | `orders.subtotal` never reduced by platform commission | Must |
| FR-FEE-03 | Platform revenue recorded only as delivery/COD fee payments | Must |

## 4. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-SEC-01 | Row Level Security on all business tables | Must |
| NFR-SEC-02 | Private storage for IDs, selfies, POD | Must |
| NFR-PRIV-01 | Personal data minimized; verification docs access limited to owner/admin | Must |
| NFR-PERF-01 | Order/delivery status updates via realtime within interactive UX | Should |
| NFR-REL-01 | Schema changes via versioned migrations only | Must |
| NFR-MAIN-01 | Monorepo with shared domain packages | Must |
| NFR-USAB-01 | Mobile-first customer/rider; ops-dense merchant/admin | Should |

## 5. Constraints

- Launch geography: Tacurong City, Lambayong, Isulan
- Stack: Expo + Next.js + Supabase
- COD + recorded online intent only in MVP (no full PSP settlement)

## 6. Acceptance for MVP release

1. Seeded demo users complete happy path: order → merchant confirm → rider deliver → rate.
2. Admin can approve verification and configure fees.
3. Reports prove zero product commission.
4. CI lint/typecheck/unit tests pass.
5. Requirements in this SRS mapped in TRACEABILITY.md.
