# Comprehensive RLS Alignment Plan

## Current State Analysis

### Critical Gaps Identified

**Missing RLS Policies:**
1. `prompts` table - NO RLS policies (high risk)
2. `prompt_collections` table - NO RLS policies
3. `prompt_collection_segments` table - NO RLS policies

**Architectural Inconsistency:**
- Prompt services use `supabaseAdmin` (service_role) → bypasses RLS
- Invite services use authenticated client → respects RLS
- All authorization currently happens at application layer only

### Security Risks

Without RLS on prompt tables:
- Direct database access could bypass app authorization
- Compromised service key could expose all data
- No defense-in-depth protection
- Inconsistent with invite system's security model

## Confirmed Decisions

### ✅ Decision 1: RLS Strategy
**Selected:** Option A - Add RLS + migrate to authenticated client for defense-in-depth

### ✅ Decision 2: Prompt Access Rules
- **Members:** See only published prompts
- **Admins:** See all prompts (draft + published)
- **Isolation:** Full org isolation - prompts only visible within org context

### ✅ Decision 3: Collection/Segment Visibility
**All org members** can browse collections/segments to navigate the structure

## Implementation Plan

### Phase 1: Add RLS Policies (Migration)

**Create new migration:** `add_prompt_manager_rls.sql`

1. **Enable RLS on tables:**
   ```sql
   ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE prompt_collections ENABLE ROW LEVEL SECURITY;
   ALTER TABLE prompt_collection_segments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
   ```

2. **Prompts table policies:**
   - SELECT: Members see published prompts in their orgs, admins see all
   - INSERT/UPDATE/DELETE: Org admins only
   - Filter by organization_id using org membership

3. **Prompt Collections policies:**
   - SELECT: All org members
   - INSERT/UPDATE/DELETE: Org admins only

4. **Prompt Collection Segments policies:**
   - SELECT: All org members (via collection membership)
   - INSERT/UPDATE/DELETE: Org admins only

5. **User Consents policies:**
   - SELECT/INSERT/UPDATE: Own consents only
   - Use auth.uid() = user_id pattern

### Phase 2: Migrate Services to Authenticated Client

1. **Update prompt services** (`src/services/prompt-manager/promptService.ts`):
   - Replace `supabaseAdmin` import with `SupabaseClient` type
   - Add `supabase` parameter as first argument to all functions
   - Pass `supabase` from API endpoint `locals.supabase`
   - Keep organization_id filters for explicit intent (defense-in-depth)
   - Keep app-layer admin role checks

2. **Update collection services** (`src/services/prompt-manager/promptCollectionService.ts`):
   - Same pattern as prompt services
   - Add `supabase` parameter to all functions

3. **Update all API endpoints** that call these services:
   - `src/pages/api/prompts/admin/prompts.ts`
   - `src/pages/api/prompts/admin/prompts/[id].ts`
   - `src/pages/api/prompts/admin/prompts/[id]/publish.ts`
   - `src/pages/api/prompts/admin/prompt-collections.ts`
   - `src/pages/api/prompts/admin/prompt-collections/[id]/segments.ts`
   - `src/pages/api/prompts/index.ts`
   - `src/pages/api/prompts/[id].ts`
   - `src/pages/api/prompts/collections.ts`
   - `src/pages/api/prompts/collections/by-slug.ts`
   - `src/pages/api/prompts/collections/[id]/segments.ts`
   - `src/pages/api/prompts/segments/by-slug.ts`
   - Pass `locals.supabase` to service functions

### Phase 3: Testing & Validation

1. **Test member access:**
   - Can view published prompts only
   - Cannot create/update/delete
   - Cannot see other orgs' data

2. **Test admin access:**
   - Can view all prompts (draft + published)
   - Can create/update/delete in their org
   - Cannot access other orgs' data

3. **Test invite flow:**
   - Validation still works (anon access)
   - Redemption still works

### Phase 4: Grant Alignment

Verify grants in comprehensive RLS setup migration:
- ✅ Organizations: authenticated, service_role
- ✅ Organization Members: authenticated, service_role
- ✅ Organization Invites: authenticated, service_role, anon
- ❌ Prompts: Need authenticated, service_role grants
- ❌ Prompt Collections: Need authenticated, service_role grants
- ❌ Prompt Collection Segments: Need authenticated, service_role grants

