# Prompt Manager Stakeholder Brief

## Purpose
This brief captures the intended scope, goals, and alignment points for the Prompt Manager initiative so product and course stakeholders can confirm priority, validate assumptions, and highlight remaining gaps before engineering work proceeds.

## Scope Overview
- Deliver gated prompt libraries aligned with 10xDevs course modules and lessons inside 10xRules.ai.
- Require authenticated Supabase users whose identities are validated against the Circle.so roster synced via Google Sheets.
- Provide learner-facing search, filtering, prompt detail, and bookmarking experiences that respect telemetry opt-out settings.
- Provide admin workflows to curate, version, publish, and soft-delete prompts without redeploying code.
- Ship with feature flags, Supabase Row Level Security (RLS), schema migrations, automated tests, and documentation updates consistent with existing engineering practices.

## Key Outcomes
- Learners discover, copy, and favorite the right prompts for their active lessons.
- Admins can draft edits, review diffs, and publish versions with auditability.
- Access control reliably prevents non-cohort users from viewing prompt content.
- Telemetry captures prompt usage with graceful degradation when users opt out.

## Assumptions Status
1. **Circle.so roster via Google Sheets export** — Confirmed: sheet will contain learner emails suitable for validation.
2. **Admin identity via Supabase metadata** — Confirmed: leverage `auth.users` metadata; review Context7 Supabase guidance to document exact claim structure.
3. **Markdown rendering reuse** — Confirmed: stay on existing remark/rehype pipeline before considering custom renderer work.
4. **In-product telemetry opt-out** — Confirmed as "nice to have" for MVP scope tracking; note dependency on anonymous logging decision.
5. **Feature flag rollout** — Confirmed: `PROMPT_MANAGER_ENABLED` (and related flags) will gate release per environment.

## Stakeholder Decisions & Inputs
1. **Roster freshness** — Manual reload on deploy is acceptable; expected roster changes <3 times per month.
2. **Content governance** — Course teachers (superadmins) own moderation; add moderator role tier for partner staff and freelancers.
3. **Telemetry privacy** — Usage logging must be 100% anonymous (no user identifiers persisted).
4. **Publishing workflow** — Bulk publish support is desired in the MVP.
5. **Offline/export access** — Not required for this phase.
6. **Localization** — Prompts must support localization; current catalog is mostly Polish and should be translated automatically via Codex CLI action that leverages Context7.

## Follow-Up Actions
- Document Supabase metadata expectations (admin and moderator flags) referencing Context7 documentation.
- Adjust telemetry design to ensure anonymous aggregation while honoring opt-out UX.
- Extend publishing plan to cover bulk operations and moderator workflows.
- Capture localization pipeline details (Codex CLI + Context7) in implementation notes and test plan.

Once stakeholders review and acknowledge this briefing, engineering can proceed with schema finalization, sync implementation, and feature flag wiring.
