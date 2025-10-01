# Phase 2 – Organization Membership Foundation Implementation Plan

## Goal & Context
- Persist organization roster data in Supabase so memberships are no longer mocked from metadata, fulfilling PRD stories US-002 (enforced membership) and pre-requisites for US-003/US-005.
- Deliver the foundation described in `poc-impl-plan.md` Phase 2 and `poc-arch-plan.md` Track A by introducing the real `organizations` + `organization_members` tables, seeds, and server helpers that hydrate active organization context.
- Keep the feature behind `PROMPT_MANAGER_ENABLED`; Phase 2 focuses on data layer + middleware adjustments without changing member/admin UI yet.

## Scope (Included / Deferred)
- **Included:** Supabase migrations + seeds, TypeScript database typings update, helper/service refactors to query live tables, middleware integration, organization switch plumbing (server context + query param), unit/integration tests, operational docs for seeding cohort.
- **Deferred:** Prompt collections/prompts schema (Phase 3), UI for membership management, automation of roster sync, Playwright coverage ( Phase 4+ ), RLS policies, audit logging.

## Deliverables
1. Supabase migration pair creating `organizations` & `organization_members` with indices, constraints, and seeds for `10xDevs` + curated launch cohort placeholders.
2. Updated `src/db/database.types.ts` via `supabase gen types typescript` (or scripted equivalent) to reflect new tables.
3. Server-side membership services that load organizations for the logged-in user, respect query param overrides, and expose admin/member role helpers.
4. Middleware + locals updates reading from the live membership tables (dropping metadata fallback except for single-phase backward compatibility if needed).
5. Revised unit tests covering Supabase-backed helpers and middleware plus new integration-level tests using mocked RPC responses.
6. Documentation + runbook updates (.ai/prompt-manager/test-plan.md, phase notes, README snippet) describing migrations, seeding steps, and manual QA scenarios.

## Workstreams

### 1. Database Migrations & Seeds
- Create SQL migration `supabase/migrations/<timestamp>__prompt_manager_orgs.sql` implementing the schema from `schema-proposal.md`:
  - `organizations` table (uuid PK, slug unique, timestamps).
  - `organization_members` table (composite PK `(organization_id,user_id)`, `role` check in `('member','admin')`).
  - Indexes on `organization_members(user_id)` for membership lookups.
- Seed data inside the migration (idempotent using `on conflict do nothing`):
  - `10xDevs` organization with slug `10xdevs`.
  - Placeholder membership rows referencing launch cohort UUIDs (pull from secure config / TODO comment if IDs not yet final).
- Provide companion script or SQL snippet to backfill additional members post-migration (documented for ops).
- Ensure migrations run locally (`npm run db:migrate` or documented Supabase CLI command) and verify rollback strategy (DROP TABLE cascades) in dev.

### 2. Types & Service Layer Updates
- Regenerate `src/db/database.types.ts` after migration apply; commit alongside migration ensuring type safety.
- Introduce `src/services/prompt-manager/organizations.ts` (or extend existing access module) to expose:
  - `fetchUserOrganizations(supabase, userId)` → queries `organization_members` joined with `organizations`.
  - `fetchOrganizationBySlug(supabase, slug)` → used for slug→id resolution when query param set.
  - Typed return models aligning with PRD roles.
- Ensure services use server Supabase client (from middleware locals) and gracefully handle empty results.

### 3. Middleware & Helper Refactor
- Update `getUserOrganizations` helper to prefer DB fetch:
  - Call membership service when `PROMPT_MANAGER_ENABLED` true and Supabase client available.
  - Maintain metadata fallback behind feature flag (`PROMPT_MANAGER_FALLBACK_METADATA=true`) for one release if required; default to DB-only once seeds land.
- Extend middleware to support organization selection via `?organization=<slug>` query param:
  - Validate slug belongs to user; store active organization on `locals.promptManager.activeOrganization`.
  - Default to first membership (still 10xDevs) when slug missing/invalid.
- Update redirect logic to include active org in redirect targets (e.g., `/prompts?organization=...`).
- Guarantee no additional Supabase calls execute when user lacks memberships (short-circuit).

### 4. Testing & QA
- Unit tests (Vitest):
  - Mock Supabase query responses for membership service (happy path, no membership, multiple orgs, admin vs member).
  - Validate helper selection logic (query param, fallback order, metadata fallback disabled by default).
  - Middleware tests ensuring new locals (`activeOrganization`) propagate and 404 responses respect DB-backed membership.
- Integration smoke (optional if time):
  - Add Supabase test harness or contract tests hitting local Supabase emulator (flagged optional but document plan).
- Update `.ai/prompt-manager/test-plan.md` with Phase 2 scenarios: migration verification, manual org switch, membership removal edge cases.

### 5. Operational Documentation & Tooling
- Document migration apply steps for all environments (local, integration, prod) in `.ai/prompt-manager/phase-2-notes.md`:
  - Required secrets (service role) for seeding script.
  - Safety checklist before enabling flag in staging (verify membership counts, ensure non-cohort users absent).
- Update README or dedicated Supabase doc with commands to regenerate types and run migrations.
- Prepare manual QA checklist: login as member/admin, change organization via query param, remove membership and verify access revocation.

## Timeline & Sequencing
1. **Day 1–2:** Draft & apply migrations locally, regenerate types, commit seeds (Workstream 1 & part of 2).
2. **Day 3:** Implement service layer + helper refactor, ensure middleware uses new flow (Workstreams 2–3).
3. **Day 4:** Expand unit tests, run full suite, adjust fixtures (Workstream 4).
4. **Day 5:** Author docs/runbooks, dry-run migration rollout in staging sandbox (Workstream 5), handoff for review.

## Dependencies & Open Questions
DR1: Need launch cohort Supabase user UUIDs (coordinate with data/ops before finalizing seeds).
D1: Launch cohort Supabase user UUIDs will be provided later.
DR2: Confirm Supabase CLI availability in CI for migration/type gen automation.
D2: Supabase CLI is available in CI for migration/type gen automation.
DR3: Decide whether metadata fallback must remain during transition (default plan removes fallback unless explicitly required).
D3: Get rid of metadata fallback.
DR4: Ensure security review sign-off acknowledging continued absence of RLS in Phase 2 (middleware enforced).
D4: Security review sign-off acknowledging continued absence of RLS in Phase 2 (middleware enforced).

## Exit Criteria (Definition of Done)
- `organizations` + `organization_members` migrations applied in local + integration envs with seed data verified.
- Helper functions and middleware rely on Supabase tables to determine access; metadata fallback removed.
- Authenticated users with seeded membership can access `/prompts` and switch organizations via slug parameter; non-members receive 404.
- Unit test suite green; docs updated with migration/runbook + revised QA checklist; stakeholders briefed on cohort seeding steps.

## Risks & Mitigations
- **Risk:** Additional DB fetch in middleware could impact latency. *Mitigation:* cache membership result on `locals` (single fetch per request), add index on `organization_members(user_id)`.
- **Risk:** Query param misuse exposing other org IDs. *Mitigation:* enforce join on user-specific memberships; 404 slug not belonging to user.