## Recommended RLS Policies (Detailed)

### Prompts Table

```sql
-- Members can view published prompts in their orgs
CREATE POLICY "Members can view published prompts"
ON prompts FOR SELECT
TO authenticated
USING (
  status = 'published' AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = prompts.organization_id
    AND user_id = auth.uid()
  )
);

-- Admins can view all prompts in their orgs
CREATE POLICY "Admins can view all prompts"
ON prompts FOR SELECT
TO authenticated
USING (
  is_org_admin(organization_id, auth.uid())
);

-- Admins can insert prompts
CREATE POLICY "Admins can create prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (
  is_org_admin(organization_id, auth.uid())
);

-- Admins can update prompts in their org
CREATE POLICY "Admins can update prompts"
ON prompts FOR UPDATE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()))
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Admins can delete prompts in their org
CREATE POLICY "Admins can delete prompts"
ON prompts FOR DELETE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()));
```

### Prompt Collections Table

```sql
-- All org members can view collections
CREATE POLICY "Members can view collections"
ON prompt_collections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = prompt_collections.organization_id
    AND user_id = auth.uid()
  )
);

-- Admins can create collections
CREATE POLICY "Admins can create collections"
ON prompt_collections FOR INSERT
TO authenticated
WITH CHECK (
  is_org_admin(organization_id, auth.uid())
);

-- Admins can update collections
CREATE POLICY "Admins can update collections"
ON prompt_collections FOR UPDATE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()))
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Admins can delete collections
CREATE POLICY "Admins can delete collections"
ON prompt_collections FOR DELETE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()));
```

### Prompt Collection Segments Table

```sql
-- Members can view segments in their org collections
CREATE POLICY "Members can view segments"
ON prompt_collection_segments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    JOIN organization_members om ON om.organization_id = pc.organization_id
    WHERE pc.id = prompt_collection_segments.collection_id
    AND om.user_id = auth.uid()
  )
);

-- Admins can create segments
CREATE POLICY "Admins can create segments"
ON prompt_collection_segments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
);

-- Admins can update segments
CREATE POLICY "Admins can update segments"
ON prompt_collection_segments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
);

-- Admins can delete segments
CREATE POLICY "Admins can delete segments"
ON prompt_collection_segments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
);
```

### User Consents Table

