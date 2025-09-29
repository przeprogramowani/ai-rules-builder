# Dodex Architecture Prep v2 (POC MVP Cut)

## Core Objective
Deliver the prompt manager proof of concept in the shortest path that still honors the product intent captured in the planning docs. The POC focus is the admin curation flow and learner browsing flow that validate data contracts without over-investing in long-term automation.
> "Ship a feature-flagged Prompt Manager proof of concept that exercises the core flow (admin curates prompts, learner browses gated list) while deferring advanced workflows like version diffing, automated localization, and rich analytics." — `docs/prompt-manager/poc-plan.md` (§ Objective)
>
> "Authenticated learners will browse, search, and favorite lesson-aligned prompts while administrators curate, version, and publish content without shipping code updates." — `.ai/prompt-manager-plan.md` (§ Overview)

## MVP Guardrails (Keep Lean, Stay Grounded)
- **Flag-first rollout:** Everything hides behind `PROMPT_MANAGER_ENABLED`; telemetry stubs behind `PROMPT_USAGE_LOGGING_ENABLED` per POC Guiding Constraints.
- **Reuse existing rails:** Stick to Astro routes + Supabase fetch patterns already proven in Rules Builder; no new client libraries until the POC ships.
- **Single active version:** Maintain only one editable/published prompt entry (POC "Simplified prompt catalog schema") to avoid versioning overhead now.
- **Cohort placeholder:** Treat any authenticated user as eligible while leaving a hook for later roster validation, mirroring the POC "cohort gate placeholder" direction.
- **Documentation last:** Update README + `.ai/test-plan.md` once the MVP slice stands up; avoid churn mid-build.

## Must-Haves vs. Nice-to-Haves
| Area | Must-Have (keep) | Nice-to-Have (defer) |
| --- | --- | --- |
| Feature gating | Middleware check for flag + role metadata guard | Feature analytics for rollout, per-env telemetry metrics |
| Supabase schema | `prompt_modules`, `prompt_lessons`, `prompts`, `prompt_favorites` | `prompt_versions`, `prompt_usage_logs`, enums, audit tables |
| Admin UI | Table view, edit/publish modal, status toggle | Markdown diffing, bulk publish, drafts filter presets |
| Learner UI | Module tabs, lesson select, prompt accordion, copy & favorite actions | Full-text search, skeleton loaders, localization banner |
| Telemetry | Console log stub when flag enabled | `prompt_usage_events` table + hook gate |
| Testing | Vitest for guards + API, Playwright happy-path | Edge-case Vitest, telemetry + localization suites |
| Documentation | README + `.ai/test-plan.md` update post-delivery | Dedicated module docs, diagrams, migration walkthroughs |

## Inline Schema & Data Contracts (No External Lookup Needed)
### Table Cheat Sheet
- **`prompt_modules`** — seeded list that mirrors the course outline.
  - Columns: `id uuid`, `name text`, optional `sort_order` (default 0), timestamps.
  - Index: `idx_prompt_modules_sort` on `sort_order` for stable tab ordering (lean but prevents reorder drift).
- **`prompt_lessons`** — lessons scoped to a module, also seeded.
  - Columns: `id uuid`, `module_id uuid FK prompt_modules`, `name text`, `sort_order`, timestamps.
  - Constraint: `unique(module_id, name)` to match planning guidance that lessons are stable and non-editable.
- **`prompts`** — single active record per lesson/module.
  - Columns: `id uuid`, `module_id`, `lesson_id`, `title`, `markdown_body`, `status text` (`draft`/`published`), `created_by uuid` (Supabase auth), `updated_at`.
  - Lean check constraint: `status in ('draft','published')` (replace later with enum when versioning lands).
  - Optional index: `idx_prompts_published_module_lesson` on `(status,module_id,lesson_id)` to speed learner queries.
- **`prompt_favorites`** — stores learner ↔ prompt relationship.
  - Composite primary key `(user_id, prompt_id)`.
  - Foreign keys to Supabase `auth.users` and `prompts` for cleanup.

### SQL Definition (Ready for One Migration)
```sql
create table prompt_modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_prompt_modules_sort on prompt_modules(sort_order);

create table prompt_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references prompt_modules(id) on delete cascade,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (module_id, name)
);
create index idx_prompt_lessons_module_sort on prompt_lessons(module_id, sort_order);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references prompt_modules(id) on delete cascade,
  lesson_id uuid references prompt_lessons(id) on delete set null,
  title text not null,
  markdown_body text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now()
);
create index idx_prompts_published on prompts(status, module_id, lesson_id);

create table prompt_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, prompt_id)
);
```
*Lean choices: no enums, no trigger-managed timestamps, no `prompt_versions` or telemetry tables until validation. Aligns with `Phase B – Prompt Catalog MVP` requirements.*

