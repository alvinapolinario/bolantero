# Software Requirements Specification (SRS) — Bolantero

**Version:** 1.1  
**Status:** Baseline for Phase 1 + Phase 2  
**Source:** Product Vision v1.0; Phase 2 Ride + Padala plan  

## 1. Introduction

### 1.1 Purpose
Define functional and non-functional requirements for Bolantero Phase 1 food delivery and Phase 2 motorcycle Ride + Padala.

### 1.2 Scope
In scope: Customer, Merchant, Rider, Admin apps; identity verification; food catalog; order + delivery loop; motorcycle Ride and P2P Padala trips; delivery-fee and trip-fare revenue model; service areas Tacurong, Lambayong, Isulan.

Out of scope (later phases): grocery, pharmacy, hardware; cars/vans; multi-stop/bulk/corporate; scheduled/pre-book trips; surge pricing; auto-dispatch; in-app navigation; automated KYC vendor; full payment gateway settlement.

### 1.3 Definitions
- **Platform fee (food):** delivery fee and optional COD handling fee only.
- **Platform fee (trips):** configured share of trip fare (`trips.platform_fee`). Never a merchant product commission.
- **Trip:** merchant-less Ride or Padala booking in the `trips` domain.
- **Verification level:** 1 Registered → 2 Customer → 3 Merchant → 4 Rider.

## 2. Stakeholders

| Stakeholder | Need |
|-------------|------|
| Customer | Safe, tracked local food delivery, rides, and padala |
| Merchant | Orders + delivery without sales commission |
| Rider | Fair, transparent food-delivery and trip work |
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
| FR-RIDE-06 | Rider inbox shows food deliveries and trips; accept is exclusive | Must |
| FR-RIDE-07 | Trip status: requested → accepted → arrived_pickup → in_progress → completed | Must |

### FR-TRIP — Ride and Padala
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TRIP-01 | Customer picks Ride or Padala and sets pickup + dropoff in a launch area | Must |
| FR-TRIP-02 | System returns a fare quote before confirm (`quote_trip`) | Must |
| FR-TRIP-03 | Level ≥ 2 can `request_trip`; creates trip in `requested` | Must |
| FR-TRIP-04 | Padala requires item description + recipient contact | Must |
| FR-TRIP-05 | Customer tracks status realtime and can cancel while `requested` | Must |

### FR-ADMIN — Administration
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADMIN-01 | Verification queue management | Must |
| FR-ADMIN-02 | Merchant approval/suspension | Must |
| FR-ADMIN-03 | Live delivery monitoring | Must |
| FR-ADMIN-04 | Configure delivery fee rules | Must |
| FR-ADMIN-05 | Reports separating merchant product revenue vs platform fees | Must |
| FR-ADMIN-06 | Live trip monitor | Must |
| FR-ADMIN-07 | Configure ride vs padala fare rules | Must |

### FR-FEE — Pricing & money
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FEE-01 | Fee engine: base + distance + type surcharge + optional COD fee | Must |
| FR-FEE-02 | `orders.subtotal` never reduced by platform commission | Must |
| FR-FEE-03 | Food platform revenue recorded only as delivery/COD fee payments | Must |
| FR-FEE-04 | Trip fare never writes `orders.subtotal` or a merchant payee | Must |
| FR-FEE-05 | `trips.fare = platform_fee + rider_earning` | Must |

## 4. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-SEC-01 | Row Level Security on all business tables | Must |
| NFR-SEC-02 | Private storage for IDs, selfies, POD | Must |
| NFR-PRIV-01 | Personal data minimized; verification docs access limited to owner/admin | Must |
| NFR-PERF-01 | Order, delivery, and trip status updates via realtime within interactive UX | Should |
| NFR-REL-01 | Schema changes via versioned migrations only | Must |
| NFR-MAIN-01 | Monorepo with shared domain packages | Must |
| NFR-USAB-01 | Mobile-first customer/rider; ops-dense merchant/admin | Should |

## 5. Constraints

- Launch geography: Tacurong City, Lambayong, Isulan
- Stack: Expo + Next.js + Supabase
- COD + recorded online intent only in MVP (no full PSP settlement)

## 6. Acceptance for Phase 2 release

1. Seeded demo users complete food happy path: order → merchant confirm → rider deliver → rate.
2. Seeded demo users complete Ride and Padala: quote → request → rider accept/advance → complete.
3. Admin can approve verification and configure food + trip fare rules.
4. Reports prove zero product commission and separate trip platform fees.
5. CI lint/typecheck/unit tests pass.
6. Requirements in this SRS mapped in TRACEABILITY.md.