```sql
-- Users can view their own consents
CREATE POLICY "Users can view own consents"
ON user_consents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
ON user_consents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
CREATE POLICY "Users can update own consents"
ON user_consents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own consents
CREATE POLICY "Users can delete own consents"
ON user_consents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## Implementation Sequence

### Step 1: Create Migration File
Create `supabase/migrations/20251004000000_add_prompt_manager_rls.sql` with:
- GRANT statements for prompts, prompt_collections, prompt_collection_segments
- ENABLE RLS on all four tables
- CREATE POLICY statements as detailed below

### Step 2: Migrate Service Functions
Update service layer to accept authenticated supabase client:
- `promptService.ts` - 8 functions to update
- `promptCollectionService.ts` - 6 functions to update

### Step 3: Update API Endpoints
Update 13 endpoint files to pass `locals.supabase` to service functions

### Step 4: Local Testing
- Test with member user (published prompts only)
- Test with admin user (all prompts)
- Test cross-org isolation
- Test invite flow still works

### Step 5: Deploy
- Apply migration to local DB
- Run manual tests
- Deploy to integration
- Run integration tests
- Deploy to production

## Files to Modify

### New Files:
- `supabase/migrations/20251004000000_add_prompt_manager_rls.sql`

### Modified Files:
- `src/services/prompt-manager/promptService.ts` - Add supabase param to all functions
- `src/services/prompt-manager/promptCollectionService.ts` - Add supabase param to all functions
- `src/pages/api/prompts/admin/prompts.ts` - Pass locals.supabase
- `src/pages/api/prompts/admin/prompts/[id].ts` - Pass locals.supabase
- `src/pages/api/prompts/admin/prompts/[id]/publish.ts` - Pass locals.supabase
- `src/pages/api/prompts/admin/prompt-collections.ts` - Pass locals.supabase
- `src/pages/api/prompts/admin/prompt-collections/[id]/segments.ts` - Pass locals.supabase
- `src/pages/api/prompts/index.ts` - Pass locals.supabase
- `src/pages/api/prompts/[id].ts` - Pass locals.supabase
- `src/pages/api/prompts/collections.ts` - Pass locals.supabase
- `src/pages/api/prompts/collections/by-slug.ts` - Pass locals.supabase
- `src/pages/api/prompts/collections/[id]/segments.ts` - Pass locals.supabase
- `src/pages/api/prompts/segments/by-slug.ts` - Pass locals.supabase

## Risk Mitigation

- Run migration in transaction
- Test rollback procedure
- Verify existing functionality before/after
- Monitor for RLS-related errors in logs
- Keep service_role grants for backward compatibility during transition

## Key Architecture Insights

### Current Service Pattern Analysis

**Invite Services (invites.ts):**
- ✅ Uses authenticated client from `locals.supabase`
- ✅ Relies on RLS for security
- ✅ Defense-in-depth approach

**Prompt Services (promptService.ts, promptCollectionService.ts):**
- ❌ Uses `supabaseAdmin` with service_role key
- ❌ Bypasses all RLS policies
- ❌ Security only at application layer
- ⚠️ Organization filtering happens in application code only

### Authorization Logic Comparison

**Middleware (`src/middleware/index.ts`):**
- Builds `promptManager` context with user's organizations
- Checks admin role for admin routes
- But services don't use this context fully

**API Endpoints:**
- Admin endpoints check `locals.promptManager.activeOrganization.role === 'admin'`
- Member endpoints check organization membership
- Then call services with organization_id

**Services Layer:**
- Services filter by organization_id in queries
- BUT use service_role client → no RLS enforcement
- If service is called incorrectly, no DB-level protection

### Why This Matters

**Current Risk:**
```typescript
// If this is called with wrong org_id, nothing stops it at DB level
await getPrompt(promptId, "attacker-org-id");
```

**With RLS:**
```typescript
// DB enforces user can only see their org's data
// Even if app logic has bug, DB protects
await getPrompt(supabase, promptId, "attacker-org-id"); // Would return null/error
```

## Service Migration Examples

### Pattern Overview

All service functions will be updated to:
1. Accept `supabase: SupabaseClient` as first parameter
2. Use the authenticated client instead of `supabaseAdmin`
3. Keep existing organization_id filters (belt + suspenders approach)

### Service Migration Example

**Before:**
```typescript
// src/services/prompt-manager/promptService.ts
import { supabaseAdmin } from '@/db/supabase-admin';

export async function getPrompt(
  promptId: string,
  organizationId: string,
): Promise<ServiceResult<Prompt>> {
  const { data, error } = await supabaseAdmin
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('organization_id', organizationId)  // App-layer filter
    .single();
  // ...
}
```

**After:**
```typescript
// src/services/prompt-manager/promptService.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getPrompt(
  supabase: SupabaseClient,
  promptId: string,
  organizationId: string,
): Promise<ServiceResult<Prompt>> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('organization_id', organizationId)  // Still check, but RLS also enforces
    .single();
  // ...
}
```

**Endpoint Update:**
```typescript
// src/pages/api/prompts/admin/prompts/[id].ts
const result = await getPrompt(
  locals.supabase,  // Pass authenticated client
  promptId,
  organizationId
);
```

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Member can view published prompts in their org
- [ ] Member cannot view draft prompts
- [ ] Member cannot view prompts from other orgs
- [ ] Member cannot create/update/delete prompts
- [ ] Admin can view all prompts (draft + published) in their org
- [ ] Admin cannot view prompts from other orgs
- [ ] Admin can create/update/delete prompts in their org
- [ ] Admin cannot create/update/delete prompts in other orgs
- [ ] All members can view collections/segments in their org
- [ ] Invite validation still works (anon access)
- [ ] Invite redemption still works (authenticated access)
- [ ] User consents are isolated per user