### Seeding Strategy
- Seed `prompt_modules`/`prompt_lessons` inside the migration (INSERT statements guarded by `if not exists`) so new environments come online instantly.
- Provide a one-off SQL insert block in the same migration for 2 exemplar prompts—matching the POC need for demo data—then delete/replace via admin UI.

## Lean API & UI Flow Snapshot (Embedded Context)
- **Admin APIs (`/api/prompt-manager/admin/*`):**
  - `POST /prompts` → create draft (requires flag + `prompt_role` in [`admin`,`moderator`]).
  - `PATCH /prompts/:id` → update fields or toggle status. Uses Supabase service key (POC "direct data access").
  - `GET /seed` optional helper returning seeded modules/lessons for UI selects.
- **Learner APIs (`/api/prompt-manager/*`):**
  - `GET /prompts?module=...&lesson=...` filters to `status='published'` using the index above.
  - `POST /favorites` / `DELETE /favorites/:id` persists user favorites; fallback to 409 → warn user.
- **UI Reuse Plan:** reuse Rules Builder table, drawer, and copy interaction to honor MVP guardrail "Reuse existing components". Favorites rely on local `useState` + optimistic update; no Zustand until duplication appears.
- **Routing:** Admin route at `/prompt-manager/admin`, learner route `/prompt-manager`. Feature flag guard sits in middleware + page-level loader to avoid hydration of hidden routes.

## Implementation Tracks (3 Parallelizable Slices)
1. **Track A – Access & Schema Bootstrapping**
   - Add env schema entries + feature flag guard (POC phase A).
   - Implement `ensurePromptAccess()` middleware helper reading `prompt_role` metadata.
   - Apply migration above; document Supabase command in README after completion.
   - Drop seed SQL file into `supabase/migrations/<timestamp>__prompt_manager_seed.sql` using the snippet here (no dependency on other docs).
2. **Track B – Admin & Learner Surfaces**
   - Admin page uses existing table component, inline modal for create/edit; publish button flips `status` via API.
   - Learner page reuses tab + select components, accordion list, copy + favorite actions.
   - Data fetching: Astro route loaders call Supabase via `fetch` using service role for admin, anon key for learner (still behind middleware).
3. **Track C – QA & Wrap-Up**
   - Vitest coverage: middleware guard, admin CRUD handler, learner list handler (mock Supabase).
   - Playwright scenario: admin creates prompt → toggles publish → learner filters + favorites → copy success.
   - Final documentation pass: README section "Prompt Manager POC", `.ai/test-plan.md` additions summarizing flows, log deferred work in `.ai/prompt-manager-plan.md` notes.

## Questions to Close Before Build
- Which `prompt_role` strings should map to admin vs. learner for the POC? (Needed to finalize middleware guard.)
- Do we seed demo prompts in migrations or via Supabase dashboard before demo? (Impacts developer onboarding.)
- Which environment holds the service role key for admin APIs during the POC? (Clarifies deployment risk.)
- Are we comfortable skipping RLS for the short-lived POC while using service role? (Decision affects follow-up hardening.)

## Decisions Required Up Front
- Approve the lean schema (columns + indexes) above so migration can land without rework.
- Confirm API route placement (`src/pages/api/prompt-manager/...`) vs. co-located feature folder to keep imports consistent.
- Decide how favorites errors surface to learners (toast vs. inline message) to avoid ambiguous UX.
- Agree on telemetry stub stance: console logging only, or ship the minimal Supabase table even if unused during demo.

## De-Scoped (Documented Deferrals)
- No roster validation, telemetry tables, version history, or localization enhancements; revisit with full architecture plan once POC validated.
- No Zustand store or React Query adoption—component state suffices until patterns stabilize.
- No advanced error boundaries or offline caching; fallback is a simple error message in both routes.

## Definition of Done
- Feature flag + middleware hide all prompt routes when disabled and enforce `prompt_role` rules when enabled.
- Admin can CRUD & publish prompts tied to seeded modules/lessons; learner sees only published prompts and can copy/favorite them with persistence.
- Supabase migration applied with seed data matching tables above; API endpoints backed by the lean schema respond successfully.
- Vitest + Playwright checks in Track C pass locally; README + `.ai/test-plan.md` updated to describe the MVP flow and known deferrals.
