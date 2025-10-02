# Prompt Manager POC Plan (80/20)

## Objective
Ship a feature-flagged Prompt Manager proof of concept that exercises the core flow (admin curates prompts, member browses gated list) while deferring advanced workflows like version diffing, automated localization, and rich analytics. Deliver this slice in ~3 sprints to validate UX and data contracts before expanding to the full implementation plan.

## Guiding Constraints
- Keep everything behind `PROMPT_MANAGER_ENABLED` so partial work can deploy safely.
- Reuse existing Astro + Supabase patterns; avoid new infrastructure unless required.
- Store organization-scoped prompt collections exclusively in Supabase (no repository seeds).
- For the initial POC, restrict prompt access to Supabase users who are explicitly mapped to an organization membership record; seed only the launch cohort inside the `10xDevs` organization and block the remaining ~254 legacy accounts until they are assigned.
- Provide member copy-to-clipboard with formatting that behaves well in Cursor.
- Keep the feature name `prompt-manager`; only the public-facing routes and APIs use `/prompts` naming.

## Scope Included in POC
- Feature flags, organization helpers, and route guards using Supabase user data (e.g., organization list + per-organization role for admin/member distinctions).
- Cohort gate placeholder that currently allows only authenticated users with a seeded organization membership (initially `10xDevs`) while keeping the hook for richer roster validation later.
- Simplified prompt catalog schema (single active version per prompt) stored entirely in Supabase with organization + collection scoping.
- Admin curation UI with list + edit/publish toggle scoped to active organization.
- Member list with organization selector, collection/segment filters, markdown rendering, copy-to-clipboard.
- Localization placeholder messaging while data remains Polish-only.

## Phase Breakdown

## Guiding Principles
- Deliver value in thin vertical slices that can be demoed and validated quickly.
- Keep feature flags around major surfaces so incomplete work can ship disabled.
- Reuse existing infrastructure (Supabase auth, feature flags, markdown rendering) before building new systems.
- Maintain localization requirements from the outset of relevant slices.
- Model organizations and multi-organization memberships early so prompt collections stay organization-agnostic.
- Keep the feature name `prompt-manager` in code/docs even though user-facing routes live under `/prompts`.

## Phase 1 – Feature Flag & Access Foundations
**Goal:** Gate future work safely and prep organization-aware identity checks.
- Add `PROMPT_MANAGER_ENABLED` to `featureFlags.ts`, configuration surfaces, and documentation (no env schema changes).
- Implement helper utilities `isPromptManagerEnabled()` and `getUserOrganizations()` that read Supabase tables, defaulting to organization `10xDevs` when present.
- Add access guard middleware that requires authentication and at least one organization membership (defaulting to `10xDevs`) before reaching `/prompts` routes, returning a "request access" state for everyone else.
- Write minimal tests for feature flag utilities, organization parsing, and middleware edge cases.
- Exit criteria: Flags controllable per environment, guard helpers return expected results in unit tests, middleware blocks unauthenticated/zero-organization users.

## Phase 2 – Organization Membership Foundation
**Goal:** Persist organizations and flexible user assignments.
- Create Supabase migrations for `organizations` and `organization_members`, limiting roles to `member` and `admin`; defer dedicated RLS until after the POC.
- Seed default organization `10xDevs` and associate only the curated launch cohort (subset of the 254 existing users) through manual SQL, leaving everyone else without membership until explicitly approved.
- Extend helper utilities to hydrate active organization context on session load (respect query param switch).
- Exit criteria: Authenticated user with organization membership, admin flags respected per organization.

## Phase 3 – Prompt Collection Schema & Admin APIs
**Goal:** Persist organization-scoped prompt collections with a single active version per prompt.
- Implement migrations for `prompt_collections`, `prompt_collection_segments` (generic grouping instead of modules/lessons), `prompts`, and `prompt_favorites`, seeding baseline 10xDevs collections/segments/prompts.
- Skip `prompt_versions` for the POC; rely on the `status` field and simple draft→publish transitions.
- Build server-side utilities/APIs (Astro endpoints) for CRUD operations restricted to organization admins using middleware checks rather than RLS.
- Exit criteria: Admin-only API supports create draft → publish scoped to an organization/collection, migrations pass tests, and middleware-gated access behaves as expected in local runs.

## Phase 4 – Member Experience Slice & Member APIs ✅ **COMPLETED**
**Goal:** Provide members with gated prompt discovery.
- ✅ Build member-facing routes: organization selector (default 10xDevs), collection and segment filters, search/filter bar, prompt detail modal/page.
- ✅ Enforce access guard via middleware using organization membership checks alongside the feature flag.
- ✅ Ensure graceful fallback states for unauthorized users, users without organization membership, and when flag disabled.
- ✅ Exit criteria: Authenticated member with organization membership can switch organizations, browse, search, view markdown, copy and download prompts end-to-end.
- ✅ Build server-side utilities/APIs (Astro endpoints) for CRUD operations restricted to organization members using middleware checks rather than RLS.
- ⚠️ Favorites toggle deferred to future phase.

**Implemented Components:**
- Generic UI components: `SearchBar`, `Dropdown`, `CopyDownloadActions`, `MarkdownRenderer`
- Store: `promptsStore` with organization, collection, segment, and prompt management
- Member API routes: `/api/prompts`, `/api/prompts/[id]`, `/api/prompts/collections`, `/api/prompts/collections/[id]/segments`
- Service layer: `listPublishedPrompts()`, `getPublishedPrompt()` for member-safe queries
- UI components: `OrganizationSelector`, `PromptFilters`, `PromptsList`, `PromptCard`, `PromptDetail`, `PromptsBrowser`
- Pages: `/prompts/index.astro`, `/prompts/request-access.astro`
- Middleware: Already exists with full prompt manager support (no changes needed)

## Phase 5 – Admin Experience Slice
**Goal:** Enable admins to curate and publish prompts iteratively.
- Create admin-only UI route guarded by feature flag and access check, surfaced under `/prompts/admin` with organization selector.
- Implement draft list view, editor form (Markdown), and a simple publish toggle scoped to the active organization (no diffing or bulk queue in the POC).
- Connect UI to APIs with error handling; add optimistic updates or revalidation.
- Exit criteria: Admin walkthrough (switch organization, draft create, publish) demo-ready behind flag.

## Phase 6 – Localization
**Goal:** Support storing and viewing prompt content in both Polish and English.
- Extend database schema to store separate content for Polish and English versions of each prompt.
- Update the Admin UI to include separate text areas for admins to manually enter or edit content for both languages (toggle language via switch or dropdown)
- Add a language switcher in the Member UI for users to toggle between Polish and English prompt versions (if both versions are available)
- Exit criteria: Admins can create and edit prompts in both Polish and English. Members can view prompts and switch between available languages.


## Deferred Until Post-POC
- Build-time external roster sync (Google Sheets or CRM) run on merge to `master`.
- Automated nightly sync & failure auditing.
- Version history, diffing, bulk publish.
- Anonymous telemetry hardening (opt-out, metadata hashing, dashboards).
- Language switcher improvements, offline access.

## Risks & Mitigations
- Without richer roster validation, early testers might see prompts unexpectedly—limit feature flag access to trusted organizations and monitor membership records.
- Lack of versioning means edits overwrite drafts: communicate constraint and limit pilot to controlled admins.
- Copy-to-clipboard reliability: test across Cursor/Windsurf early to catch formatting issues.
