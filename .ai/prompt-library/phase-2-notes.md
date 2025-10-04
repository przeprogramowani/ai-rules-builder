# Prompt Manager Phase 2 – Rollout Notes

## Migration Checklist
- Merge and deploy the `20250413093000_prompt_manager_orgs.sql` migration to all environments via Supabase CLI (`supabase db push`) or the existing CI migration step.
- Confirm the following tables exist with expected schema:
  - `organizations` (uuid PK, unique slug, timestamps).
  - `organization_members` (composite PK `(organization_id, user_id)`, role check constraint, index on `user_id`).
- Capture a snapshot of the schema after deployment for the security review package (no RLS yet by design).

## Seeding Organization Memberships
- The migration seeds the `10xDevs` organization automatically.
- Replace the placeholder emails in the `launch_members` CTE inside the migration with the vetted launch roster before running in shared environments, or execute an updated insert:
  ```sql
  WITH launch_members(email, role) AS (
    VALUES
      ('member@example.com', 'member'),
      ('admin@example.com', 'admin')
  ), matched_users AS (
    SELECT users.id, launch_members.role
    FROM auth.users AS users
    JOIN launch_members ON users.email = launch_members.email
  ), target_org AS (
    SELECT id FROM organizations WHERE slug = '10xdevs'
  )
  INSERT INTO organization_members (organization_id, user_id, role)
  SELECT target_org.id, matched_users.id, matched_users.role
  FROM target_org
  JOIN matched_users ON TRUE
  ON CONFLICT DO NOTHING;
  ```
- After seeding, verify membership counts:
  ```sql
  SELECT o.slug, m.role, COUNT(*)
  FROM organization_members m
  JOIN organizations o ON o.id = m.organization_id
  GROUP BY 1, 2
  ORDER BY 1, 2;
  ```

## Type Regeneration
- After applying migrations locally run the Supabase CLI type generation (from repo root):
  ```bash
  supabase gen types typescript --project-ref "$SUPABASE_PROJECT_REF" \
    --schema public > src/db/database.types.ts
  ```
- Re-run `npm run test` to ensure the regenerated types compile and pass linting.

## Application Verification
- Start the app with `PUBLIC_PROMPT_MANAGER_ENABLED=true npm run dev`.
- Sign in as seeded member and confirm `/prompts` loads; inspect DevTools network response to ensure no metadata parsing errors.
- Append `?organization=<slug>` to force active organization selection; invalid slugs should fall back to the first membership without errors.
- Sign in as admin and open `/prompts/admin`; downgrade role to `member` and verify middleware redirect to `/prompts?organization=<slug>`.
- Remove membership row and refresh the page; expect 404 response confirming Supabase-backed enforcement.

## Operational Notes
- Flag remains disabled by default in `integration` and `prod`; enable only after verifying seeded roster and manual QA.
- Keep a checklist item in the release plan to remove placeholder emails from the migration before promotion.
- Security review remains pending until RLS policies ship in later phases; communicate that access continues to rely on middleware checks.
