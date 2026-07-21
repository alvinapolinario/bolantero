# Requirements Traceability Matrix

Maps baseline requirements → primary implementation → verification.

| Req ID | Implementation (primary) | Test |
|--------|--------------------------|------|
| FR-AUTH-01 | `apps/*/login`, Supabase Auth | TC-01, manual login |
| FR-AUTH-02 | OTP flows in customer/rider/merchant | Manual when SMS enabled |
| FR-AUTH-03 | Expo SecureStore / Next cookies | Manual session persist |
| FR-KYC-01 | `apps/customer/.../VerifyScreen`, storage buckets | TC-07 prep + admin approve |
| FR-KYC-02 | `apps/merchant/onboarding` | Manual + admin queue |
| FR-KYC-03 | `accept_delivery` RPC level check | TC-04 |
| FR-KYC-04 | `apps/admin/verifications`, `review_verification` | TC-01 |
| FR-KYC-05 | `verifiedBadgeLabel` + UI badges | Visual check |
| FR-KYC-06 | `place_order` verification_level ≥ 2 | TC-07 |
| FR-MERCH-01 | `apps/merchant/onboarding` | Manual |
| FR-MERCH-02 | `apps/merchant/products` | Manual |
| FR-MERCH-03 | `apps/merchant/orders` realtime | TC-03 |
| FR-MERCH-04 | order status buttons | TC-03 |
| FR-MERCH-05 | `apps/merchant/reports` | TC-06 |
| FR-CUST-01 | `apps/customer/.../HomeScreen` | Manual browse |
| FR-CUST-02 | CartScreen + `place_order` | TC-02 |
| FR-CUST-03 | delivery type chips | TC-02 |
| FR-CUST-04 | OrdersScreen realtime | TC-03/04 |
| FR-CUST-05 | rating insert in OrdersScreen | TC-05 |
| FR-RIDE-01 | rider_presence toggle | TC-04 |
| FR-RIDE-02 | JobsScreen accept | TC-04 |
| FR-RIDE-03 | status advance | TC-04 |
| FR-RIDE-04 | POD upload storage | TC-04 |
| FR-RIDE-05 | EarningsScreen | TC-04 |
| FR-ADMIN-01 | verifications page | TC-01 |
| FR-ADMIN-02 | merchants page | Manual |
| FR-ADMIN-03 | deliveries page | TC-04 |
| FR-ADMIN-04 | fees page | Unit + manual |
| FR-ADMIN-05 | admin reports | TC-06 |
| FR-FEE-01 | `packages/shared/fees` + RPC | Unit tests + TC-02 |
| FR-FEE-02 | schema checks + RPC payments | Unit + TC-06 |
| FR-FEE-03 | `payments.payee` split | TC-06 |
| NFR-SEC-01 | RLS in migrations | RLS smoke (HAPPY_PATH) |
| NFR-SEC-02 | private buckets | Manual upload ACL |
| NFR-REL-01 | `supabase/migrations` | CI/db reset |
| NFR-MAIN-01 | Turborepo structure | Build CI |

Update this matrix when adding or changing Must-priority requirements.
