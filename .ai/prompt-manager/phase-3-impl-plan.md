# Phase 3 Implementation Plan: Prompt Collection Schema & Admin APIs

## Overview
This phase implements the database schema for organization-scoped prompt collections and builds the admin-only API layer that enables curators to create, edit, and publish prompts. All functionality remains behind the `PROMPT_MANAGER_ENABLED` feature flag with middleware enforcing admin role requirements.

## 1. Database Migrations

### Migration 1: Organizations & Members
**File:** `supabase/migrations/{timestamp}_prompt_manager_orgs.sql`

```sql
-- Create organizations table
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create organization members table with role-based access
create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (organization_id, user_id)
);

-- Seed launch organization
insert into organizations (slug, name)
values ('10xdevs', '10xDevs')
on conflict (slug) do nothing;
```

**Post-migration tasks:**
- Manually seed launch cohort members via separate SQL script
- Document member insertion process in migration notes

### Migration 2: Prompt Catalog
**File:** `supabase/migrations/{timestamp}_prompt_manager_catalog.sql`

```sql
-- Create prompt collections table
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

-- Create collection segments table
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

-- Create prompts table (single active version per prompt)
create table prompts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  collection_id uuid not null references prompt_collections(id) on delete cascade,
  segment_id uuid references prompt_collection_segments(id) on delete set null,
  title text not null,
  markdown_body text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_prompts_org_scope on prompts(organization_id, status, collection_id, segment_id);

-- Seed demo collections for 10xDevs
do $$
declare
  v_org_id uuid;
  v_coll1_id uuid;
  v_coll2_id uuid;
  v_seg1_id uuid;
  v_seg2_id uuid;
begin
  -- Get 10xDevs organization ID
  select id into v_org_id from organizations where slug = '10xdevs';

  if v_org_id is null then
    raise exception '10xDevs organization not found';
  end if;

  -- Insert collections
  insert into prompt_collections (organization_id, slug, title, description, sort_order)
  values
    (v_org_id, 'fundamentals', 'Fundamentals', 'Core prompts for foundational concepts', 1),
    (v_org_id, 'advanced', 'Advanced Topics', 'Advanced prompts for experienced developers', 2)
  on conflict (organization_id, slug) do nothing
  returning id into v_coll1_id;

  -- Get collection IDs if already existed
  if v_coll1_id is null then
    select id into v_coll1_id from prompt_collections where organization_id = v_org_id and slug = 'fundamentals';
  end if;
  select id into v_coll2_id from prompt_collections where organization_id = v_org_id and slug = 'advanced';

  -- Insert segments
  insert into prompt_collection_segments (collection_id, slug, title, sort_order)
  values
    (v_coll1_id, 'getting-started', 'Getting Started', 1),
    (v_coll1_id, 'best-practices', 'Best Practices', 2)
  on conflict (collection_id, slug) do nothing
  returning id into v_seg1_id;

  if v_seg1_id is null then
    select id into v_seg1_id from prompt_collection_segments where collection_id = v_coll1_id and slug = 'getting-started';
  end if;
  select id into v_seg2_id from prompt_collection_segments where collection_id = v_coll1_id and slug = 'best-practices';

  -- Insert sample prompts
  insert into prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  values
    (
      v_org_id,
      v_coll1_id,
      v_seg1_id,
      'Project Setup Guide',
      '# Project Setup\n\nThis prompt helps you set up a new project with best practices.\n\n## Steps\n1. Initialize repository\n2. Configure tooling\n3. Set up CI/CD',
      'published'
    ),
    (
      v_org_id,
      v_coll1_id,
      v_seg2_id,
      'Code Review Checklist',
      '# Code Review Checklist\n\nUse this checklist when reviewing pull requests.\n\n- [ ] Tests pass\n- [ ] Code follows style guide\n- [ ] Documentation updated',
      'draft'
    )
  on conflict do nothing;
end $$;
```

## 2. Server-Side Services

### Directory Structure
```
src/services/prompt-manager/
├── promptService.ts        # Core CRUD operations
├── collectionService.ts    # Collection/segment queries
└── types.ts               # Shared TypeScript types
```

### `src/services/prompt-manager/types.ts`
```typescript
export interface Prompt {
  id: string;
  organization_id: string;
  collection_id: string;
  segment_id: string | null;
  title: string;
  markdown_body: string;
  status: 'draft' | 'published';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptCollection {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromptSegment {
  id: string;
  collection_id: string;
  slug: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptInput {
  title: string;
  collection_id: string;
  segment_id?: string;
  markdown_body: string;
}

export interface UpdatePromptInput {
  title?: string;
  markdown_body?: string;
  segment_id?: string;
}

export interface PromptFilters {
  status?: 'draft' | 'published';
  collection_id?: string;
  segment_id?: string;
}
```

### `src/services/prompt-manager/promptService.ts`
**Core functionality:**
- `createPrompt(organizationId, data)` - Create new draft prompt
- `updatePrompt(promptId, organizationId, data)` - Update existing prompt
- `publishPrompt(promptId, organizationId)` - Change status to published
- `unpublishPrompt(promptId, organizationId)` - Revert to draft
- `deletePrompt(promptId, organizationId)` - Remove prompt (admin only)
- `getPrompt(promptId, organizationId)` - Fetch single prompt
- `listPrompts(organizationId, filters)` - List prompts with filtering

