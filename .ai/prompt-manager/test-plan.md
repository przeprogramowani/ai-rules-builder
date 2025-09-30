# Prompt Manager – Phase 1 Test Plan

## Scope
- Validate feature flag wiring and middleware gating introduced in Phase 1 implementation.
- Confirm organization-aware access behaviour without touching future migrations or UI work.
- E2E coverage stays deferred to later phases per implementation plan.

## Automated Coverage
- `npm run test`
  - `tests/unit/features/featureFlags.test.ts`
    - Asserts `PROMPT_MANAGER_ENABLED` defaults to `false` and honours `PUBLIC_PROMPT_MANAGER_ENABLED` overrides.
  - `tests/unit/services/promptManagerAccess.test.ts`
    - Parses single/multi-organization metadata, collects parse issues, and falls back to `10xDevs` membership.
    - Confirms boolean access flags hydrate fallback membership and admin roles are detected.
  - `tests/unit/middleware/promptManagerMiddleware.test.ts`
    - Verifies unauthenticated redirect, flag-disabled 404 response, no-membership denial, member allow-list, and admin-only enforcement for `/prompts/admin`.

## Manual Verification Checklist
1. Local: run `PUBLIC_PROMPT_MANAGER_ENABLED=true npm run dev` and confirm `/prompts` requires login and honours seeded membership.
2. Toggle flag off (`PUBLIC_PROMPT_MANAGER_ENABLED=false`) without redeploy — `/prompts` and `/prompts/admin` should return 404 responses (text fallback until UI slice ships).
3. With flag on, log in as member without organization assignment → expect 404 on `/prompts`.
4. With flag on, log in as admin member → `/prompts/admin` should redirect to `/prompts` when role downgraded and load successfully when role is `admin`.
5. Smoke existing public routes to ensure middleware changes did not block `/`, `/auth/*`, or API routes outside the prompt manager scope.

## Known Gaps / Deferred
- No Playwright scenarios yet; add in Phases 4–5 when member/admin UI surfaces exist.
- Supabase migrations for organizations land in Phase 2; current tests rely on metadata fixtures only.
