# Codex Architecture Preparation (POC-Aligned)

## Purpose
Prepare the existing Rules Builder application to host the Prompt Manager proof of concept described in `docs/prompt-manager/poc-plan.md` while honoring the long-term direction in `.ai/prompt-manager-plan.md`. The aim is to ship the POC quickly behind feature flags and keep pathways open for future expansion without committing to heavy refactors up front.

## Embedded Planning Highlights
- **Core Objective:** Deliver a feature-flagged Prompt Manager that lets admins curate prompts and learners browse a gated list within ~3 sprints, deferring advanced workflows (version diffing, localization, analytics) until after validation.
- **Guiding Constraints:** Ship everything behind `PROMPT_MANAGER_ENABLED`, reuse Astro + Supabase patterns, persist catalog data solely in Supabase, treat every authenticated user as cohort-eligible for the POC, ensure copy-to-clipboard behaves well in Cursor, and collect only minimal telemetry (`prompt_id`, `event_type`, `occurred_at`).
- **Audience & Access Expectations:** Supabase auth users mapped to Circle.so cohorts in the long run; roles (`admin`, `moderator`, `learner`) derived from `prompt_role` metadata; feature flags drive staged rollout per environment.
- **Phase Breakdown:**
  1. **Phase A – Flag & Access Seed:** Add flags, role helpers, and middleware guards with Vitest coverage.
  2. **Phase B – Prompt Catalog MVP:** Create Supabase schema (modules, lessons, prompts, favorites), seed baseline data, expose admin/learner APIs.
  3. **Phase C – Admin & Learner UI Slice:** Build admin table/editor, learner browsing UI with filters, favorites, copy-to-clipboard, and localization banner.
  4. **Phase D – Telemetry Stub & QA:** Add `prompt_usage_events`, telemetry hook gated by flag, Vitest specs, Playwright smoke test, and documentation updates.
- **Long-Term Hooks:** Future roadmap includes cohort validation via Circle.so sync, prompt version history, advanced telemetry with opt-out, and sharing prompt data via MCP.

## Source Context
> "The Prompt Manager will deliver a gated experience for 10xDevs course cohorts inside 10xRules.ai. Authenticated learners will browse, search, and favorite lesson-aligned prompts while administrators curate, version, and publish content without shipping code updates." — `.ai/prompt-manager-plan.md` (§ Overview)
>
> "Feature flag: Gate entire module behind a dedicated flag so rollout can be staged per environment." — `.ai/prompt-manager-plan.md` (§ Integration Points)
>
> "Prompt records store: `title`, `module_id`, `lesson_id`, `markdown_body`, status (`draft`, `published`, `archived`), version info, soft-delete timestamp." — `.ai/prompt-manager-plan.md` (§ Content Model & Metadata)
>
> "Track prompt impressions, copy actions, and favorite toggles in Supabase `prompt_usage_logs` table." — `.ai/prompt-manager-plan.md` (§ Telemetry & Privacy)
>
> "Keep everything behind `PROMPT_MANAGER_ENABLED` so partial work can deploy safely." — `docs/prompt-manager/poc-plan.md` (§ Guiding Constraints)
>
> "Feature flags, role helpers, and route guards using Supabase user metadata (e.g., `prompt_role` for admin/moderator/learner distinctions)." — `docs/prompt-manager/poc-plan.md` (§ Scope Included in POC)
>
> "Phase A – Flag & Access Seed" … "Phase D – Telemetry Stub & QA" — `docs/prompt-manager/poc-plan.md` (§ Phase Breakdown)

## Baseline Snapshot
- **Feature Flags:** `src/features/featureFlags.ts` already exposes `promptManager` and `promptUsageLogging`; implementation must tighten env bindings as required by both planning docs.
- **Access Helpers:** `src/features/prompt-manager/access.ts` resolves `prompt_role`, matching the POC requirement for metadata-driven roles.
- **Middleware Pattern:** Current Astro middleware (see `src/middleware`) provides auth checks we can extend for prompt routes without new infrastructure.
- **State Management:** Zustand stores under `src/store` and `src/features/.../stores` demonstrate patterns we can mirror for prompt selections/favorites per the POC guidance to reuse existing approaches.
- **Supabase Usage:** Rules builder currently uses Supabase via REST endpoints and `fetch`. POC work should add prompt-specific handlers without introducing new client libraries, aligning with "Reuse existing Astro + Supabase patterns".

