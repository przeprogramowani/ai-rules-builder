# Test Suite Documentation

This document provides guidance for writing and maintaining tests in the Prompt Manager test suite.

## Table of Contents

1. [Test Infrastructure](#test-infrastructure)
2. [Mock Patterns](#mock-patterns)
3. [Best Practices](#best-practices)
4. [Common Examples](#common-examples)
5. [Test Fixtures](#test-fixtures)

## Test Infrastructure

### Mock Supabase Client

Location: `tests/helpers/mockSupabaseClient.ts`

The mock Supabase client provides a comprehensive mock for all Supabase query operations with full method chaining support.

```typescript
import { createMockSupabaseClient } from '../helpers/mockSupabaseClient';

const mockSupabase = createMockSupabaseClient();
```

**Role-based factories:**
- `createMemberMockClient(orgId, userId)` - For member role tests
- `createAdminMockClient(orgId, userId)` - For admin role tests

### Mock Query Builders

Location: `tests/helpers/mockQueryBuilders.ts`

These helpers dramatically reduce test boilerplate by providing reusable mock patterns.

## Mock Patterns

### 1. INSERT Operations

**Before:**
```typescript
const single = vi.fn().mockResolvedValue({ data: mockData, error: null });
const select = vi.fn().mockReturnValue({ single });
const insert = vi.fn().mockReturnValue({ select });
mockSupabase.from.mockReturnValue({ insert });
```

**After:**
```typescript
import { mockInsert } from '../helpers/mockQueryBuilders';

mockInsert(mockSupabase, mockData);
```

**With error:**
```typescript
mockInsert(mockSupabase, null, { message: 'Insert failed', code: 'DB_ERROR' });
```

### 2. SELECT with Single Result

**Pattern:** `.select().eq().single()`

```typescript
import { mockSelectSingle } from '../helpers/mockQueryBuilders';

// Success case
mockSelectSingle(mockSupabase, mockInvite);

// Error case
mockSelectSingle(mockSupabase, null, { message: 'Not found' });
```

### 3. SELECT with List Results

**Pattern:** `.select().eq().order()`

```typescript
import { mockSelectList } from '../helpers/mockQueryBuilders';

// Success case
mockSelectList(mockSupabase, [mockInvite1, mockInvite2]);

// Empty result
mockSelectList(mockSupabase, []);

// Error case
mockSelectList(mockSupabase, null, { message: 'Query failed' });
```

### 4. UPDATE Operations

**Pattern:** `.update().eq().eq().select().single()`

```typescript
import { mockUpdate } from '../helpers/mockQueryBuilders';

// Success case
mockUpdate(mockSupabase, updatedData);

// Error case
mockUpdate(mockSupabase, null, { message: 'Update failed' });
```

**Simple UPDATE (single eq):**
```typescript
import { mockUpdateSimple } from '../helpers/mockQueryBuilders';

mockUpdateSimple(mockSupabase, { is_active: false });
```

### 5. DELETE Operations

**Pattern:** `.delete().eq().eq()`

```typescript
import { mockDelete } from '../helpers/mockQueryBuilders';

// Success case
mockDelete(mockSupabase);

// Error case
mockDelete(mockSupabase, { message: 'Delete failed' });
```

### 6. SELECT with Double EQ

**Pattern:** `.select().eq().eq().single()`

Used for queries with two equality conditions (e.g., by ID and organization_id).

```typescript
import { mockSelectWithDoubleEq } from '../helpers/mockQueryBuilders';

mockSelectWithDoubleEq(mockSupabase, mockPrompt);
```

### 7. Sequential Queries

For tests that make multiple sequential database calls:

```typescript
import { mockSequentialQueries, mockRpc } from '../helpers/mockQueryBuilders';

mockSequentialQueries(mockSupabase, [
  { type: 'selectSingle', result: { max_uses: null, current_uses: 3 } },
  { type: 'selectList', result: mockRedemptions }
]);

// Mock RPC calls separately
mockRpc(mockSupabase, [{ id: 'user-1', email: 'test@example.com' }]);
```

**Supported query types:**
- `insert`
- `selectSingle`
- `selectList`
- `selectMaxSortOrder` - Special pattern for `.select().eq().order().limit().single()`
- `update`
- `updateSimple`
- `delete`
- `selectWithDoubleEq`

### 8. RPC Calls

```typescript
import { mockRpc } from '../helpers/mockQueryBuilders';

mockRpc(mockSupabase, userEmailData);
```

## Best Practices

### 1. Use Fixtures for Common Data

Define reusable test data in `tests/fixtures/promptManagerFixtures.ts` rather than inline in tests.

**Good:**
```typescript
import { testOrganizations, testUsers } from '../../fixtures/promptManagerFixtures';

const mockInvite = {
  organization_id: testOrganizations.org1.id,
  created_by: testUsers.admin1.id,
  // ... rest of invite data
};
```

**Avoid:**
```typescript
const mockInvite = {
  organization_id: 'org-1',
  created_by: 'user-1',
  // ... duplicating values across tests
};
```

### 2. Clear Test Names

Test names should describe the exact behavior being tested.

**Good:**
```typescript
it('rejects an expired invite')
it('creates collection with default sort_order when not provided')
it('enforces organization scoping')
```

**Avoid:**
```typescript
it('works')
it('test invite validation')
```

### 3. Minimize Mock Complexity

Let the mock builders handle the boilerplate. Only add custom mocking when testing edge cases.

### 4. Test Behavior, Not Implementation

Focus on what the service does, not how it does it.

**Good:**
```typescript
it('publishes a prompt successfully', async () => {
  mockUpdate(mockSupabase, publishedPrompt);

  const result = await publishPrompt(mockSupabase, 'prompt-1', 'org-1');

  expect(result.data?.status).toBe('published');
  expect(result.error).toBeNull();
});
```

**Avoid:**
```typescript
it('calls update method with correct parameters', async () => {
  // Too focused on implementation details
});
```

### 5. One Assertion Per Concept

Group related assertions together, but avoid testing multiple unrelated concepts in one test.

### 6. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('creates an invite successfully', async () => {
  // Arrange
  const mockInvite = { /* ... */ };
  mockInsert(mockSupabase, mockInvite);

  // Act
  const result = await createOrganizationInvite(mockSupabase, input);

  // Assert
  expect(result.error).toBeNull();
  expect(result.data).toBeTruthy();
});
```

## Common Examples

### Example 1: Simple CRUD Test

```typescript
import { mockInsert, mockUpdate, mockDelete, mockSelectWithDoubleEq } from '../helpers/mockQueryBuilders';

describe('promptService', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('creates a prompt', async () => {
    mockInsert(mockSupabase, mockPrompt);
    const result = await createPrompt(mockSupabase, 'org-1', input);
    expect(result.data).toEqual(mockPrompt);
  });

  it('updates a prompt', async () => {
    mockUpdate(mockSupabase, updatedPrompt);
    const result = await updatePrompt(mockSupabase, 'prompt-1', 'org-1', input);
    expect(result.data).toEqual(updatedPrompt);
  });

  it('deletes a prompt', async () => {
    mockDelete(mockSupabase);
    const result = await deletePrompt(mockSupabase, 'prompt-1', 'org-1');
    expect(result.error).toBeNull();
  });

  it('gets a prompt', async () => {
    mockSelectWithDoubleEq(mockSupabase, mockPrompt);
    const result = await getPrompt(mockSupabase, 'prompt-1', 'org-1');
    expect(result.data).toEqual(mockPrompt);
  });
});
```

### Example 2: Integration Test with Multiple Steps

```typescript
import { mockInsert, mockSelectSingle, mockSequentialQueries } from '../helpers/mockQueryBuilders';

it('completes invite flow from creation to redemption', async () => {
  // Step 1: Create invite
  mockInsert(mockSupabase, mockInvite);
  const createResult = await createOrganizationInvite(mockSupabase, input);
  expect(createResult.error).toBeNull();

  // Step 2: Validate invite
  mockSelectSingle(mockSupabase, mockInvite);
  const validationResult = await validateInviteToken(mockSupabase, token);
  expect(validationResult.valid).toBe(true);

  // Step 3: Redeem invite (uses multiple queries)
  mockSequentialQueries(mockSupabase, [
    { type: 'selectSingle', result: mockInvite },
    { type: 'update', result: updatedInvite }
  ]);
  const redeemResult = await redeemInvite(mockSupabase, token, userId);
  expect(redeemResult.success).toBe(true);
});
```

### Example 3: Error Handling

```typescript
it('handles database errors gracefully', async () => {
  mockInsert(mockSupabase, null, {
    message: 'Database error',
    code: 'DB_ERROR'
  });

  const result = await createPrompt(mockSupabase, 'org-1', input);

  expect(result.data).toBeNull();
  expect(result.error).toEqual({
    message: 'Database error',
    code: 'DB_ERROR',
  });
});
```

## Test Fixtures

### Available Fixtures

Location: `tests/fixtures/promptManagerFixtures.ts`

- **testOrganizations** - Sample organization data
- **testUsers** - Sample user data with different roles
- **testCollections** - Sample prompt collections
- **testSegments** - Sample collection segments
- **testPrompts** - Sample prompts in various states

### Using Fixtures

```typescript
import {
  testOrganizations,
  testUsers,
  testPrompts
} from '../../fixtures/promptManagerFixtures';

it('creates a prompt for the correct organization', async () => {
  const mockPrompt = {
    ...testPrompts.draft1,
    organization_id: testOrganizations.org1.id,
  };

  mockInsert(mockSupabase, mockPrompt);
  // ... rest of test
});
```

### When to Use Fixtures vs Inline Data

**Use fixtures when:**
- Data is reused across multiple tests
- Testing relationships between entities
- Need consistent IDs for foreign key relationships

**Use inline data when:**
- Testing specific edge cases unique to one test
- Data variations are test-specific
- Fixture would add more complexity than value

## Maintenance

### Updating Mock Builders

If you need to add a new query pattern:

1. Add the pattern type to `QueryMock` interface in `mockQueryBuilders.ts`
2. Implement the pattern in `mockSequentialQueries` switch statement
3. Optionally create a dedicated helper function for common patterns
4. Document the new pattern in this README
5. Add example usage

### Fixture Management

Periodically audit fixtures:

```bash
# Find unused fixtures
grep -r "testOrganizations" tests/
grep -r "testUsers" tests/
```

Remove or update stale fixtures that are no longer referenced.

## FAQ

**Q: Should I mock at the service layer or the database layer?**
A: Mock at the database layer (Supabase client). This allows you to test the service logic while keeping tests isolated from the database.

**Q: How do I test middleware?**
A: Middleware tests typically don't need the query builders. Use simple vi.fn() mocks and focus on testing the middleware behavior (authentication, authorization, context building).

**Q: When should I write integration tests vs unit tests?**
A:
- **Unit tests**: Test individual service methods in isolation
- **Integration tests**: Test complete workflows that span multiple services (e.g., invite creation → validation → redemption)

**Q: My test is failing with "mockReturnValueOnce" errors. What's wrong?**
A: You likely have a mismatch between the number of `.from()` calls in your code and the number of mocks you've set up. Use `mockSequentialQueries` for tests with multiple database calls.

## Contributing

When adding new tests:

1. Use existing mock builders when possible
2. Add new mock patterns to `mockQueryBuilders.ts` if needed
3. Follow the Arrange-Act-Assert pattern
4. Write clear, descriptive test names
5. Document any new patterns in this README
