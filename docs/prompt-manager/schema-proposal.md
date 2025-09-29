# Prompt Manager Schema Proposal

## Overview
This document outlines the database additions required to support the Prompt Manager initiative. The schema is intended for implementation via Supabase migrations and conforms to `.ai/db-migrations.md` guidelines.

## Core Catalog Tables

### `prompt_modules`
Stores the static list of 10xDevs modules.
- `id uuid primary key default gen_random_uuid()`
- `slug text unique not null`
- `title text not null`
- `description text`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**Indexes**: unique on `slug` (implicit), btree on `sort_order`.

**RLS**: Enabled. Read-only for `authenticated` role. Insert/update/delete restricted to service role.

### `prompt_lessons`
Seeded lessons linked to modules.
- `id uuid primary key default gen_random_uuid()`
- `module_id uuid references prompt_modules(id) on delete cascade`
- `slug text not null`
- `title text not null`
- `description text`
- `sort_order integer not null default 0`
- `created_at`, `updated_at` timestamps.

**Indexes**: unique on `(module_id, slug)`; btree on `sort_order` per module.

**RLS**: Same as `prompt_modules`.

## Prompt Content Tables

### `prompts`
Represents the learner-visible prompt entry with current published version pointer.
- `id uuid primary key default gen_random_uuid()`
- `module_id uuid not null references prompt_modules(id)`
- `lesson_id uuid references prompt_lessons(id)`
- `title text not null`
- `status text not null check (status in ('draft','published','archived'))`
- `is_deleted boolean not null default false`
- `current_version_id uuid references prompt_versions(id)`
- `created_by uuid references auth.users(id)`
- `created_at`, `updated_at` timestamptz defaults
- `published_at timestamptz`
- `archived_at timestamptz`

**Indexes**: `(module_id, lesson_id, status)` composite, `current_version_id` unique where not null (partial index), `published_at`.

**RLS**:
- Learners (`authenticated` with cohort flag): select where `status = 'published'` and `is_deleted = false`.
- Admins: full CRUD (policy using `request.jwt.claims->>'role' = 'admin'` or metadata flag).
- Disable `anon` access.

### `prompt_versions`
Immutable content revisions.
- `id uuid primary key default gen_random_uuid()`
- `prompt_id uuid references prompts(id) on delete cascade`
- `version_number integer not null`
- `markdown_body text not null`
- `changelog text`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz not null default now()`
- `published boolean not null default false`
- `published_at timestamptz`

**Indexes**: unique on `(prompt_id, version_number)`, partial on `(prompt_id)` where `published = true` for fast lookup.

**RLS**: learners can select where `published = true` and parent prompt not deleted; admins full access.

### `prompt_favorites`
Cross-device favorites.
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id)`
- `prompt_id uuid references prompts(id)`
- `created_at timestamptz not null default now()`

**Indexes**: unique on `(user_id, prompt_id)`; foreign key cascades.

**RLS**: owner read/write; block others.

### `prompt_usage_logs`
Telemetry with opt-out.
- `id bigint generated always as identity primary key`
- `user_id uuid references auth.users(id)` nullable when opt-out (store null)
- `prompt_id uuid references prompts(id)`
- `action text check (action in ('view','copy','favorite','unfavorite'))`
- `occurred_at timestamptz not null default now()`
- `metadata jsonb`

**Indexes**: btree on `prompt_id`, partial on `user_id` where not null, brin on `occurred_at` for retention queries.

**RLS**: inserts allowed when user not opted out (checked via function). Select limited to admins; learners only retrieve own rows when telemetry enabled.

## Cohort Access Tables

### `course_cohort_members`
- `id uuid primary key default gen_random_uuid()`
- `email citext not null`
- `cohort_id text not null`
- `status text not null check (status in ('active','inactive'))`
- `source_hash text not null`
- `synced_at timestamptz not null default now()`
- `revoked_at timestamptz`
- `first_name`, `last_name` text
- `circle_member_id text`

**Indexes**: unique on `(email, cohort_id)`; partial index on `status` for active lookups.

**RLS**: service role only for writes; `authenticated` can select where `auth.email() = email` to confirm membership (optional), admins full read.

### `course_cohort_sync_runs`
Observability for sync job (from Step 2).
- `id bigint generated always as identity primary key`
- `run_id uuid not null`
- `started_at`, `completed_at` timestamptz
- `status text check (status in ('success','failed','partial'))`
- `total_rows integer`
- `inserted_count integer`
- `updated_count integer`
- `deactivated_count integer`
- `error_rows jsonb`
- `notes text`

**Indexes**: `run_id` unique, `completed_at` brin.

**RLS**: admin/service role read-only. Learners no access.

### `prompt_access_audit` (optional)
- `id bigint identity primary key`
- `user_id uuid references auth.users(id)`
- `result text check (result in ('granted','denied'))`
- `reason text`
- `created_at timestamptz default now()`
- `cohort_id text`

**Indexes**: `user_id`, `created_at` brin.

**RLS**: admin read; service role insert. Consider retention policy (90 days).

## Supporting Functions & Policies
- `fn_is_prompt_admin()` returns boolean based on JWT claim `prompt_admin = true` or membership table.
- `fn_user_has_prompt_access()` verifies Supabase auth email exists in active `course_cohort_members` row and returns boolean for middleware.
- RLS policies reference helper functions to keep logic centralized.

## Migration Breakdown
1. **001_create_prompt_catalog**: `prompt_modules`, `prompt_lessons` with seed data insert.
2. **002_create_prompt_content**: `prompts`, `prompt_versions`, `prompt_favorites`, triggers to bump `updated_at`, maintain `current_version_id` on publish, and enforce version increments.
3. **003_create_prompt_telemetry**: `prompt_usage_logs`, opt-out check function, RLS policies.
4. **004_create_cohort_tables**: `course_cohort_members`, `course_cohort_sync_runs`, optional `prompt_access_audit`.
5. **005_seed_feature_flags**: insert `PROMPT_MANAGER_ENABLED`, `PROMPT_USAGE_LOGGING_ENABLED` into existing config table (if applicable).

Each migration will:
- Include header comment with purpose.
- Enable RLS and define policies immediately after table creation.
- Add triggers for timestamp updates (`set_updated_at`, `maintain_prompt_status`).

## Open Items
- Determine whether module/lesson seed data should live in SQL or JSON import.
- Confirm naming for helper functions and JWT claims.
- Validate whether `course_cohort_members.email` should be case-insensitive (`citext` assumed).

## Next Steps
- Review proposal with backend team for alignment with Supabase constraints.
- Finalize policy functions and integrate with authentication middleware.
- Author actual SQL migrations following the breakdown above.
