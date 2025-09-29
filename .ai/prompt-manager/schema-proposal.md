# Prompt Manager Schema Snapshot (POC)

## Overview
This schema mirrors the lean setup described in `poc-arch-plan.md` and `poc-impl-plan.md`. It keeps the Prompt Manager POC limited to a single published version per prompt, organization-scoped access. All tables live in Supabase with feature-flagged access from the Astro app.

During rollout seed a single `10xDevs` organization. Map only the curated launch cohort into membership rows so the remaining ~254 legacy accounts stay locked out until explicitly approved.

## Minimal Table Set
| Table | Purpose | Key Columns |
| --- | --- | --- |
| `organizations` | Registry of organizations that can access prompts. | `id uuid pk`, `slug text unique`, `name text`, timestamps |
| `organization_members` | Links Supabase users to organizations with a lightweight role. | `organization_id uuid fk`, `user_id uuid fk`, `role text check in ('member',,'admin')`, timestamps, primary key `(organization_id,user_id)` |
| `prompt_collections` | Top-level grouping of prompts per organization. | `id uuid pk`, `organization_id uuid fk`, `slug text`, `title text`, `description text`, `sort_order int default 0`, timestamps, unique `(organization_id, slug)` |
| `prompt_collection_segments` | Optional sub-group inside a collection. | `id uuid pk`, `collection_id uuid fk`, `slug text`, `title text`, `sort_order int default 0`, timestamps, unique `(collection_id, slug)` |
| `prompts` | Single active prompt entry (draft/published). | `id uuid pk`, `organization_id uuid fk`, `collection_id uuid fk`, `segment_id uuid fk nullable`, `title text`, `markdown_body text`, `status text check in ('draft','published')`, `created_by uuid fk`, `updated_at timestamptz`, index `(organization_id,status,collection_id,segment_id)` |

Notes:
- Stick to nullable `segment_id` so collections without segments remain valid.
- Default `organization_members.role` to `member`; elevate to `admin` for users who can publish.
- No enums or triggers—keep migrations portable.

## Suggested Migration Outline
```sql
-- 001_prompt_manager_orgs.sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (organization_id, user_id)
);

-- seed launch org + vetted members
insert into organizations (slug, name)
values ('10xdevs', '10xDevs')
on conflict (slug) do nothing;
```
```sql
-- 002_prompt_manager_catalog.sql
create table prompt_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, slug)
);
create index idx_prompt_collections_org_sort on prompt_collections(organization_id, sort_order);

create table prompt_collection_segments (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references prompt_collections(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (collection_id, slug)
);
create index idx_prompt_segments_collection_sort on prompt_collection_segments(collection_id, sort_order);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  collection_id uuid not null references prompt_collections(id) on delete cascade,
  segment_id uuid references prompt_collection_segments(id) on delete set null,
  title text not null,
  markdown_body text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now()
);
create index idx_prompts_org_scope on prompts(organization_id, status, collection_id, segment_id);
```

Seed collections/segments and a couple of demo prompts in the same migration using `insert ... on conflict do nothing` so fresh environments boot quickly.

## Access & RLS Notes
- RLS can stay off for the POC while middleware and Supabase service-role keys enforce access; enable policies later when the API surface grows.
- Middleware should reject any request lacking both the feature flag and an `organization_members` row.
- Admin-only routes verify `role in ('admin')`; plain members keep read-only access to published prompts.

## Deferred for Later Iterations
These tables intentionally stay out of the POC to keep migrations lean:
- `prompt_versions` (version history)
- `prompt_usage_logs` (telemetry)
- External roster sync tables (`organization_roster_members`, etc.)

Revisit them once the POC validates the end-to-end flow.

## Next Steps
1. Translate this outline into Supabase migrations (two files per the outline above).
2. Backfill the vetted 10xDevs members via SQL or the admin UI before enabling the flag in staging.
3. Confirm middleware/helpers (`useOrganizationAccess`, `ensurePromptAccess`) match the column names above.