**Implementation details:**
- Use Supabase service role client for all operations
- Enforce organization scoping on all queries
- Update `updated_at` timestamp on modifications
- Return typed results using types from `types.ts`

### `src/services/prompt-manager/collectionService.ts`
**Core functionality:**
- `getCollections(organizationId)` - List collections for organization
- `getSegments(collectionId)` - List segments for collection
- `createCollection(organizationId, data)` - Create new collection (admin)
- `createSegment(collectionId, data)` - Create new segment (admin)

**Implementation details:**
- Order by `sort_order` ASC
- Return full objects with metadata

## 3. Supabase Client Configuration

### `src/db/supabase-admin.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase admin credentials');
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### Update `.env.local`
Add service role key:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. API Endpoints

### Directory Structure
```
src/pages/api/prompts/admin/
├── prompts.ts                    # POST /api/prompts/admin/prompts
├── prompts/
│   ├── [id].ts                   # PUT /api/prompts/admin/prompts/[id]
│   ├── [id]/
│   │   └── publish.ts            # PATCH /api/prompts/admin/prompts/[id]/publish
├── collections.ts                # GET /api/prompts/admin/collections
└── collections/
    └── [id]/
        └── segments.ts           # GET /api/prompts/admin/collections/[id]/segments
```

### Endpoint Implementations

#### `POST /api/prompts/admin/prompts`
- Verify admin access via middleware
- Validate request body (title, collection_id, markdown_body required)
- Extract organizationId from request context
- Call `promptService.createPrompt()`
- Return 201 with created prompt

#### `PUT /api/prompts/admin/prompts/[id]`
- Verify admin access and ownership
- Validate request body
- Call `promptService.updatePrompt()`
- Return 200 with updated prompt

#### `PATCH /api/prompts/admin/prompts/[id]/publish`
- Verify admin access
- Check current status
- Toggle between draft/published
- Return 200 with updated prompt

#### `DELETE /api/prompts/admin/prompts/[id]`
- Verify admin access and ownership
- Call `promptService.deletePrompt()`
- Return 204 No Content

#### `GET /api/prompts/admin/prompts`
- Verify admin access
- Parse query params (status, collection_id, segment_id)
- Call `promptService.listPrompts()` with filters
- Return 200 with prompt array

#### `GET /api/prompts/admin/collections`
- Verify admin access
- Call `collectionService.getCollections()`
- Return 200 with collections array

#### `GET /api/prompts/admin/collections/[id]/segments`
- Verify admin access
- Call `collectionService.getSegments()`
- Return 200 with segments array

### Common Response Patterns
```typescript
// Success responses
{ data: T, error: null }

// Error responses
{ data: null, error: { message: string, code: string } }

// HTTP status codes
201 - Created
200 - Success
204 - No Content
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 - Internal Server Error
```

## 5. Middleware & Access Control

### `src/middleware/promptAccess.ts`
**Requirements:**
1. Check `PROMPT_MANAGER_ENABLED` feature flag
2. Verify Supabase session exists
3. Query `organization_members` for user's organizations and roles
4. For admin routes, verify role = 'admin'
5. Attach `organizationId` and `role` to request context
6. Handle error cases with appropriate status codes

**Implementation approach:**
- Use Astro middleware pattern
- Access Supabase anon client with user session
- Query organization_members table
- Store context in `locals` for endpoint access
- Short-circuit on failures with error responses

### Apply Middleware in `astro.config.mjs`
```javascript
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Apply prompt access middleware for /prompts routes
  if (context.url.pathname.startsWith('/prompts') ||
      context.url.pathname.startsWith('/api/prompts')) {
    return await promptAccessMiddleware(context, next);
  }
  return next();
});
```

## 6. Testing Strategy

### Unit Tests

#### `tests/services/prompt-manager/promptService.test.ts`
**Test cases:**
- ✅ createPrompt creates draft with correct organization scoping
- ✅ updatePrompt modifies existing prompt and updates timestamp
- ✅ publishPrompt changes status to published
- ✅ unpublishPrompt reverts to draft
- ✅ deletePrompt removes prompt
- ✅ getPrompt retrieves single prompt by ID
- ✅ listPrompts filters by status
- ✅ listPrompts filters by collection_id
- ✅ listPrompts respects organization scoping
- ✅ Operations fail for non-existent organization
- ✅ Operations fail for prompts in other organizations

#### `tests/services/prompt-manager/collectionService.test.ts`
**Test cases:**
- ✅ getCollections returns collections ordered by sort_order
- ✅ getCollections filters by organization
- ✅ getSegments returns segments for collection
- ✅ getSegments orders by sort_order

#### `tests/middleware/promptAccess.test.ts`
**Test cases:**
- ✅ Blocks access when feature flag disabled
- ✅ Blocks access without session
- ✅ Blocks access without organization membership
- ✅ Allows member access to /prompts
- ✅ Blocks member access to /prompts/admin
- ✅ Allows admin access to /prompts/admin
- ✅ Attaches correct context to request locals

