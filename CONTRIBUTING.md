# Contributing to Bolantero

Bolantero uses a formal **SDLC**. Read [docs/sdlc/00-OVERVIEW.md](docs/sdlc/00-OVERVIEW.md) before coding.

## Workflow

1. Pick a requirement ID from [docs/sdlc/01-REQUIREMENTS.md](docs/sdlc/01-REQUIREMENTS.md) (or add one via review).
2. Branch: `feature/FR-XXXX-description`.
3. Implement against [docs/sdlc/02-ANALYSIS-DESIGN.md](docs/sdlc/02-ANALYSIS-DESIGN.md).
4. Add/update tests per [docs/sdlc/04-TESTING.md](docs/sdlc/04-TESTING.md).
5. Update [docs/sdlc/TRACEABILITY.md](docs/sdlc/TRACEABILITY.md) if coverage changes.
6. Open PR using the checklist in [docs/sdlc/03-IMPLEMENTATION.md](docs/sdlc/03-IMPLEMENTATION.md).
7. Merge only when CI is green.

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter merchant build
pnpm --filter admin build
```

## Do not

- Commit `.env` / secrets
- Change fee/money behavior without SRS + design updates
- Edit production DB schemas outside migrations
