# Bolantero SDLC Overview

Bolantero follows a **hybrid iterative SDLC**: requirements and architecture are baselined, then delivery proceeds in controlled sprints with verification gates. Ad-hoc feature coding without requirements, design impact, and test evidence is out of process.

## Process model

| Phase | Purpose | Exit criteria |
|-------|---------|---------------|
| 1. Planning & Requirements | Scope, stakeholders, success metrics | Approved SRS + prioritized backlog |
| 2. Analysis & Design | Architecture, data, APIs, UX flows | Design review signed off |
| 3. Implementation | Build against design & acceptance criteria | Code review + CI green |
| 4. Testing | Verify functional, security, money invariants | Test report + defect triage |
| 5. Deployment | Release to target environment | Deploy checklist complete |
| 6. Maintenance | Monitor, fix, improve | Incident/change records |

## Documents in this folder

| Document | Phase |
|----------|-------|
| [01-REQUIREMENTS.md](01-REQUIREMENTS.md) | Requirements (SRS) |
| [02-ANALYSIS-DESIGN.md](02-ANALYSIS-DESIGN.md) | Analysis & Design |
| [03-IMPLEMENTATION.md](03-IMPLEMENTATION.md) | Implementation standards |
| [04-TESTING.md](04-TESTING.md) | Test strategy & plan |
| [05-DEPLOYMENT.md](05-DEPLOYMENT.md) | Release & deploy |
| [06-MAINTENANCE.md](06-MAINTENANCE.md) | Operations & change control |
| [TRACEABILITY.md](TRACEABILITY.md) | Requirement → code → test map |

## Roles (RACI summary)

| Activity | Product | Engineering | QA | Ops |
|----------|---------|-------------|----|-----|
| Requirements | A/R | C | C | I |
| Design | C | A/R | C | C |
| Implementation | I | A/R | C | I |
| Testing | C | C | A/R | I |
| Deployment | C | R | C | A/R |

A = Accountable, R = Responsible, C = Consulted, I = Informed

## Current lifecycle stage

**Phase 2 (Ride + Padala)** — Motorcycle ride-hailing and P2P courier are in implementation for Tacurong / Lambayong / Isulan. Phase 1 food delivery stays working and is not expanded. Work must open with a requirement ID and close with tests mapped in [TRACEABILITY.md](TRACEABILITY.md).

## Non-negotiable engineering rules

1. **Money invariant:** merchants keep 100% of `orders.subtotal`; platform earns food delivery/COD fees and trip platform fees only. No product-sales commission.
2. **Identity trust:** core actions gated by verification level.
3. **No silent scope creep:** new delivery types / phases need requirement + design update first.
4. **CI must pass** before merge to `main`.
5. **Database changes** only via Supabase migrations (no manual prod schema edits).
