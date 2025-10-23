# Testable RLS Approach - Analysis & Implementation Plan

## Executive Summary

The RLS implementation introduced a fundamental architectural change: service functions now accept an authenticated `SupabaseClient` instead of using the global `supabaseAdmin`. This breaks **27 existing tests** across unit and integration test suites. This document provides a comprehensive analysis and actionable plan to restore test coverage while enhancing testability for RLS-enforced authorization.

---

## Table of Contents

1. [Current Test Failures Analysis](#current-test-failures-analysis)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Testing Challenges with RLS](#testing-challenges-with-rls)
4. [Proposed Testing Strategy](#proposed-testing-strategy)
5. [Implementation Plan](#implementation-plan)
6. [Test Utilities & Helpers](#test-utilities--helpers)
7. [RLS-Specific Test Scenarios](#rls-specific-test-scenarios)
8. [Migration Checklist](#migration-checklist)

---

## Current Test Failures Analysis

### Test Failure Summary (27 total failures)

```
❌ tests/unit/services/prompt-manager/promptService.test.ts (24/24 failed)
❌ tests/unit/services/prompt-manager/promptCollectionService.test.ts (likely similar failures)
❌ tests/integration/prompt-admin-flow.test.ts (3/3 failed)
❌ tests/integration/invite-flow.test.ts (2/4 failed)
✅ tests/unit/services/prompt-manager/invites.test.ts (all passing - uses correct pattern)
```

### Failure Categories

#### Category 1: Mock Import Mismatch (24 failures in promptService.test.ts)
**Symptom:**
```
expected "spy" to be called with arguments: [ 'prompts' ]
Received: Number of calls: 0
```

**Root Cause:**
- Tests mock `@/db/supabase-admin` module
- Service functions no longer import or use `supabaseAdmin`
- Service functions now expect `supabase` as first parameter
- Mocked module is never called

**Affected Tests:**
- All tests in `promptService.test.ts`
- All tests in `promptCollectionService.test.ts`

#### Category 2: Function Signature Mismatch (3 failures in prompt-admin-flow.test.ts)
**Symptom:**
```typescript
// Old call (pre-RLS)
const result = await getCollections('org-1');

// New signature (post-RLS)
const result = await getCollections(supabase, 'org-1');
```

**Root Cause:**
- Service function signatures changed to accept `supabase` as first parameter
- Tests call functions with old signatures
- All 9 functions in promptService changed
- All 6 functions in promptCollectionService changed

**Affected Functions:**
```typescript
// promptService.ts
createPrompt(supabase, organizationId, data)        // was: createPrompt(organizationId, data)
updatePrompt(supabase, promptId, orgId, data)       // was: updatePrompt(promptId, orgId, data)
publishPrompt(supabase, promptId, orgId)            // was: publishPrompt(promptId, orgId)
unpublishPrompt(supabase, promptId, orgId)          // was: unpublishPrompt(promptId, orgId)
deletePrompt(supabase, promptId, orgId)             // was: deletePrompt(promptId, orgId)
getPrompt(supabase, promptId, orgId)                // was: getPrompt(promptId, orgId)
listPrompts(supabase, orgId, filters?)              // was: listPrompts(orgId, filters?)
listPublishedPrompts(supabase, orgId, filters?)     // was: listPublishedPrompts(orgId, filters?)
getPublishedPrompt(supabase, promptId, orgId)       // was: getPublishedPrompt(promptId, orgId)

// promptCollectionService.ts
getCollections(supabase, orgId)                     // was: getCollections(orgId)
getCollectionBySlug(supabase, orgId, slug)          // was: getCollectionBySlug(orgId, slug)
getSegments(supabase, collectionId)                 // was: getSegments(collectionId)
getSegmentBySlug(supabase, collectionId, slug)      // was: getSegmentBySlug(collectionId, slug)
createCollection(supabase, orgId, data)             // was: createCollection(orgId, data)
createSegment(supabase, collectionId, data)         // was: createSegment(collectionId, data)
```

#### Category 3: Mock Implementation Incompleteness (2 failures in invite-flow.test.ts)
**Symptom:**
```
TypeError: supabase.from(...).select(...).eq(...).eq(...).maybeSingle is not a function
```

**Root Cause:**
- Mock Supabase clients in integration tests don't fully implement the query builder chain
- Missing `.maybeSingle()` method in mock
- Mock chaining incomplete for complex queries

---

## Root Cause Analysis

### Architectural Change Impact

**Before RLS Implementation:**
```typescript
// Service Layer
import { supabaseAdmin } from '@/db/supabase-admin';

export async function getPrompt(promptId: string, orgId: string) {
  const { data, error } = await supabaseAdmin  // Global admin client
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('organization_id', orgId)
    .single();
  // ...
}

// Test Layer
vi.mock('@/db/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),  // Mock the global
  },
}));
```

**After RLS Implementation:**
```typescript
// Service Layer
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getPrompt(
  supabase: SupabaseClient,  // Injected authenticated client
  promptId: string,
  orgId: string
) {
  const { data, error } = await supabase  // Uses injected client
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('organization_id', orgId)
    .single();
  // ...
}

// Test Layer - OLD (BROKEN)
vi.mock('@/db/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),  // ❌ Never called!
  },
}));

// Test Layer - NEW (REQUIRED)
const mockSupabase = createMockSupabaseClient();
const result = await getPrompt(mockSupabase, 'prompt-1', 'org-1');
```

### Why This Change Matters for Testing

**Dependency Injection Benefits:**
1. ✅ **Easier Mocking**: Pass mock clients directly, no module mocking needed
2. ✅ **Better Isolation**: Each test controls its own Supabase behavior
3. ✅ **RLS Testing**: Can simulate different user contexts (admin vs member)
4. ✅ **Type Safety**: TypeScript ensures client interface compatibility

**Challenges:**
1. ❌ **Test Boilerplate**: Every test needs to create and pass mock client
2. ❌ **Mock Complexity**: Query builder chains are complex to mock
3. ❌ **Test Data Setup**: Need to simulate RLS filtering in mocks
4. ❌ **Context Simulation**: Must mock different user roles/permissions

---

## Testing Challenges with RLS

### Challenge 1: Query Builder Complexity

The Supabase client uses extensive method chaining:

```typescript
const { data, error } = await supabase
  .from('prompts')           // QueryBuilder
  .select('*')               // PostgrestFilterBuilder
  .eq('id', 'x')             // PostgrestFilterBuilder
  .eq('organization_id', 'y')// PostgrestFilterBuilder
  .single();                 // PostgrestBuilder (returns promise)
```

**Testing Problem:**
Each method must return a mock that has the next method in the chain.

**Current invites.test.ts Pattern (Working):**
```typescript
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null })
        })
      })
    })
  })
};
```

**Problem:** This is verbose and error-prone. Need helper utilities.

### Challenge 2: RLS Policy Simulation in Tests

With RLS enabled, the database enforces access control. Tests need to simulate this.

**Member User Scenario:**
```typescript
// RLS Policy: Members can only see published prompts
const memberClient = createMockSupabaseClient({
  role: 'member',
  orgId: 'org-1',
  userId: 'user-1'
});

// Should return only published prompts
const result = await listPrompts(memberClient, 'org-1');
expect(result.data).toEqual([/* only published */]);
```

**Admin User Scenario:**
```typescript
// RLS Policy: Admins can see all prompts
const adminClient = createMockSupabaseClient({
  role: 'admin',
  orgId: 'org-1',
  userId: 'admin-1'
});

// Should return all prompts (draft + published)
const result = await listPrompts(adminClient, 'org-1');
expect(result.data).toEqual([/* draft + published */]);
```

**Challenge:** Need to encode RLS rules into test mock behavior.

### Challenge 3: Cross-Org Isolation Testing

RLS ensures prompts are isolated by organization. Tests should verify this.

```typescript
it('cannot access prompts from other organizations', async () => {
  const mockClient = createMockSupabaseClient({
    role: 'member',
    orgId: 'org-1',
    userId: 'user-1'
  });

  // Try to access org-2 prompt while authenticated to org-1
  const result = await getPrompt(mockClient, 'prompt-org2', 'org-2');

  // RLS should prevent access
  expect(result.data).toBeNull();
  expect(result.error?.code).toBe('NOT_FOUND');
});
```

### Challenge 4: Integration vs Unit Test Boundaries

**Unit Tests:**
- Mock Supabase client completely
- Test service function logic in isolation
- Don't need real RLS enforcement

**Integration Tests:**
- Should test RLS policies work correctly
- Need real Supabase connection (local Docker or Supabase Cloud test instance)
- Verify member/admin access patterns
- Test org isolation

**Question:** Where to draw the line?
- ❓ Should unit tests simulate RLS filtering in mocks?
- ❓ Should integration tests use real Supabase with RLS?
- ❓ Do we need E2E tests with real database?

---

## Proposed Testing Strategy

### Three-Tier Testing Approach

#### Tier 1: Unit Tests (Mock Everything)
**Scope:** Service functions in isolation
**Tools:** Vitest + Mock Supabase client
**RLS Simulation:** No (mocks return what test specifies)
**Files:**
- `tests/unit/services/prompt-manager/promptService.test.ts`
- `tests/unit/services/prompt-manager/promptCollectionService.test.ts`

**Example:**
```typescript
it('creates a new prompt', async () => {
  const mockSupabase = createMockSupabaseClient();
  mockSupabase.from('prompts').insert.mockResolvedValue({
    data: mockPrompt,
    error: null
  });

  const result = await createPrompt(mockSupabase, 'org-1', promptData);

  expect(result.data).toEqual(mockPrompt);
});
```

**Focus:**
- Service function logic correctness
- Error handling
- Data transformation
- Edge cases

#### Tier 2: Integration Tests (Mock API + Supabase)
**Scope:** API routes + services working together
**Tools:** Vitest + MSW (mock HTTP) + Mock Supabase
**RLS Simulation:** Partial (via mock behavior)
**Files:**
- `tests/integration/prompt-admin-flow.test.ts`
- `tests/integration/prompt-language.test.ts`
- `tests/integration/invite-flow.test.ts`

**Example:**
```typescript
it('member can only list published prompts', async () => {
  const mockSupabase = createMockSupabaseClient({ role: 'member' });

  // Mock filters by status='published'
  mockSupabase.from('prompts').select.mockImplementation((query) => {
    if (query.includes('published')) {
      return { data: [publishedPrompt], error: null };
    }
    return { data: [], error: null };
  });

  const result = await listPrompts(mockSupabase, 'org-1');
  expect(result.data).toHaveLength(1);
  expect(result.data[0].status).toBe('published');
});
```

**Focus:**
- Full request/response flow
- Authorization checks
- Multi-service interactions
- Realistic data flows

#### Tier 3: E2E Tests (Real Supabase with RLS)
**Scope:** End-to-end with real database
**Tools:** Playwright + Local Supabase (Docker)
**RLS Simulation:** Real RLS policies enforced
**Files:**
- `e2e/prompt-manager-rls.spec.ts` (NEW)

**Example:**
```typescript
test('member cannot see draft prompts', async ({ page }) => {
  // Login as member user (uses real Supabase auth)
  await loginAsMember(page, 'member@example.com');

  // Navigate to prompts page
  await page.goto('/prompts/admin');

  // Only published prompts should be visible
  const promptCards = await page.locator('[data-testid="prompt-card"]').all();
  for (const card of promptCards) {
    const status = await card.getAttribute('data-status');
    expect(status).toBe('published');
  }
});
```

**Focus:**
- Real RLS policies work correctly
- Browser-level user experience
- Authentication flows
- Cross-browser compatibility

---

## Implementation Plan

### Phase 1: Create Test Utilities (Foundation)

**Goal:** Build reusable helpers to simplify test writing.

#### 1.1 Create Mock Supabase Client Factory

**File:** `tests/helpers/mockSupabaseClient.ts`

**Purpose:**
- Generate fully-typed mock Supabase clients
- Support query builder chaining
- Simulate RLS filtering behavior
- Reduce test boilerplate

**Key Functions:**
```typescript
// Create basic mock client
createMockSupabaseClient(options?: MockClientOptions): MockSupabaseClient

// Create mock with pre-configured responses
createMockSupabaseClientWithData(fixtures: DataFixtures): MockSupabaseClient

// Create role-based mock (member vs admin)
createMemberMockClient(orgId: string, userId: string): MockSupabaseClient
createAdminMockClient(orgId: string, userId: string): MockSupabaseClient
```

**Features Needed:**
- ✅ Query builder method chaining (`.from().select().eq()...`)
- ✅ Fluent API support (`.insert().select().single()`)
- ✅ Error injection for testing error paths
- ✅ Call history tracking for assertions
- ✅ RLS-aware filtering (optional)

#### 1.2 Create Test Data Fixtures

**File:** `tests/fixtures/promptManagerFixtures.ts`

**Purpose:**
- Standard test data for prompts, collections, segments
- Consistent IDs and relationships
- Easy to compose for different scenarios

**Example Structure:**
```typescript
export const testOrganizations = {
  org1: { id: 'org-test-1', name: 'Test Org 1' },
  org2: { id: 'org-test-2', name: 'Test Org 2' },
};

export const testUsers = {
  adminUser: { id: 'user-admin-1', email: 'admin@test.com', role: 'admin' },
  memberUser: { id: 'user-member-1', email: 'member@test.com', role: 'member' },
};

export const testCollections = {
  collection1: {
    id: 'coll-test-1',
    organization_id: 'org-test-1',
    slug: 'fundamentals',
    title: 'Fundamentals',
    // ...
  },
};

export const testPrompts = {
  draftPrompt: { status: 'draft', /* ... */ },
  publishedPrompt: { status: 'published', /* ... */ },
};
```

#### 1.3 Create RLS Behavior Simulator

**File:** `tests/helpers/rlsSimulator.ts`

**Purpose:**
- Simulate RLS policy filtering in mock responses
- Apply access rules based on user context
- Filter data based on organization membership

**Example Usage:**
```typescript
const mockClient = createMockSupabaseClient();
const rlsFilter = createRLSFilter({
  userId: 'user-1',
  orgId: 'org-1',
  role: 'member'
});

mockClient.from('prompts').select = vi.fn().mockImplementation(() => {
  const allPrompts = [draftPrompt, publishedPrompt];
  const filtered = rlsFilter.applyPromptsPolicy(allPrompts);
  return { data: filtered, error: null };
});
```

---

### Phase 2: Migrate Unit Tests

**Goal:** Update existing unit tests to use new service signatures and mock clients.

#### 2.1 Update promptService.test.ts

**Changes Required:**

**Before:**
```typescript
vi.mock('@/db/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '@/db/supabase-admin';

it('creates a new prompt', async () => {
  const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

  const result = await createPrompt('org-1', input);

  expect(supabaseAdmin.from).toHaveBeenCalledWith('prompts');
  expect(result.data).toEqual(mockPrompt);
});
```

**After:**
```typescript
import { createMockSupabaseClient } from '@/tests/helpers/mockSupabaseClient';

it('creates a new prompt', async () => {
  const mockSupabase = createMockSupabaseClient();

  mockSupabase.mockInsert('prompts', { data: mockPrompt, error: null });

  const result = await createPrompt(mockSupabase, 'org-1', input);

  expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
  expect(result.data).toEqual(mockPrompt);
});
```

**Migration Steps:**
1. Remove `vi.mock('@/db/supabase-admin')` block
2. Import `createMockSupabaseClient` helper
3. Create mock client in each test (or beforeEach)
4. Update service function calls to pass mock client as first argument
5. Simplify mock setup using helper methods

**Estimated Changes:**
- 24 test cases in `promptService.test.ts`
- All tests in `promptCollectionService.test.ts`

#### 2.2 Update promptCollectionService.test.ts

**Similar migration as above.**

**Additional consideration:**
- Tests for `createCollection` and `createSegment` need mock for sort_order calculation query
- Need to mock two sequential `from()` calls (max query + insert query)

---

### Phase 3: Migrate Integration Tests

**Goal:** Update integration tests to pass mock clients and handle new signatures.

#### 3.1 Update prompt-admin-flow.test.ts

**Current Issues:**
1. Service functions called with old signatures
2. Mock client doesn't support full query chain
3. No RLS simulation

**Migration Strategy:**

**Before:**
```typescript
const collectionsResult = await getCollections(ORG_ID);
```

**After:**
```typescript
const mockSupabase = createMockSupabaseClient();
mockSupabase.mockSelect('prompt_collections', {
  data: mockCollections,
  error: null
});

const collectionsResult = await getCollections(mockSupabase, ORG_ID);
```

**Key Updates:**
- Pass mock client to all service function calls
- Use helper to set up query chain mocks
- Add tests for RLS scenarios (member vs admin)

#### 3.2 Update invite-flow.test.ts

**Current Issue:**
```
TypeError: supabase.from(...).select(...).eq(...).eq(...).maybeSingle is not a function
```

**Root Cause:**
Mock client missing `.maybeSingle()` method in chain.

**Fix:**
Ensure mock client factory includes all Supabase query methods:
- `.single()`
- `.maybeSingle()`
- `.limit()`
- `.order()`
- `.range()`
- `.or()`
- `.not()`
- etc.

---

### Phase 4: Add RLS-Specific Tests

**Goal:** Verify RLS policies work correctly with comprehensive test coverage.

#### 4.1 Create RLS Policy Unit Tests

**File:** `tests/unit/services/prompt-manager/rlsPolicies.test.ts` (NEW)

**Purpose:**
Test that service functions behave correctly under different user roles.

**Example Tests:**
```typescript
describe('RLS Policy Enforcement', () => {
  describe('Member Access', () => {
    it('member can only see published prompts', async () => {
      const mockClient = createMemberMockClient('org-1', 'user-1');

      // Mock returns only published prompts
      mockClient.mockSelect('prompts', {
        data: [publishedPrompt],
        error: null
      });

      const result = await listPrompts(mockClient, 'org-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('published');
    });

    it('member cannot create prompts', async () => {
      const mockClient = createMemberMockClient('org-1', 'user-1');

      // Mock RLS rejection
      mockClient.mockInsert('prompts', {
        data: null,
        error: { code: 'PGRST301', message: 'permission denied' }
      });

      const result = await createPrompt(mockClient, 'org-1', promptInput);

      expect(result.error).toBeTruthy();
      expect(result.error?.code).toContain('PGRST');
    });
  });

  describe('Admin Access', () => {
    it('admin can see all prompts (draft + published)', async () => {
      const mockClient = createAdminMockClient('org-1', 'admin-1');

      mockClient.mockSelect('prompts', {
        data: [draftPrompt, publishedPrompt],
        error: null
      });

      const result = await listPrompts(mockClient, 'org-1');

      expect(result.data).toHaveLength(2);
    });

    it('admin can create prompts', async () => {
      const mockClient = createAdminMockClient('org-1', 'admin-1');

      mockClient.mockInsert('prompts', {
        data: newPrompt,
        error: null
      });

      const result = await createPrompt(mockClient, 'org-1', promptInput);

      expect(result.data).toBeTruthy();
    });
  });

  describe('Organization Isolation', () => {
    it('user cannot access prompts from other orgs', async () => {
      const mockClient = createMemberMockClient('org-1', 'user-1');

      // Mock RLS filtering out org-2 prompts
      mockClient.mockSelect('prompts', {
        data: [],
        error: null
      });

      const result = await getPrompt(mockClient, 'prompt-org2', 'org-2');

      expect(result.data).toBeNull();
    });
  });
});
```



---

## Test Utilities & Helpers

### Utility 1: Mock Supabase Client Factory

**Location:** `tests/helpers/mockSupabaseClient.ts`

**Interface:**
```typescript
interface MockClientOptions {
  role?: 'member' | 'admin';
  userId?: string;
  orgId?: string;
  rlsEnabled?: boolean;
}

interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
  mockSelect: (table: string, result: { data: any, error: any }) => void;
  mockInsert: (table: string, result: { data: any, error: any }) => void;
  mockUpdate: (table: string, result: { data: any, error: any }) => void;
  mockDelete: (table: string, result: { data: any, error: any }) => void;
  reset: () => void;
}

function createMockSupabaseClient(options?: MockClientOptions): MockSupabaseClient;
function createMemberMockClient(orgId: string, userId: string): MockSupabaseClient;
function createAdminMockClient(orgId: string, userId: string): MockSupabaseClient;
```

**Key Features:**
- Fluent API that mimics real Supabase client
- Support for all query builder methods
- Simplified setup methods (`.mockSelect()`, etc.)
- Optional RLS filtering
- Call history tracking

**Implementation Sketch:**
```typescript
export function createMockSupabaseClient(options: MockClientOptions = {}): MockSupabaseClient {
  const queryResults = new Map<string, any>();

  const createQueryBuilder = (table: string) => {
    let currentResult = queryResults.get(table) || { data: [], error: null };

    const builder = {
      select: vi.fn().mockReturnValue(builder),
      insert: vi.fn().mockReturnValue(builder),
      update: vi.fn().mockReturnValue(builder),
      delete: vi.fn().mockReturnValue(builder),
      eq: vi.fn().mockReturnValue(builder),
      neq: vi.fn().mockReturnValue(builder),
      or: vi.fn().mockReturnValue(builder),
      order: vi.fn().mockReturnValue(builder),
      limit: vi.fn().mockReturnValue(builder),
      single: vi.fn().mockResolvedValue(currentResult),
      maybeSingle: vi.fn().mockResolvedValue(currentResult),
      then: vi.fn((resolve) => resolve(currentResult)),
    };

    return builder;
  };

  const client = {
    from: vi.fn().mockImplementation(createQueryBuilder),

    mockSelect: (table: string, result: any) => {
      queryResults.set(table, result);
    },

    mockInsert: (table: string, result: any) => {
      queryResults.set(table, result);
    },

    // ... other helper methods

    reset: () => {
      queryResults.clear();
      vi.clearAllMocks();
    },
  };

  return client as unknown as MockSupabaseClient;
}
```

---

### Utility 2: Test Data Fixtures

**Location:** `tests/fixtures/promptManagerFixtures.ts`

**Purpose:**
Provide consistent, reusable test data for all test suites.

**Structure:**
```typescript
export const fixtures = {
  organizations: {
    org1: {
      id: 'org-test-1',
      name: 'Test Organization 1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    org2: {
      id: 'org-test-2',
      name: 'Test Organization 2',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },

  users: {
    adminUser: {
      id: 'user-admin-1',
      email: 'admin@test.com',
      created_at: '2025-01-01T00:00:00Z',
    },
    memberUser: {
      id: 'user-member-1',
      email: 'member@test.com',
      created_at: '2025-01-01T00:00:00Z',
    },
  },

  organizationMembers: {
    org1Admin: {
      user_id: 'user-admin-1',
      organization_id: 'org-test-1',
      role: 'admin',
      created_at: '2025-01-01T00:00:00Z',
    },
    org1Member: {
      user_id: 'user-member-1',
      organization_id: 'org-test-1',
      role: 'member',
      created_at: '2025-01-01T00:00:00Z',
    },
  },

  collections: {
    fundamentals: {
      id: 'coll-test-1',
      organization_id: 'org-test-1',
      slug: 'fundamentals',
      title: 'Fundamentals',
      description: 'Core concepts',
      sort_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },

  segments: {
    gettingStarted: {
      id: 'seg-test-1',
      collection_id: 'coll-test-1',
      slug: 'getting-started',
      title: 'Getting Started',
      sort_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },

  prompts: {
    draftPrompt: {
      id: 'prompt-draft-1',
      organization_id: 'org-test-1',
      collection_id: 'coll-test-1',
      segment_id: 'seg-test-1',
      title_en: 'Draft Prompt',
      title_pl: null,
      markdown_body_en: '# Draft Content',
      markdown_body_pl: null,
      status: 'draft' as const,
      created_by: 'user-admin-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    publishedPrompt: {
      id: 'prompt-published-1',
      organization_id: 'org-test-1',
      collection_id: 'coll-test-1',
      segment_id: 'seg-test-1',
      title_en: 'Published Prompt',
      title_pl: null,
      markdown_body_en: '# Published Content',
      markdown_body_pl: null,
      status: 'published' as const,
      created_by: 'user-admin-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },
};

// Helper to get related data
export function getCollectionPrompts(collectionId: string) {
  return Object.values(fixtures.prompts).filter(
    p => p.collection_id === collectionId
  );
}

export function getPublishedPrompts() {
  return Object.values(fixtures.prompts).filter(
    p => p.status === 'published'
  );
}

export function getDraftPrompts() {
  return Object.values(fixtures.prompts).filter(
    p => p.status === 'draft'
  );
}
```

---

### Utility 3: RLS Simulator

**Location:** `tests/helpers/rlsSimulator.ts`

**Purpose:**
Apply RLS-like filtering to mock data based on user context.

**Interface:**
```typescript
interface UserContext {
  userId: string;
  orgId: string;
  role: 'member' | 'admin';
}

class RLSSimulator {
  constructor(context: UserContext);

  filterPrompts(prompts: Prompt[]): Prompt[];
  filterCollections(collections: PromptCollection[]): PromptCollection[];
  filterSegments(segments: PromptSegment[]): PromptSegment[];

  canCreate(table: string): boolean;
  canUpdate(table: string, record: any): boolean;
  canDelete(table: string, record: any): boolean;
}

export function createRLSSimulator(context: UserContext): RLSSimulator;
```

**Implementation:**
```typescript
export function createRLSSimulator(context: UserContext): RLSSimulator {
  return {
    filterPrompts(prompts: Prompt[]): Prompt[] {
      // Apply RLS policy: Members see published, Admins see all
      return prompts.filter(prompt => {
        // Org isolation
        if (prompt.organization_id !== context.orgId) {
          return false;
        }

        // Member vs Admin access
        if (context.role === 'member') {
          return prompt.status === 'published';
        }

        return true; // Admins see all
      });
    },

    filterCollections(collections: PromptCollection[]): PromptCollection[] {
      // All org members can see collections
      return collections.filter(
        c => c.organization_id === context.orgId
      );
    },

    filterSegments(segments: PromptSegment[]): PromptSegment[] {
      // Filter segments based on collection access
      // (Requires collection lookup - simplified here)
      return segments;
    },

    canCreate(table: string): boolean {
      // Only admins can create prompts/collections/segments
      if (['prompts', 'prompt_collections', 'prompt_collection_segments'].includes(table)) {
        return context.role === 'admin';
      }
      return true;
    },

    canUpdate(table: string, record: any): boolean {
      if (table === 'prompts' && record.organization_id === context.orgId) {
        return context.role === 'admin';
      }
      return false;
    },

    canDelete(table: string, record: any): boolean {
      return this.canUpdate(table, record);
    },
  };
}
```

---

## RLS-Specific Test Scenarios

### Scenario 1: Member Access Restrictions

**Test Coverage:**
- ✅ Members can view published prompts in their org
- ✅ Members cannot view draft prompts
- ✅ Members cannot create prompts
- ✅ Members cannot update prompts
- ✅ Members cannot delete prompts
- ✅ Members cannot publish/unpublish prompts
- ✅ Members can view collections
- ✅ Members can view segments

**Example Test:**
```typescript
describe('Member Access Control', () => {
  let memberClient: MockSupabaseClient;

  beforeEach(() => {
    memberClient = createMemberMockClient('org-1', 'user-member-1');
  });

  it('member can view published prompts', async () => {
    memberClient.mockSelect('prompts', {
      data: [fixtures.prompts.publishedPrompt],
      error: null
    });

    const result = await listPublishedPrompts(memberClient, 'org-1');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('published');
  });

  it('member cannot view draft prompts', async () => {
    memberClient.mockSelect('prompts', {
      data: [], // RLS filters out drafts
      error: null
    });

    const result = await getPrompt(memberClient, 'prompt-draft-1', 'org-1');

    expect(result.data).toBeNull();
  });

  it('member cannot create prompts', async () => {
    memberClient.mockInsert('prompts', {
      data: null,
      error: { code: 'PGRST301', message: 'permission denied for table prompts' }
    });

    const result = await createPrompt(memberClient, 'org-1', promptInput);

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toContain('PGRST');
  });
});
```

---

### Scenario 2: Admin Full Access

**Test Coverage:**
- ✅ Admins can view all prompts (draft + published)
- ✅ Admins can create prompts
- ✅ Admins can update prompts
- ✅ Admins can delete prompts
- ✅ Admins can publish prompts
- ✅ Admins can unpublish prompts
- ✅ Admins can create collections
- ✅ Admins can create segments

**Example Test:**
```typescript
describe('Admin Full Access', () => {
  let adminClient: MockSupabaseClient;

  beforeEach(() => {
    adminClient = createAdminMockClient('org-1', 'user-admin-1');
  });

  it('admin can view all prompts', async () => {
    adminClient.mockSelect('prompts', {
      data: [fixtures.prompts.draftPrompt, fixtures.prompts.publishedPrompt],
      error: null
    });

    const result = await listPrompts(adminClient, 'org-1');

    expect(result.data).toHaveLength(2);
  });

  it('admin can create prompts', async () => {
    const newPrompt = { ...fixtures.prompts.draftPrompt, id: 'new-prompt-1' };
    adminClient.mockInsert('prompts', {
      data: newPrompt,
      error: null
    });

    const result = await createPrompt(adminClient, 'org-1', promptInput);

    expect(result.data).toBeTruthy();
    expect(result.error).toBeNull();
  });
});
```

---

### Scenario 3: Organization Isolation

**Test Coverage:**
- ✅ Users cannot see prompts from other orgs
- ✅ Users cannot create prompts in other orgs
- ✅ Users cannot update prompts in other orgs
- ✅ Users cannot delete prompts from other orgs
- ✅ Admin of org-1 cannot access org-2 data

**Example Test:**
```typescript
describe('Organization Isolation', () => {
  it('admin cannot access prompts from other orgs', async () => {
    const org1Admin = createAdminMockClient('org-1', 'admin-1');

    // Try to access org-2 prompt
    org1Admin.mockSelect('prompts', {
      data: [], // RLS filters by organization_id
      error: null
    });

    const result = await getPrompt(org1Admin, 'prompt-org2', 'org-2');

    expect(result.data).toBeNull();
  });

  it('member cannot list prompts from other orgs', async () => {
    const org1Member = createMemberMockClient('org-1', 'member-1');

    org1Member.mockSelect('prompts', {
      data: [], // No cross-org access
      error: null
    });

    const result = await listPrompts(org1Member, 'org-2');

    expect(result.data).toEqual([]);
  });
});
```

---

### Scenario 4: User Consent Isolation

**Test Coverage:**
- ✅ Users can view their own consents
- ✅ Users cannot view other users' consents
- ✅ Users can create their own consents
- ✅ Users can update their own consents
- ✅ Users can delete their own consents

---

## Migration Checklist

### Pre-Migration Preparation

- [ ] **Read and understand this document fully**
- [ ] **Review current test failures** (`npm run test`)
- [ ] **Backup current test files** (git branch: `pre-rls-test-migration`)
- [ ] **Set up local Supabase** (for E2E tests, optional)
- [ ] **Review invites.test.ts** (reference implementation)

### Phase 1: Test Utilities (Week 1)

- [ ] **Create `tests/helpers/mockSupabaseClient.ts`**
  - [ ] Implement `createMockSupabaseClient()`
  - [ ] Implement query builder chain methods
  - [ ] Add helper methods (`.mockSelect()`, etc.)
  - [ ] Add `.maybeSingle()` support
  - [ ] Test the helper itself

- [ ] **Create `tests/fixtures/promptManagerFixtures.ts`**
  - [ ] Define organizations
  - [ ] Define users
  - [ ] Define organization_members
  - [ ] Define collections
  - [ ] Define segments
  - [ ] Define prompts (draft + published)
  - [ ] Add helper functions

- [ ] **Create `tests/helpers/rlsSimulator.ts`** (optional)
  - [ ] Implement filtering logic
  - [ ] Add permission checks
  - [ ] Test RLS simulation

- [ ] **Create helper exports** (`tests/helpers/index.ts`)

### Phase 2: Unit Tests Migration (Week 2)

- [ ] **Migrate `tests/unit/services/prompt-manager/promptService.test.ts`**
  - [ ] Remove `vi.mock('@/db/supabase-admin')`
  - [ ] Import `createMockSupabaseClient`
  - [ ] Update `createPrompt` tests (2 tests)
  - [ ] Update `updatePrompt` tests (3 tests)
  - [ ] Update `publishPrompt` tests (2 tests)
  - [ ] Update `unpublishPrompt` tests (2 tests)
  - [ ] Update `deletePrompt` tests (2 tests)
  - [ ] Update `getPrompt` tests (3 tests)
  - [ ] Update `listPrompts` tests (10 tests)
  - [ ] Verify all tests pass

- [ ] **Migrate `tests/unit/services/prompt-manager/promptCollectionService.test.ts`**
  - [ ] Remove `vi.mock('@/db/supabase-admin')`
  - [ ] Import `createMockSupabaseClient`
  - [ ] Update `getCollections` tests
  - [ ] Update `getSegments` tests
  - [ ] Update `createCollection` tests
  - [ ] Update `createSegment` tests
  - [ ] Update `getCollectionBySlug` tests
  - [ ] Update `getSegmentBySlug` tests
  - [ ] Verify all tests pass

- [ ] **Run unit tests** (`npm run test tests/unit`)
  - [ ] All promptService tests pass
  - [ ] All promptCollectionService tests pass
  - [ ] All invites tests pass (already passing)

### Phase 3: Integration Tests Migration (Week 3)

- [ ] **Migrate `tests/integration/prompt-admin-flow.test.ts`**
  - [ ] Update service function calls (add mock client)
  - [ ] Fix `getCollections()` call
  - [ ] Fix `getSegments()` call
  - [ ] Fix `createPrompt()` call
  - [ ] Fix `updatePrompt()` call
  - [ ] Fix `publishPrompt()` call
  - [ ] Fix `unpublishPrompt()` call
  - [ ] Fix `deletePrompt()` call
  - [ ] Fix `getPrompt()` call
  - [ ] Fix `listPrompts()` call
  - [ ] Verify all tests pass

- [ ] **Migrate `tests/integration/invite-flow.test.ts`**
  - [ ] Add `.maybeSingle()` to mock client
  - [ ] Fix incomplete query builder chains
  - [ ] Verify all tests pass

- [ ] **Run integration tests** (`npm run test tests/integration`)
  - [ ] All tests pass



### Phase 4: Verification & Cleanup

- [ ] **Run all tests** (`npm run test`)
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] All E2E tests pass (if created)

- [ ] **Code review**
  - [ ] Review test coverage report
  - [ ] Ensure no test skips or `.only()`
  - [ ] Check for test duplication
  - [ ] Verify mock setup consistency

- [ ] **Documentation**
  - [ ] Update test README if exists
  - [ ] Document new test utilities
  - [ ] Add inline comments for complex mocks

- [ ] **Clean up**
  - [ ] Remove old test helpers (if any)
  - [ ] Remove dead code
  - [ ] Format code (`npm run format`)

---

## Success Criteria

### Quantitative Metrics

- ✅ **All 27 currently failing tests pass**
- ✅ **Test coverage ≥ 80%** for prompt manager services
- ✅ **0 test skips** (no `.skip()` or `x` prefixes)
- ✅ **Build succeeds** (`npm run build`)
- ✅ **Linting passes** (`npm run lint`)

### Qualitative Goals

- ✅ **Tests are readable and maintainable**
- ✅ **Mock setup is DRY** (Don't Repeat Yourself)
- ✅ **Tests clearly show RLS intent**
- ✅ **Easy to add new tests** (good infrastructure)
- ✅ **Tests document expected behavior**

---

## Key Insights & Best Practices

### Insight 1: Dependency Injection Improves Testability

**Before (Global Dependency):**
```typescript
// Service tightly coupled to supabaseAdmin
import { supabaseAdmin } from '@/db/supabase-admin';

export async function getPrompt(id: string) {
  const { data } = await supabaseAdmin.from('prompts')...
}

// Test must mock the module
vi.mock('@/db/supabase-admin');
```

**After (Injected Dependency):**
```typescript
// Service accepts any SupabaseClient
export async function getPrompt(supabase: SupabaseClient, id: string) {
  const { data } = await supabase.from('prompts')...
}

// Test passes mock directly
const mock = createMockSupabaseClient();
await getPrompt(mock, 'id-1');
```

**Benefits:**
- No module mocking needed
- Each test controls its own client
- Easier to test different scenarios
- Type-safe mock injection

---

### Insight 2: Test Helpers Reduce Boilerplate

**Without Helper (Verbose):**
```typescript
const single = vi.fn().mockResolvedValue({ data: mockData, error: null });
const eq2 = vi.fn().mockReturnValue({ single });
const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
const select = vi.fn().mockReturnValue({ eq: eq1 });
mockSupabase.from.mockReturnValue({ select });
```

**With Helper (Concise):**
```typescript
mockSupabase.mockSelect('prompts', { data: mockData, error: null });
```

**Lesson:** Invest time in good test utilities upfront.

---

### Insight 3: Fixtures Improve Test Consistency

**Without Fixtures:**
```typescript
// Test 1
const prompt = { id: 'p1', title: 'Test', organization_id: 'org1', ... };

// Test 2
const prompt = { id: 'p1', title: 'Test Prompt', organization_id: 'org-1', ... };
//                                  ^^^^ inconsistent
```

**With Fixtures:**
```typescript
// Both tests use same fixture
const prompt = fixtures.prompts.publishedPrompt;
```

**Lesson:** Centralize test data to avoid inconsistencies.

---

### Insight 4: RLS Testing Needs Both Unit and Integration Tests

**Unit Tests (Mock RLS):**
- Fast execution
- Test service logic in isolation
- Simulate RLS with mocks
- No database needed

**Integration Tests (Real RLS):**
- Slower but realistic
- Test actual RLS policies
- Catch policy bugs
- Requires database

**Lesson:** Use both approaches for comprehensive coverage.

---

## Common Pitfalls to Avoid

### Pitfall 1: Incomplete Mock Chains

**Problem:**
```typescript
mockSupabase.from.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [], error: null })
  })
});

// Breaks if query uses .single()
await supabase.from('prompts').select().eq().single();
//                                              ^^^^^^ undefined
```

**Solution:**
Use helper that implements all methods.

---

### Pitfall 2: Hardcoded Test Data

**Problem:**
```typescript
const result = await getPrompt(mock, 'prompt-123', 'org-abc');
expect(result.data.id).toBe('prompt-123');
expect(result.data.organization_id).toBe('org-abc');
//                                        ^^^^^^^^ typo risk
```

**Solution:**
Use fixtures with constants.

---

### Pitfall 3: Testing Implementation Instead of Behavior

**Problem:**
```typescript
it('calls supabase.from with correct table', async () => {
  await getPrompt(mock, 'id', 'org');
  expect(mock.from).toHaveBeenCalledWith('prompts');
  //                                      ^^^^^^^^ implementation detail
});
```

**Solution:**
Test outcomes, not implementation:
```typescript
it('returns prompt when found', async () => {
  mock.mockSelect('prompts', { data: mockPrompt, error: null });
  const result = await getPrompt(mock, 'id', 'org');
  expect(result.data).toEqual(mockPrompt);
  //                  ^^^^^^ behavior
});
```

---

### Pitfall 4: Not Testing RLS Scenarios

**Problem:**
Only testing happy paths, not access control.

**Solution:**
Add tests for:
- Member cannot access drafts
- Admin can access all
- Cross-org isolation
- Permission denied errors

---

## Conclusion

The RLS implementation improves security through defense-in-depth, but requires comprehensive test migration. By following this plan:

1. **Create reusable test utilities** to reduce boilerplate
2. **Migrate existing tests** to use new service signatures
3. **Add RLS-specific tests** to verify access control
4. **Use fixtures** for consistent test data
5. **Consider E2E tests** for real RLS validation

**Estimated Effort:**
- **Phase 1 (Utilities):** 2-3 days
- **Phase 2 (Unit Tests):** 3-4 days
- **Phase 3 (Integration Tests):** 2-3 days
- **Phase 4 (RLS Tests):** 2-3 days
- **Total:** ~2 weeks

**Next Steps:**
1. Review and approve this plan
2. Create test utilities (Phase 1)
3. Migrate one test file as proof-of-concept
4. Review POC with team
5. Complete remaining migration

**Success means:**
- ✅ All 27 tests passing
- ✅ Comprehensive RLS coverage
- ✅ Maintainable test infrastructure
- ✅ Confidence in defense-in-depth security