## Supabase Schema Snapshot (POC)
```sql
-- Modules and lessons persist the course outline
CREATE TABLE prompt_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES prompt_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (module_id, slug)
);

-- Simplified prompts table: single active version, soft delete via status
CREATE TYPE prompt_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES prompt_modules(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES prompt_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  markdown_body TEXT NOT NULL,
  status prompt_status DEFAULT 'draft',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites for cross-device bookmarking
CREATE TABLE prompt_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, prompt_id)
);

-- Minimal telemetry stub for POC
CREATE TABLE prompt_usage_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('view', 'favorite', 'copy')),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Targeted Adjustments (Stay Lean)
- **Flags & Env Wiring:** Extend env types/config to surface `PROMPT_MANAGER_ENABLED` and `PROMPT_USAGE_LOGGING_ENABLED` application-wide, satisfying the staged rollout instruction from both planning docs.
- **Access Utilities:** Add `usePromptRoles()` hook and `withPromptAccess` middleware helper that composes feature flag + role gate while keeping cohort check permissive (`docs/prompt-manager/poc-plan.md`, Phase A).
- **Data Services:** Introduce focused Supabase helpers inside `src/features/prompt-manager/services/` for prompts, modules/lessons, favorites, and telemetry; map fields to the simplified schema referenced above while keeping compatibility with `.ai/prompt-manager-plan.md` future requirements.
- **Routing:** Create `/prompt-manager` and `/prompt-manager/admin` Astro routes under `src/pages` using existing layout components; inject guard logic via middleware entry to maintain coexistence with the rules experience.
- **UI Components:** Build prompt-specific components under `src/features/prompt-manager/components/` (catalog list, admin editor, favorite toggle) while reusing shared UI primitives from `src/components/ui`.
- **Telemetry Stub:** Implement a minimal logging hook that writes to `prompt_usage_events` only when `PROMPT_USAGE_LOGGING_ENABLED` is true, aligning with the POC Phase D deliverable and the long-term telemetry expectations.
- **Documentation:** Update README, `.ai/test-plan.md`, and `.ai/db-migrations.md` at each phase, mirroring the POC directive to document setup, limitations, and follow-ups.

## Implementation Tracks

### 1. Feature Gating & Access (Phase A)
- Update env schema (`src/env.d.ts`, `scripts`) to include `PROMPT_MANAGER_ENABLED` and `PROMPT_USAGE_LOGGING_ENABLED` with defaults noted in README.
- Extend `src/features/featureFlags.ts` with typed getters `isPromptManagerEnabled()` / `isPromptUsageLoggingEnabled()` reusing existing logic.
- Implement `usePromptRoles()` hook that wraps `resolvePromptRole` and surfaces `isAdmin`, `isModerator`, `hasCohortAccess`, per `docs/prompt-manager/poc-plan.md` Scope.
- Add middleware function `guardPromptManagerRoute()` to enforce flag + role while leaving `hasPromptCohortAccess` as the permissive stub described in Phase A.
- Write Vitest specs covering flag resolution and middleware guard paths.

### 2. Supabase Schema & Services (Phase B)
- Apply the schema above via Supabase migrations; mirror table/index names exactly for consistency.
- Provide a one-time admin seeding script/API to insert baseline modules/lessons directly into Supabase (required by the POC Scope) with clear teardown instructions.
- Build minimal repositories or service helpers for:
  - Modules/Lessons: fetch lists sorted by `sort_order`.
  - Prompts (Admin): create, update, publish toggle (affects `status` field).
  - Prompts (Learner): list published prompts filtered by module/lesson.
  - Favorites: toggle stored rows (unique per user/prompt).
- Ensure RLS policies allow admin CRUD vs. learner read, respecting the long-term governance noted in `.ai/prompt-manager-plan.md` (§ RLS policies) albeit simplified for the POC.

### 3. UI & UX Slice (Phase C)
- Admin route `/prompt-manager/admin`: table view with inline status pills, edit modal using Markdown textarea, and publish toggle; restrict to admin/moderator roles per `prompt_role` metadata.
- Learner route `/prompt-manager`: module tabs, lesson dropdown, search input (title filter), prompt detail accordion/drawer, copy-to-clipboard button tuned to behave in Cursor as mandated by the POC.
- Implement favorites toggle backed by Supabase, exposing state through a lightweight Zustand store to mirror patterns from the rules builder.
- Surface localization banner (e.g., `Alert` component) noting Polish-only content per POC scope.

### 4. Telemetry & QA (Phase D)
- Use the schema above to create `prompt_usage_events` and Supabase policy that allows inserts when telemetry flag is enabled.
- Implement client hook `usePromptTelemetry()` that fires `view` and `favorite` events when enabled, otherwise skips with console trace as suggested in the POC plan.
- Add Vitest unit tests ensuring the hook respects feature flags and records expected payloads.
- Author Playwright smoke test covering admin publish → learner browse → favorite + copy flow as spelled out in Phase D.
- Update README/docs to document telemetry toggle behavior and pilot limitations.

## Detailed Work Breakdown (Checklist)
- [ ] Phase A: Env wiring, feature flag helpers, role hook, middleware guard, Vitest coverage.
- [ ] Phase B: Supabase migrations, seeding utility, prompt repositories, RLS adjustments, API endpoints (`src/pages/api/prompt-manager/*`).
- [ ] Phase C: Admin UI (`/prompt-manager/admin`), learner UI (`/prompt-manager`), favorites store, localization messaging.
- [ ] Phase D: Telemetry table + hook, Vitest tests, Playwright smoke, documentation updates (README, `.ai/test-plan.md`, `.ai/db-migrations.md`, `docs/prompt-manager/README.md`).

## Lean Practices to Maintain
- Keep every prompt surface behind `PROMPT_MANAGER_ENABLED`/`PROMPT_USAGE_LOGGING_ENABLED` as required by both planning documents.
- Colocate prompt-specific logic under `src/features/prompt-manager/` during the POC, introducing shared abstractions only after duplication appears.
- Reuse existing Astro + Supabase patterns, deferring new infrastructure (e.g., React Query, global platform layer) until post-POC validation.
- Treat Supabase as the single source of truth for prompt data, matching both the POC plan and the future content model expectations.

## Questions to Resolve (Grounded in Planning Docs)
- What `prompt_role` values and default should Supabase assign at signup to satisfy role-based gating noted in `docs/prompt-manager/poc-plan.md` § Scope and `.ai/prompt-manager-plan.md` § Audience & Access Control?
- How will initial `prompt_modules`/`prompt_lessons` be seeded—temporary script, dashboard action, or manual insertion—to respect the POC rule "Store modules, lessons, and prompts exclusively in Supabase"?
- Which markdown copy strategy ensures "learner copy-to-clipboard with formatting that behaves well in Cursor" (POC Guiding Constraints)?
- Do we enable telemetry stub in all environments or limit to staging/pilot while aligning with the longer-term telemetry vision in `.ai/prompt-manager-plan.md`?
- What is the process for evolving the simplified schema toward the full content model (introducing `prompt_versions`, `prompt_usage_logs` with opt-out) after POC acceptance?

## Decisions Required Before Implementation
- Confirm directory organisation for POC code (`src/features/prompt-manager/...` plus optional `services` folder) so contributors stay aligned with the reuse-first guidance.
- Decide whether prompt APIs live under `src/pages/api/prompt-manager/` or within a shared handler directory; document chosen path in README for the team.
- Approve the minimal Supabase schema (fields, enums, indexes) prior to migrations, ensuring it agrees with both POC Phase B and long-term plan expectations.
- Establish ownership of feature flag toggles (`PROMPT_MANAGER_ENABLED`, `PROMPT_USAGE_LOGGING_ENABLED`) and define rollout order per environment, mirroring staged rollout advice from both documents.
- Agree on Vitest + Playwright coverage scope (exact cases) to satisfy the Phase D QA deliverable without expanding beyond the POC mandate.

## Non-Goals for POC (Explicit Deferrals)
- Google Sheets roster sync, nightly jobs, or cohort auditing — deferred per `docs/prompt-manager/poc-plan.md` Guiding Constraints and `.ai/prompt-manager-plan.md` Next Moves.
- Prompt version history, diffing UI, and bulk operations — postponed until after the POC validates the core flow.
- Comprehensive telemetry (opt-out toggles, dashboards) — limited to the stub described in Phase D.
- Shared platform refactors (React Query adoption, global domain modules) — revisit once both managers operate in production.

## Delivery Artifacts
- Updated documentation: README sections, `docs/prompt-manager/README.md`, `.ai/test-plan.md`, `.ai/db-migrations.md` capturing POC-specific instructions.
- Test evidence: Vitest coverage reports for helpers/services, Playwright report for admin-to-learner flow.
- Migration scripts and seeding instructions stored in `supabase/migrations/` with references in `docs/prompt-manager/poc-plan.md` follow-up notes.

## Comparison with `docs/cc-arch-prep.md`

### Advantages of Codex Approach
- **Tighter Planning Traceability:** Every architectural call-out is backed by embedded planning details and quotes, reducing guesswork when mapping scope to execution.
- **Phase-Aligned Execution:** Implementation tracks map 1:1 to the Phase A–D breakdown, providing clearer sprint planning guidance.
- **Actionable Task Breakdown:** Includes concrete tasks (env wiring, Supabase migrations, middleware helpers) and checklist ready for ticket creation.
- **Explicit Non-Goals:** Highlights deferred work to guard against scope creep, which is less pronounced in the competitor doc.
- **Delivery Artifacts Section:** Specifies documentation and testing outputs expected at completion, offering a ready-made Definition of Done.

### Limitations vs. `docs/cc-arch-prep.md`
- **Visual Aids:** Still omits code tree diagrams or component sketches that can assist in rapid scanning.
- **Lean by Design:** Focused on POC-level implementation; may require an additional follow-up doc to transition toward the full architecture vision once the POC lands.
- **Schema Evolution Guidance:** Details the POC schema but assumes future migrations will be defined later, whereas the competitor may outline transition steps more explicitly.

