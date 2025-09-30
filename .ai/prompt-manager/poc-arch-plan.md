# Dodex Architecture Prep v2 (POC MVP Cut)

## Core Objective
Deliver the prompt manager proof of concept in the shortest path that still honors the product intent captured in the planning docs. The POC focus is the admin curation flow and member browsing flow that validate data contracts without over-investing in long-term automation.
> "Ship a feature-flagged Prompt Manager proof of concept that exercises the core flow (admin curates prompts, member browses gated list) while deferring advanced workflows like version diffing, automated localization, and rich analytics." — `docs/prompts/poc-plan.md` (§ Objective)


## MVP Guardrails (Keep Lean, Stay Grounded)
- **Flag-first rollout:** Everything hides behind `PROMPT_MANAGER_ENABLED` with toggles defined in `featureFlags.ts`;
- **Reuse existing rails:** Stick to Astro routes + Supabase fetch patterns already proven in Rules Builder; no new client libraries until the POC ships.
- **Single active version:** Maintain only one editable/published prompt entry (POC "Simplified prompt catalog schema") to avoid versioning overhead now.
- **Organization-aware access:** Require an explicit `organization_members` membership before any prompt routes load; the launch cohort is mapped to `10xDevs`, and the remaining ~254 existing users stay locked out until they receive an organization assignment.
- **Naming clarity:** Internal feature remains `prompt-manager`; member/admin surfaces still live at `/prompts` and `/prompts/admin`.
- **Documentation last:** Update README + `.ai/test-plan.md` once the MVP slice stands up; avoid churn mid-build.

## Must-Haves vs. Nice-to-Haves
| Area | Must-Have (keep) | Nice-to-Have (defer) |
| --- | --- | --- |
| Feature gating | Middleware check for flag + organization membership helper (default to 10xDevs) | Feature analytics for rollout, per-env telemetry metrics |
| Supabase schema | `organizations`, `organization_members`, `prompt_collections`, `prompt_segments`, `prompts` | `prompt_versions`, `prompt_usage_logs`, enums, audit tables |
| Admin UI | Table view scoped to active organization, edit/publish modal, status toggle | Markdown diffing, bulk publish, drafts filter presets |
| Member UI | Organization selector, collection/segment filters, prompt accordion, copy & download actions | Full-text search, skeleton loaders, localization banner |
| Testing | Vitest for guards + API, Playwright happy-path | Edge-case Vitest, telemetry + localization suites |
| Documentation | README + `.ai/test-plan.md` update post-delivery | Dedicated module docs, diagrams, migration walkthroughs |

## Inline Schema & Data Contracts
@.ai/prompt-manager/schema-proposal.md


### Seeding Strategy
- Seed `organizations` with at least `10xdevs` slug plus any internal testing orgs.
- Seed `prompt_collections`/`prompt_collection_segments` for 10xDevs modules and sub-groups inside the migration (INSERT statements guarded by `if not exists`) so new environments come online instantly.
- Provide a one-off SQL insert block in the same migration for 2 exemplar prompts scoped to 10xDevs—matching the POC need for demo data—then delete/replace via admin UI.

## Lean API & UI Flow Snapshot (Embedded Context)
- **Admin APIs (`/api/prompts/admin/*`):**
  - `POST /prompts` → create draft scoped to `organization_id` (requires flag + organization role in [`admin`]).
  - `PATCH /prompts/:id` → update fields or toggle status, ensuring organization ownership. Uses Supabase service key (POC "direct data access").
  - `GET /prompts-collections?organization_id=...` helper returning seeded collections/segments for UI selects.
- **Member APIs (`/api/prompts/*`):**
  - `GET /prompts?organization_id=...&collection=...&segment=...` filters to `status='published'` using the index above.
- **UI Reuse Plan:** reuse Rules Builder table, drawer, and copy interaction to honor MVP guardrail "Reuse existing components".  Organization selector reuses existing dropdown component styled for nav.
- **Routing:** Admin route at `/prompts/admin`, member route `/prompts`. Feature flag guard sits in middleware + page-level loader to avoid hydration of hidden routes while validating organization membership.

## Implementation Tracks (3 Parallelizable Slices)
1. **Track A – Access & Seed Bootstrapping**
   - Add feature flags in `featureFlags.ts` + middleware guard (POC phase A).
   - Implement `ensurePromptAccess()` middleware helper reading organization memberships from Supabase metadata.
   - Apply migration above; document Supabase command in README after completion, including organization + collection seeds.
   - Drop seed SQL file into `supabase/migrations/<timestamp>__prompt_manager_seed.sql` using the snippet here (no dependency on other docs).
2. **Track B – Admin & Member Surfaces**
   - Admin page uses existing table component, inline modal for create/edit; publish button flips `status` via API scoped to selected organization.
   - Member page reuses select components for organization + collection, accordion list, copy and download actions.
   - Data fetching: Astro route loaders call Supabase via `fetch` using service role for admin, anon key for member (still behind middleware) while injecting `organization_id` filter.
3. **Track C – QA & Wrap-Up**
   - Vitest coverage: middleware guard, admin CRUD handler, member list handler (mock Supabase) with multi-organization fixture.
   - Playwright scenario: admin switches organization → creates prompt → toggles publish → member selects organization + collection → copy and download success.


## Questions to Close Before Build
Q1: Which organization role strings (`member`,  `admin`) should unlock admin surfaces vs. member-only access for the POC? (Needed to finalize middleware guard.)
A1: `admin` for admin surfaces, `member` for member-only access.
Q2: Do we seed demo prompts in migrations or via Supabase dashboard before demo? (Impacts developer onboarding.)
A2: In migrations.
Q3: Which environment holds the service role key for admin APIs during the POC? (Clarifies deployment risk.)
A3: In all environments.
Q4: Are we comfortable skipping RLS for the short-lived POC while using service role? (Decision affects follow-up hardening.)
A4: Yes.

## Decisions Required Up Front
DR1: Approve the lean schema (columns + indexes) above so migration can land without rework.
D1: Lean schema approved.
DR2: Confirm API route placement (`src/pages/api/prompts/...`) vs. co-located feature folder to keep imports consistent.
D2: API route placement confirmed.


## De-Scoped (Documented Deferrals)
- No roster validation, telemetry tables, version history, or localization enhancements; revisit with full architecture plan once POC validated.
- No Zustand store or React Query adoption—component state suffices until patterns stabilize.
- No advanced error boundaries or offline caching; fallback is a simple error message in both routes.

## Definition of Done
- Feature flag + middleware hide all prompt routes when disabled and enforce organization membership + role rules when enabled.
- Admin can CRUD & publish prompts tied to seeded organization collections/segments; member sees only published prompts and can copy them with persistence.
- Supabase migration applied with seed data matching tables above; API endpoints backed by the lean schema respond successfully.
- Vitest + Playwright checks in Track C pass locally; README + `.ai/test-plan.md` updated to describe the MVP flow and known deferrals.
