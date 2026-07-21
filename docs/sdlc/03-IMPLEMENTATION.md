# Implementation Standards — Bolantero

## 1. Branching model

| Branch | Purpose |
|--------|---------|
| `main` | Stable, releasable |
| `develop` (optional) | Integration |
| `feature/<req-id>-short-name` | Feature work tied to requirement ID |
| `fix/<issue>-short-name` | Bug fixes |
| `chore/<topic>` | Tooling/docs only |

Example: `feature/FR-FEE-01-express-multiplier`

## 2. Definition of Done (DoD)

A change is done only when:

1. Linked to requirement ID(s) in PR description
2. Design impact noted (or “no design change”)
3. Code reviewed (or self-reviewed with checklist for solo work)
4. Unit/integration tests updated where applicable
5. CI green (lint / typecheck / unit tests)
6. TRACEABILITY.md updated if new FR/NFR covered
7. No secrets committed
8. Migrations included for schema changes

## 3. Coding standards

- TypeScript strict across apps/packages
- Shared domain logic in `packages/shared` (fees, roles, schemas) — do not duplicate
- DB access through Supabase client; business writes that affect money go through RPCs
- Prefer small, reviewable PRs over large mixed commits
- UI follows existing brand tokens in `@bolantero/ui`

## 4. Database engineering

1. Add SQL under `supabase/migrations/`
2. Update `packages/database/src/types.ts` (or regenerate)
3. Update seed/demo script if needed
4. Never edit production schema via dashboard without a matching migration

## 5. Commit message convention

```
type(scope): summary

Why this change matters.
Refs: FR-XXXX
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`

## 6. PR template fields (required)

- Requirement IDs
- Summary / risk
- Test plan executed
- Screenshots for UI (if applicable)
