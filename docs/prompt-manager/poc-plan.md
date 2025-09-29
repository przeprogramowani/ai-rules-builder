# Prompt Manager POC Plan (80/20)

## Objective
Ship a feature-flagged Prompt Manager proof of concept that exercises the core flow (admin curates prompts, learner browses gated list) while deferring advanced workflows like version diffing, automated localization, and rich analytics. Deliver this slice in ~3 sprints to validate UX and data contracts before expanding to the full implementation plan.

## Guiding Constraints
- Keep everything behind `PROMPT_MANAGER_ENABLED` so partial work can deploy safely.
- Reuse existing Astro + Supabase patterns; avoid new infrastructure unless required.
- Store modules, lessons, and prompts exclusively in Supabase (no repository seeds).
- For the initial POC, treat every authenticated Supabase account as cohort-eligible; defer Google Sheets roster enforcement to a later iteration triggered on merge to `master`.
- Provide learner copy-to-clipboard with formatting that behaves well in Cursor.
- Collect minimal anonymous telemetry (prompt_id, event_type, occurred_at) while planning the hardened approach later.

## Scope Included in POC
- Feature flags, role helpers, and route guards using Supabase user metadata (e.g., `prompt_role` for admin/moderator/learner distinctions).
- Cohort gate placeholder that currently allows all authenticated users but is structured so roster checks can be slotted in later.
- Simplified prompt catalog schema (single active version per prompt) stored entirely in Supabase.
- Admin curation UI with list + edit/publish toggle (no diffing/bulk flows yet).
- Learner list with module/lesson filters, favorites, markdown rendering, copy-to-clipboard.
- Telemetry stub table and client hook gated by `PROMPT_USAGE_LOGGING_ENABLED` flag.
- Localization placeholder messaging while data remains Polish-only.

## Phase Breakdown

### Phase A – Flag & Access Seed (Sprint 1)
- Add `PROMPT_MANAGER_ENABLED`, `PROMPT_USAGE_LOGGING_ENABLED` to env schema, config, and documentation.
- Implement `usePromptRoles()` helper that reads `prompt_role` from Supabase user metadata to distinguish admins, moderators, and learners.
- Wire Astro middleware to enforce feature flag and role guard on `/prompt-manager` routes. Cohort guard returns true for now but exposes hook for future roster validation.
- Deliver Vitest coverage for helpers and middleware.

### Phase B – Prompt Catalog MVP (Sprint 2)
- Create migrations for `prompt_modules`, `prompt_lessons`, `prompts`, `prompt_favorites` in Supabase (no repo-local seeds).
- Provide temporary admin-only script/API to seed baseline modules/lessons directly into Supabase (read-only in UI).
- Implement admin APIs for create/edit/publish (single markdown field on `prompts`, `status` enum).
- Ensure learner API filters to published prompts and uses placeholder cohort guard (allow all for now).

### Phase C – Admin & Learner UI Slice (Sprint 3)
- Admin route `/prompt-manager/admin`: table view, edit modal (markdown textarea), publish toggle, role-based access (admins/moderators).
- Learner route `/prompt-manager`: module tabs (from Supabase), lesson dropdown, search by title, prompt detail drawer.
- Add favorites button (Supabase-backed) and copy-to-clipboard action with formatting that avoids Cursor issues (e.g., plain text copy, sanitized markdown).
- Display localization banner (“PL content, translations coming soon”).

### Phase D – Telemetry Stub & QA (Sprint 3)
- Create `prompt_usage_events` table storing `prompt_id`, `event_type`, `occurred_at` only; gate inserts behind `PROMPT_USAGE_LOGGING_ENABLED`.
- Frontend hook fires `view` and `favorite` events when enabled; fallback to console log otherwise.
- Add Vitest specs for telemetry hook toggles and Playwright smoke test covering admin publish → learner copy/favorite flow.
- Update README/docs with POC setup, limitations, and next steps.

## Deferred Until Post-POC
- Build-time Google Sheets roster sync run on merge to `master`.
- Automated nightly sync & failure auditing.
- Version history, diffing, bulk publish, moderator workflow UI refinements.
- Anonymous telemetry hardening (opt-out, metadata hashing, dashboards).
- Automated localization pipeline, language switcher, offline access.

## Risks & Mitigations
- Without roster validation, early testers might see prompts unexpectedly—limit feature flag access to trusted cohort.
- Lack of versioning means edits overwrite drafts: communicate constraint and limit pilot to controlled admins.
- Copy-to-clipboard reliability: test across Cursor/Windsurf early to catch formatting issues.

## Immediate Next Steps
1. Confirm Supabase metadata structure for `prompt_role` (values, default) and document it.
2. Create tickets aligned to Phases A–D and schedule sprint demos per phase.
3. Plan follow-up story to reintroduce roster sync once POC validated.
