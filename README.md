# Bolantero

Hyperlocal delivery platform for Tacurong City, Lambayong, and Isulan.

Bolantero is a **logistics and mobility service**, not a marketplace commission model. Merchants keep **100% of product sales**. Platform revenue comes from food delivery-related fees and Ride/Padala trip platform fees.

> Real People. Verified Identities. Trusted Local Delivery.

## Software engineering & SDLC

This project follows a formal iterative SDLC. Implementation work must be traced to requirements, reviewed against design, and verified by tests.

| Document | Purpose |
|----------|---------|
| [docs/sdlc/00-OVERVIEW.md](docs/sdlc/00-OVERVIEW.md) | Process model & gates |
| [docs/sdlc/01-REQUIREMENTS.md](docs/sdlc/01-REQUIREMENTS.md) | SRS (functional / non-functional) |
| [docs/sdlc/02-ANALYSIS-DESIGN.md](docs/sdlc/02-ANALYSIS-DESIGN.md) | Architecture & ADRs |
| [docs/sdlc/03-IMPLEMENTATION.md](docs/sdlc/03-IMPLEMENTATION.md) | Coding / DoD / branching |
| [docs/sdlc/04-TESTING.md](docs/sdlc/04-TESTING.md) | Test strategy |
| [docs/sdlc/05-DEPLOYMENT.md](docs/sdlc/05-DEPLOYMENT.md) | Release process |
| [docs/sdlc/06-MAINTENANCE.md](docs/sdlc/06-MAINTENANCE.md) | Change & incidents |
| [docs/sdlc/TRACEABILITY.md](docs/sdlc/TRACEABILITY.md) | Req → code → test matrix |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor workflow |

```bash
pnpm test        # unit tests (fee engine, verification gates)
pnpm typecheck   # TypeScript
pnpm lint        # package lints
```

CI runs on pull requests via `.github/workflows/ci.yml`.

## Stack

- **Customer app** — Expo (`apps/customer`)
- **Rider app** — Expo (`apps/rider`)
- **Merchant portal** — Next.js (`apps/merchant`, port 3000)
- **Admin portal** — Next.js (`apps/admin`, port 3001)
- **Backend** — Supabase Auth, Postgres, Storage, Realtime

## Monorepo

```text
apps/
  customer/   # Expo
  rider/      # Expo
  merchant/   # Next.js
  admin/      # Next.js
packages/
  shared/     # fees, roles, schemas
  database/   # Supabase client + types
  ui/         # brand tokens
supabase/     # migrations + seed
```

## Prerequisites

- Node 20+
- pnpm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local Supabase)

## Setup

```bash
pnpm install
cp .env.example .env
cp apps/merchant/.env.example apps/merchant/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Start Supabase and apply migrations:

```bash
pnpm dlx supabase start
pnpm dlx supabase db reset
```

Copy the printed `anon` and `service_role` keys into:

- `.env`
- `apps/merchant/.env.local`
- `apps/admin/.env.local`
- `apps/customer/app.json` → `expo.extra`
- `apps/rider/app.json` → `expo.extra`

Seed demo users + launch merchants:

```bash
node --env-file=.env scripts/seed-demo.mjs
```

## Run apps

```bash
# all package scripts via turbo
pnpm --filter merchant dev
pnpm --filter admin dev
pnpm --filter customer dev
pnpm --filter rider dev
```

## Demo accounts

Password for all: `password123`

| Role | Email |
|------|-------|
| Admin | admin@bolantero.local |
| Customer | customer@bolantero.local |
| Merchant | merchant@bolantero.local |
| Rider | rider@bolantero.local |

Phone OTP flows are available in customer/rider/merchant UIs when Supabase SMS is configured. Locally, prefer the email demo accounts.

## Happy-path checklist

1. Admin signs in → approve any pending verifications/merchants.
2. Merchant signs in → confirm products → watch Orders for incoming jobs.
3. Customer verifies (Level 2) → home shows Ride | Padala | Food.
4. Ride or Padala: pick landmarks → quote → confirm. Padala needs item + recipient.
5. Food (unchanged): browse merchants → checkout with fee breakdown → merchant confirm/ready.
6. Rider goes online → accepts a trip or food job → advance status → complete (POD for food).
7. Customer tracks/cancels requested trips; rates food riders. Admin monitors Live Deliveries and Live Trips. Reports show merchant product ≠ food fees ≠ trip platform fees.

## Money model invariant

- `orders.subtotal` → merchant revenue (never skimmed)
- `orders.delivery_fee` + `orders.cod_fee` → Bolantero food logistics revenue
- `trips.platform_fee` → Bolantero Ride/Padala revenue (`trips.fare = platform_fee + rider_earning`)
- No commission columns or UI paths exist for product sales
- Trip payments never use a merchant payee

## Verification levels

1. Registered (phone/email)
2. Verified Customer
3. Verified Merchant
4. Verified Rider

Approved users show **Bolantero Verified**.
