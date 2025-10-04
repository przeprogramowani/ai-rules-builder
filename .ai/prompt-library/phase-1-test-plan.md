# Prompt Manager – Phase 2 Test Plan

## Scope
- Validate Supabase-backed organization membership flow delivered in Phase 2, replacing metadata mocks.
- Confirm middleware, helpers, and query-param organization selection operate against live tables.
- Document verification of migrations, seeding steps, and manual QA for roster changes while UI remains unchanged.

## Automated Coverage
- `npm run test`
  - `tests/unit/services/promptManagerAccess.test.ts`
    - Exercises Supabase membership fetch helpers, slug selection logic, and feature-flag enforcement utilities.
  - `tests/unit/middleware/promptManagerMiddleware.test.ts`
    - Mocks Phase 2 context loading to verify flag gating, 404 fallbacks without memberships, admin redirects including active organization slug, and locals hydration.
  - Existing feature flag and supporting suites continue to guard flag toggling and global middleware regressions.

## Manual Verification Checklist
1. Apply new migration via Supabase CLI (`supabase db push`) or deployment pipeline; confirm `organizations` and `organization_members` exist with expected columns and indices.
2. Seed `10xDevs` organization (auto via migration) and backfill organization members using the documented SQL snippet (replace placeholder emails).
3. Run the app with `PUBLIC_PROMPT_MANAGER_ENABLED=true` and sign in as a seeded member: `/prompts` loads, `locals.promptManager.activeOrganization` matches the roster entry.
4. Append `?organization=<slug>` to `/prompts`; ensure switching to a valid slug updates content, and invalid/omitted slugs fall back to the first membership without errors.
5. Attempt `/prompts/admin` as member → expect redirect to `/prompts?organization=<slug>`; retry as admin → route allowed.
6. Remove membership row and verify the same user now receives 404 on `/prompts`, confirming live roster enforcement.

## Known Gaps / Deferred
- No Playwright or Supabase emulator coverage yet; earmarked for future phases once UI surfaces emerge.
- RLS policies remain disabled pending dedicated security review (tracked for Phase 4).
- Prompt catalog schema work begins in Phase 3; current tests cover membership foundation only.
