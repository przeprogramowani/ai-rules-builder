# Prompt Manager Phase 1 – Rollout Notes

## Flag Overview
- **Flag key:** `PROMPT_MANAGER_ENABLED` (internal constant).
- **Environment toggle:** `PUBLIC_PROMPT_MANAGER_ENABLED` (`true`|`false`|`1`|`0` case-insensitive).
- **Local/testing override:** `PROMPT_MANAGER_ENABLED` (same truthy/falsey parsing) can be used when a non-public variable is required (e.g., Vitest, local CLI scripts).
- **Default:** `false` across `local`, `integration`, and `prod` environments; requires explicit opt-in.
- **Fallback:** If override is missing or invalid the feature remains hidden.

## How to Toggle
1. Local development
   - Start via `PUBLIC_PROMPT_MANAGER_ENABLED=true npm run dev` to surface `/prompts` routes.
   - Remove the override (or set to `false`) to return to the disabled state without code changes.
2. Integration / staging
   - Add `PUBLIC_PROMPT_MANAGER_ENABLED=true` in the environment configuration (Cloudflare/CI secrets) and redeploy workflow picks up the toggle at runtime.
   - Document the change in the release checklist; default should remain `false` until membership data is seeded.
3. Production
   - Keep `false` until security sign-off post Phase 2 migrations.
   - When enabling, double check seeded `organization_members` rows for launch cohort only.

## Access Expectations
- Middleware enforces flag check **and** organization membership before `/prompts` or `/prompts/admin` render.
- Non-members or users hitting the routes while the flag is off receive `404` responses (no data prefetch).
- `/prompts/admin` additionally requires `role === 'admin'`; members are redirected to `/prompts`.
- Middleware stores parsed membership details on `locals.promptManager` for downstream use.

## Operational Notes
- Logging: invalid metadata structures surface via `console.debug` only in `local` environment to aid QA without noisy production logs.
- Tests: `npm run test` now verifies flag overrides, metadata parsing, and middleware gating; run before toggling in shared environments.
- Known limitation: organization data still sourced from Supabase metadata placeholders until Phase 2 migrations land.
