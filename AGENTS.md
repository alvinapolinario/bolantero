# Agent / engineer operating rules

Bolantero uses a software engineering SDLC. Before changing product behavior:

1. Identify or add requirement IDs in `docs/sdlc/01-REQUIREMENTS.md`.
2. Check design impact in `docs/sdlc/02-ANALYSIS-DESIGN.md`.
3. Implement with DoD from `docs/sdlc/03-IMPLEMENTATION.md`.
4. Add or update tests per `docs/sdlc/04-TESTING.md`.
5. Keep `docs/sdlc/TRACEABILITY.md` accurate.

Never introduce merchant sales commissions. Platform revenue is delivery-related fees only.

Prefer small, reviewable changes with CI green (`pnpm test`, typecheck, web builds).
