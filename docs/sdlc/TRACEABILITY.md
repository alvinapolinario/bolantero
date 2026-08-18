# Requirements Traceability Matrix

Maps baseline requirements → primary implementation → verification.

| Req ID | Implementation (primary) | Test |
|--------|--------------------------|------|
| FR-AUTH-01 | `apps/*/login`, Supabase Auth | TC-01, manual login |
| FR-AUTH-02 | OTP flows in customer/rider/merchant | Manual when SMS enabled |
| FR-AUTH-03 | Expo SecureStore / Next cookies | Manual session persist |
| FR-AUTH-04 | `apps/*/RegisterScreen`, notice then Apple/Google/OTP | TC-14 |
| FR-AUTH-05 | RegisterScreen phone-after-social step | Manual + TC-14 helpers |
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
| FR-RIDE-06 | rider JobsScreen food + trips inbox | TC-11 |
| FR-RIDE-07 | `advance_trip` status machine | TC-11 |
| FR-TRIP-01 | `apps/customer/.../ServicesScreen`, `BookTripScreen` | TC-09 |
| FR-TRIP-02 | `quote_trip` + `packages/shared/trip-fees` | Unit + TC-09 + `pnpm api:smoke` |
| FR-TRIP-03 | `request_trip` verification_level ≥ 2 | TC-08/09 + `pnpm api:smoke` |
| FR-TRIP-04 | `request_trip` courier field checks | TC-10 + `pnpm api:smoke` |
| FR-TRIP-05 | TripTrackScreen + `cancel_trip` | TC-09 |
| FR-ADMIN-01 | verifications page | TC-01 |
| FR-ADMIN-02 | merchants page | Manual |
| FR-ADMIN-03 | deliveries page | TC-04 |
| FR-ADMIN-04 | fees page | Unit + manual |
| FR-ADMIN-05 | admin reports | TC-06, TC-12 |
| FR-ADMIN-06 | `apps/admin/trips` | TC-12 |
| FR-ADMIN-07 | admin fees trip rules | Unit + manual |
| FR-FEE-01 | `packages/shared/fees` + RPC | Unit tests + TC-02 |
| FR-FEE-02 | schema checks + RPC payments | Unit + TC-06 |
| FR-FEE-03 | `payments.payee` split | TC-06 |
| FR-FEE-04 | `trip_payments` payee check + `request_trip` | Unit + TC-09/12 |
| FR-FEE-05 | `trips` fare-split constraint + trip-fees | Unit + TC-09 |
| NFR-SEC-01 | RLS in migrations | RLS smoke (HAPPY_PATH) |
| NFR-SEC-02 | private buckets | Manual upload ACL |
| NFR-PRIV-01 | KYC private storage + RLS | Manual upload ACL |
| NFR-PRIV-02 | `packages/shared` consent helpers + RegisterScreen | TC-14 |
| NFR-REL-01 | `supabase/migrations` | CI/db reset + local `pnpm db:start` |
| NFR-MAIN-01 | Turborepo structure | Build CI |
| NFR-USAB-01 | Admin stacked tables; customer map-home + tabs (`apps/customer`) | TC-13, TC-15 |

Update this matrix when adding or changing Must-priority requirements.
