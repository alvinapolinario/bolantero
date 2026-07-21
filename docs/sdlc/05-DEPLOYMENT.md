# Deployment Process — Bolantero

## 1. Environments

| Environment | Purpose |
|-------------|---------|
| Local | Developer machines + local Supabase |
| Staging | Pre-release validation / UAT |
| Production | Live users (future) |

## 2. Build artifacts

- `apps/merchant` / `apps/admin` — Next.js production build
- `apps/customer` / `apps/rider` — Expo EAS or store builds
- `supabase/migrations` — applied via Supabase CLI/CI

## 3. Release checklist

1. [ ] `main` CI green
2. [ ] Migrations reviewed and applied to target DB
3. [ ] Env vars set (URL, anon key, service role only on server/CI)
4. [ ] Seed/demo data **not** applied to production
5. [ ] Smoke TC-01…TC-07 on target environment
6. [ ] Tag release: `vX.Y.Z`
7. [ ] Record release notes (features, fixes, known issues)

## 4. Rollback

- App rollback: redeploy previous immutable build/tag
- DB rollback: prefer forward-fix migration; destructive down-migrations only with explicit approval
- Feature flags (future): disable risky paths without full rollback

## 5. Hosting notes (planned)

- Merchant/Admin: Node/Next host (e.g. Vercel or VPS)
- Mobile: Expo Application Services / Play Store / App Store
- Backend: Supabase project per environment
