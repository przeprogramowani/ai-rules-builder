# Prompt Manager Iterative Implementation Plan

## Guiding Principles
- Deliver value in thin vertical slices that can be demoed and validated quickly.
- Keep feature flags around major surfaces so incomplete work can ship disabled.
- Reuse existing infrastructure (Supabase auth, feature flags, markdown rendering) before building new systems.
- Maintain anonymous telemetry and localization requirements from the outset of relevant slices.
- Model organizations and multi-organization memberships early so prompt collections stay organization-agnostic.
- Keep the feature name `prompt-manager` in code/docs even though user-facing routes live under `/prompts`.

## Phase 1 – Feature Flag & Access Foundations
**Goal:** Gate future work safely and prep organization-aware identity checks.
- Add `PROMPT_MANAGER_ENABLED` and `PROMPT_USAGE_LOGGING_ENABLED` to `featureFlags.ts`, configuration surfaces, and documentation (no env schema changes).
- Implement helper utilities `isPromptManagerEnabled()` and `getUserOrganizations()` that read Supabase metadata, defaulting to organization `10xDevs` when present.
- Add access guard middleware that requires authentication and at least one organization membership (defaulting to `10xDevs`) before reaching `/prompts` routes, returning a "request access" state for everyone else.
- Write minimal tests for feature flag utilities, organization parsing, and middleware edge cases.
- Exit criteria: Flags controllable per environment, guard helpers return expected results in unit tests, middleware blocks unauthenticated/zero-organization users.

## Phase 2 – Organization Membership Foundation
**Goal:** Persist organizations and flexible user assignments.
- Create Supabase migrations for `organizations` and `organization_members`, limiting roles to `member` and `admin`; defer dedicated RLS until after the POC.
- Seed default organization `10xDevs` and associate only the curated launch cohort (subset of the 254 existing users) through manual SQL or admin UI script, leaving everyone else without membership until explicitly approved.
- Extend helper utilities to hydrate active organization context on session load (respect query param switch).
- Exit criteria: Authenticated user with organization membership can switch organizations, admin flags respected per organization.

## Phase 3 – Prompt Collection Schema & Admin APIs
**Goal:** Persist organization-scoped prompt collections with a single active version per prompt.
- Implement migrations for `prompt_collections`, `prompt_collection_segments` (generic grouping instead of modules/lessons), `prompts`, and `prompt_favorites`, seeding baseline 10xDevs collections/segments/prompts.
- Skip `prompt_versions` for the POC; rely on the `status` field and simple draft→publish transitions.
- Build server-side utilities/APIs (Astro endpoints) for CRUD operations restricted to organization admins using middleware checks rather than RLS.
- Exit criteria: Admin-only API supports create draft → publish scoped to an organization/collection, migrations pass tests, and middleware-gated access behaves as expected in local runs.

## Phase 4 – Member Experience Slice
**Goal:** Provide members with gated prompt discovery.
- Build member-facing routes: organization selector (default 10xDevs), collection and segment filters, search/filter bar, prompt detail modal/page, favorites toggle.
- Enforce access guard via middleware using organization membership checks alongside the feature flag.
- Ensure graceful fallback states for unauthorized users, users without organization membership, and when flag disabled.
- Exit criteria: Authenticated member with organization membership can switch organizations, browse, search, view markdown, copy and download prompts end-to-end.

## Phase 5 – Admin Experience Slice
**Goal:** Enable admins to curate and publish prompts iteratively.
- Create admin-only UI route guarded by feature flag and access check, surfaced under `/prompts/admin` with organization selector.
- Implement draft list view, editor form (Markdown), and a simple publish toggle scoped to the active organization (no diffing or bulk queue in the POC).
- Connect UI to APIs with error handling; add optimistic updates or revalidation.
- Exit criteria: Admin walkthrough (switch organization, draft create, publish) demo-ready behind flag.

## Phase 6 – Telemetry & Opt-Out (Anonymous)
**Goal:** Capture anonymous usage while respecting opt-out.
- Implement `prompt_usage_logs` table without user identifiers; store hashed viewport session ID or prompt IDs only.
- Add client telemetry service honoring opt-out toggles; store opt-out preference server-side keyed by user id while logs remain anonymous (e.g., link via hash + salt stored server-side, discard raw user id).
- Update admin analytics stubs/tools for aggregated anonymous reporting.
- Exit criteria: Telemetry events recorded without user PII, opt-out flow verified, unit/integration tests cover logging decisions.

## Phase 7 – Localization Pipeline
**Goal:** Support Polish ↔ English (and future languages) prompt content.
- Design translation workflow using Codex CLI + Context7 integration; document pipeline in `docs/prompt-manager/localization.md`.
- Extend schema/UI to store language metadata per version and provide language switcher for members.
- Automate translation job for new drafts (manual trigger) with status indicators in admin UI.
- Exit criteria: Prompt versions can store multiple locales, admin can request automated translation, member can toggle language, tests validate fallback behavior.

## Phase 8 – Testing & QA Hardening
**Goal:** Ensure reliability across slices.
- Expand Vitest suites for helpers, stores, and API handlers; leverage MSW for Supabase responses.
- Add Playwright E2E scenarios: admin publishing flow (including bulk publish), member search/favorite/opt-out, localization toggle.
- Update `.ai/test-plan.md` with new coverage; ensure CI passing.
- Exit criteria: Test plan reflects new scenarios, CI pipeline green with added tests.

## Phase 9 – Documentation & Rollout
**Goal:** Prepare teams for launch and staged rollout.
- Update README and docs module with setup, feature flags, and workflows.
- Produce runbooks: organization roster management (manual tooling, SQL seeds), telemetry privacy statement, localization operations.
- Coordinate staged rollout: enable flags in staging, run pilot, capture feedback loop, plan production enablement.
- Exit criteria: Documentation reviewed, pilot success metrics captured, go/no-go checklist approved.

## Iteration & Review Cadence
- Hold weekly check-ins with stakeholders to review phase progress, demo working slices, and prioritize subsequent backlog items.
- Adjust phases as feedback arrives; revisit telemetry/localization requirements before implementation if constraints change.

## Dependencies & Risks Snapshot
- Dependence on Supabase organization metadata accuracy; document manual override path when memberships drift.
- Anonymous telemetry may limit certain analytics; ensure stakeholders accept aggregated-only insights.
- Localization automation relies on Codex CLI + Context7 availability; define fallback manual translation path.
- Bulk publish UX could add complexity—consider feature flagging separately if timeline tight.

## Next Immediate Steps
1. Share this plan for stakeholder approval.
2. Once approved, schedule Phase 0 tasks (metadata documentation, diagrams).
3. Prepare backlog tickets aligned with phases for implementation tracking.