### API Endpoint Tests

#### `tests/api/prompts/admin/prompts.test.ts`
**Test cases:**
- ✅ POST creates prompt as admin
- ✅ POST rejects non-admin users
- ✅ POST validates required fields
- ✅ PUT updates prompt in same organization
- ✅ PUT rejects cross-organization updates
- ✅ PATCH publish toggles status
- ✅ DELETE removes prompt
- ✅ GET lists prompts with filters

### Integration Test

#### `tests/integration/prompt-admin-flow.test.ts`
**End-to-end scenario:**
1. Admin logs in
2. Creates draft prompt
3. Updates prompt content
4. Publishes prompt
5. Verifies prompt visible to members
6. Unpublishes prompt
7. Verifies prompt hidden from members

## 7. Type Generation

### Update `src/db/database.types.ts`
After running migrations, regenerate Supabase types:
```bash
npx supabase gen types typescript --project-id your-project-id > src/db/database.types.ts
```

Ensure new tables are included:
- `organizations`
- `organization_members`
- `prompt_collections`
- `prompt_collection_segments`
- `prompts`

## 8. Documentation Updates

### Update `schema-proposal.md`
- Document any deviations from original schema
- Add notes about migration execution
- Record seed data structure

### Create `docs/prompt-manager/admin-api.md`
Document all admin API endpoints with:
- Request/response schemas
- Authentication requirements
- Example curl commands
- Error response formats

## Exit Criteria

### Database
- ✅ Migration 001 runs successfully and creates organizations + members tables
- ✅ Migration 002 runs successfully and creates collections, segments, prompts tables
- ✅ 10xDevs organization seeded
- ✅ At least 2 demo collections created
- ✅ At least 2 demo segments created
- ✅ At least 2 sample prompts created (1 draft, 1 published)
- ✅ All indexes created successfully

### Services
- ✅ promptService implements all CRUD functions
- ✅ collectionService implements query functions
- ✅ All service functions enforce organization scoping
- ✅ Service unit tests pass with >80% coverage

### API Endpoints
- ✅ All 7 admin endpoints functional
- ✅ Endpoints validate input correctly
- ✅ Endpoints enforce admin role requirement
- ✅ Endpoints enforce organization scoping
- ✅ Error handling returns proper HTTP status codes
- ✅ API tests pass with >80% coverage

### Middleware
- ✅ promptAccess middleware blocks unauthorized access
- ✅ Middleware differentiates member vs admin routes
- ✅ Context properly attached to request locals
- ✅ Middleware tests pass with 100% coverage

### Integration
- ✅ End-to-end flow test passes (create → update → publish → verify)
- ✅ Cross-organization access properly blocked

### Manual Verification
- ✅ Admin can create draft via API call (Postman/curl)
- ✅ Admin can edit draft via API call
- ✅ Admin can publish prompt via API call
- ✅ Admin can unpublish prompt via API call
- ✅ Admin can delete prompt via API call
- ✅ Non-admin receives 403 on admin endpoints
- ✅ User without organization membership blocked by middleware

### Documentation
- ✅ schema-proposal.md updated with any schema changes
- ✅ admin-api.md created with full endpoint documentation
- ✅ Migration notes include member seeding instructions

## Implementation Order

1. **Database setup** (Day 1)
   - Create migration files
   - Run migrations locally
   - Verify seed data

2. **Type generation & service layer** (Day 2)
   - Regenerate database types
   - Implement promptService
   - Implement collectionService
   - Write service unit tests

3. **Middleware & access control** (Day 3)
   - Implement promptAccess middleware
   - Configure middleware in Astro
   - Write middleware tests

4. **API endpoints** (Days 4-5)
   - Implement all 7 endpoints
   - Add validation and error handling
   - Write API endpoint tests

5. **Integration & manual testing** (Day 6)
   - Write integration test
   - Manual API testing via Postman/curl
   - Fix any issues

6. **Documentation** (Day 7)
   - Update schema documentation
   - Create admin API documentation
   - Document migration process

## Risk Mitigation

**Risk:** Migration fails due to missing auth.users table
- **Mitigation:** Verify Supabase project has auth enabled before running migrations

**Risk:** Service role key exposure
- **Mitigation:** Add to .env.local, never commit, document in setup guide

**Risk:** Cross-organization data leaks
- **Mitigation:** Comprehensive testing of organization scoping in all operations

**Risk:** Middleware performance issues
- **Mitigation:** Cache organization memberships in session, benchmark middleware execution time

**Risk:** Type mismatches between service and database
- **Mitigation:** Regenerate types immediately after migrations, use strict TypeScript mode

## Next Phase Dependencies

Phase 4 (Member Experience) depends on:
- Published prompts data available via GET /api/prompts (non-admin endpoint)
- Collection and segment metadata accessible
- Organization membership validation working

Phase 5 (Admin Experience) depends on:
- All admin API endpoints functional
- Proper error handling and validation
- Draft/publish workflow verified
