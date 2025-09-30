# Phase 1 – Feature Flag & Access Foundations Implementation Plan

## Goal & Context
- Enable controlled rollout of the Prompt Manager behind the `PROMPT_MANAGER_ENABLED` flag while enforcing organization-aware access, satisfying @.ai/prompt-manager/prd.md stories US-001 (flag control) and US-002 (membership validation).
- Aligns with POC guardrails: flag-first rollout, reuse existing Astro + Supabase patterns, and default organization focus on `10xDevs` cohort.

## Scope (Included / Deferred)
- **Included:** feature flag wiring, Supabase metadata helpers, middleware gating, fallback UX state, unit tests, flag documentation updates.
- **Deferred:** Supabase schema migrations (Phase 2), UI changes beyond access state messaging, Playwright coverage (lands in later phases), telemetry hooks.

## Workstream Breakdown

### 1. Feature Flag Wiring
- Audit existing flag system in `src/features/featureFlags.ts` (or equivalent) to confirm pattern for new boolean flags.
- Add `PROMPT_MANAGER_ENABLED` constant with default `false`; expose through existing configuration surfaces without altering env schema.
- Update any server/client flag consumers (e.g., feature-flag hook, layout conditional) to recognize the new flag key.
- Document toggle expectations for local/integration/prod in `.ai/status` or ops checklist so environments can flip safely.

### 2. Access Helper Utilities
- Define TypeScript helpers:
  - `isPromptManagerEnabled(envFlags)` – returns boolean gating entry points.
  - `getUserOrganizations(session)` – parses Supabase users data into `{ id, role }` tuples, defaulting to `10xDevs` when membership present.
  - `hasPromptManagerAccess(session)` – convenience predicate requiring at least one organization membership; reuse across middleware/tests.
- Ensure helpers gracefully handle missing metadata, malformed roles, or multiple organizations (for future phases) with clear return values and typed errors.
- Add lightweight logging or debug hooks (behind existing logger) for unexpected membership shapes to aid QA without noisy logs.

### 3. Middleware & Route Guarding
- Update Astro middleware (likely `src/middleware/index.ts`) to:
  - Short-circuit `/prompts` and `/prompts/admin` routes when flag disabled (render "request access" state or redirect per PRD acceptance criteria).
  - Require authenticated Supabase session; route unauthenticated users to existing login flow.
  - Validate organization membership + role: allow any member for `/prompts`, restrict `/prompts/admin` to `admin` role (prepping for Phase 5).
- Introduce shared response helpers for access-denied vs. flag-disabled states to keep messaging consistent and reusable by future UI slices.
- Confirm middleware integration does not pre-fetch prompt data when guard fails to avoid leaking information.

### 4. Testing & QA Hooks
- Write Vitest suites covering:
  - Flag utility truth-table (env overrides, disabled default).
  - `getUserOrganizations()` metadata parsing (single org, multiple, malformed, none).
  - Middleware behaviour for key paths: unauthenticated redirect, no membership fallback message, admin gating.
- Add fixtures or mocks for Supabase session objects representing member/admin/unauthorized cases; reuse across tests to seed later phases.
- Update `.ai/prompt-manager/test-plan.md` with Phase 1 unit scenarios and manual verification checklist for toggling flag per environment (defer e2e until Phase 4/5).

### 5. Operational & Documentation Tasks
- Capture runbook notes for enabling the flag (env var name, default) in .ai/prompt-manager/phase-1-notes.md; highlight that Phase 1 ships with flag off by default.

## Delivery Sequencing
1. Feature flag wiring (Workstream 1) – unblockable prerequisite for all guarded logic.
2. Implement helpers (Workstream 2) – build on flag scaffolding; merge with tests where possible.
3. Integrate middleware (Workstream 3) – leverage helpers; include initial fallback UI state.
4. Finalize tests + docs (Workstream 4 & 5) – ensures regression coverage and operational clarity before flag flip.

## Dependencies & Coordination
DR1: Requires existing Supabase auth session retrieval pipeline; confirm helper access to session data in middleware context.
D1: Auth session retrieval pipeline is already in place.
DR2: Need clarity on where organization metadata lives (Supabase user app_metadata vs. separate table) to shape helper parsing; coordinate with data team if schema differs from assumption.
D2: Organization metadata lives in separate tables as described in @schema-proposal.md
DR3: Ensure security review acknowledges temporary lack of RLS (per POC decision) but confirms middleware sufficiency for Phase 1.
D3: Security review acknowledges temporary lack of RLS (per POC decision) but confirms middleware sufficiency for Phase 1.

## Exit Criteria (Definition of Done)
- `PROMPT_MANAGER_ENABLED` flag toggle hides/shows `/prompts` and `/prompts/admin` without code redeploy.
- Middleware prevents access for unauthenticated or non-member users, returning 404 per @.ai/prompt-manager/prd.md.
- Unit tests green for flag utilities, organization parsing, and middleware guard paths.
- Documentation updated with flag usage + manual QA checklist; stakeholders briefed on rollout procedure.

## Follow-On Actions (Post-Phase 1)
- Implement Supabase `organizations` + `organization_members` migrations and extend helpers to query live tables (Phase 2).
- Hook middleware into new data sources and expand Playwright coverage once UI slices land (Phases 3–5).
