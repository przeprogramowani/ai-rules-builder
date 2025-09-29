# Prompt Manager POC Plan (80/20)

## Objective
Ship a feature-flagged Prompt Manager proof of concept that exercises the core flow (admin curates prompts, member browses gated list) while deferring advanced workflows like version diffing, automated localization, and rich analytics. Deliver this slice in ~3 sprints to validate UX and data contracts before expanding to the full implementation plan.

## Guiding Constraints
- Keep everything behind `PROMPT_MANAGER_ENABLED` so partial work can deploy safely.
- Reuse existing Astro + Supabase patterns; avoid new infrastructure unless required.
- Store organization-scoped prompt collections exclusively in Supabase (no repository seeds).
- For the initial POC, restrict prompt access to Supabase users who are explicitly mapped to an organization membership record; seed only the launch cohort inside the `10xDevs` organization and block the remaining ~254 legacy accounts until they are assigned.
- Provide member copy-to-clipboard with formatting that behaves well in Cursor.
- Collect minimal anonymous telemetry (`prompt_id`, `organization_id`, `event_type`, `occurred_at`) while planning the hardened approach later.
- Keep the feature name `prompt-manager`; only the public-facing routes and APIs use `/prompts` naming.

## Scope Included in POC
- Feature flags, organization helpers, and route guards using Supabase user metadata (e.g., organization list + per-organization role for admin/member distinctions).
- Cohort gate placeholder that currently allows only authenticated users with a seeded organization membership (initially `10xDevs`) while keeping the hook for richer roster validation later.
- Simplified prompt catalog schema (single active version per prompt) stored entirely in Supabase with organization + collection scoping.
- Admin curation UI with list + edit/publish toggle scoped to active organization.
- Member list with organization selector, collection/segment filters, markdown rendering, copy-to-clipboard.
- Telemetry stub table and client hook gated by `PROMPT_USAGE_LOGGING_ENABLED` flag.
- Localization placeholder messaging while data remains Polish-only.

## Phase Breakdown

### Phase A – Flag & Access Seed (Sprint 1)
- Add `PROMPT_MANAGER_ENABLED`, `PROMPT_USAGE_LOGGING_ENABLED` to `featureFlags.ts`, configuration surfaces, and documentation (no env schema changes).
- Implement `useOrganizationAccess()` helper that reads organization memberships and per-organization role from Supabase user metadata.
- Wire Astro middleware to enforce feature flag and organization guard on `/prompts` routes. Cohort guard now enforces membership but still exposes a hook for richer roster validation in later iterations.
- Deliver Vitest coverage for helpers and middleware.

### Phase B – Prompt Catalog MVP (Sprint 2)
- Create migrations for `organizations`, `organization_members`, `prompt_collections`, `prompt_collection_segments`, `prompts` in Supabase (no repo-local seeds beyond initial inserts).
- Provide temporary admin-only script/API to seed baseline 10xDevs collections/segments directly into Supabase (read-only in UI).
- Implement admin APIs for create/edit/publish (single markdown field on `prompts`, `status` enum) scoped to the active organization.
- Ensure member API filters to published prompts per organization and uses placeholder cohort guard (allow all authenticated organization members for now).

### Phase C – Admin & Member UI Slice (Sprint 3)

- First: Member route `/prompts`: organization selector (default `10xDevs` if present), collection + segment filters, search by title, prompt detail drawer.
- Second: Admin route `/prompts/admin`: table view, edit modal (markdown textarea), publish toggle.
- Add copy-to-clipboard and download action with formatting that avoids Cursor issues (e.g., plain text copy, sanitized markdown).
- Display localization banner (“PL content, translations coming soon”).

### Phase D – Telemetry Stub & QA (Sprint 3)
- Create `prompt_usage_events` table storing `prompt_id`, `organization_id`, `event_type`, `occurred_at` only; gate inserts behind `PROMPT_USAGE_LOGGING_ENABLED`.
- Frontend hook fires `view` and `download` events when enabled; fallback to console log otherwise.
- Add Vitest specs for telemetry hook toggles and Playwright smoke test covering admin publish → member copy/download flow across organization switch.
- Update README/docs with POC setup, limitations, and next steps.

## Deferred Until Post-POC
- Build-time external roster sync (Google Sheets or CRM) run on merge to `master`.
- Automated nightly sync & failure auditing.
- Version history, diffing, bulk publish.
- Anonymous telemetry hardening (opt-out, metadata hashing, dashboards).
- Automated localization pipeline, language switcher, offline access.

## Risks & Mitigations
- Without richer roster validation, early testers might see prompts unexpectedly—limit feature flag access to trusted organizations and monitor membership records.
- Lack of versioning means edits overwrite drafts: communicate constraint and limit pilot to controlled admins.
- Copy-to-clipboard reliability: test across Cursor/Windsurf early to catch formatting issues.
