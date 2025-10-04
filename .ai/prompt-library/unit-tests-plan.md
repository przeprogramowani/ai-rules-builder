# Unit Tests Failure Analysis & Fix Plan

## Executive Summary

9 out of 178 tests are currently failing across 3 test files. All failures stem from **API contract mismatches** between the service implementation and test expectations. The implementation evolved (made `generateInviteToken` async, changed return types), but tests weren't updated to reflect these changes.

**Recommended Approach**: Fix tests to match current implementation (Option A), as the current implementation is more consistent and aligned with real-world usage.

---

## Detailed Failure Analysis

### 1. Unit Tests: `invites.test.ts` (6/17 failures)

#### Failure 1: `generates a token of expected length`
**Location**: `tests/unit/services/prompt-manager/invites.test.ts:37-41`

**Error**:
```
actual value must be number or bigint, received "undefined"
```

**Root Cause**:
- `generateInviteToken()` became `async` (src/services/prompt-manager/invites.ts:25)
- Test calls it synchronously at line 38
- Returns a Promise instead of a string
- `token.length` evaluates to `undefined` because `token` is a Promise

**Current Code**:
```typescript
it('generates a token of expected length', () => {
  const token = generateInviteToken();  // Missing await!
  expect(token.length).toBeGreaterThan(40);
});
```

**Fix**:
```typescript
it('generates a token of expected length', async () => {
  const token = await generateInviteToken();
  expect(token.length).toBeGreaterThan(40);
});
```

---

#### Failure 2: `lists invites for an organization`
**Location**: `tests/unit/services/prompt-manager/invites.test.ts:267-307`

**Error**:
```
Target cannot be null or undefined.
```

**Root Cause**:
- `listOrganizationInvites()` now returns `OrganizationInvite[]` directly (invites.ts:300-330)
- Test expects `{ data: OrganizationInvite[], error: string | null }` structure
- Test tries to access `result.data` on an array at line 305

**Current Implementation** (invites.ts:297-330):
```typescript
export async function listOrganizationInvites(
  supabase: Supabase,
  organizationId: string,
): Promise<OrganizationInvite[]> {  // Returns array directly
  try {
    // ...
    return (data ?? []).map(/* transform */);
  } catch (err) {
    return [];  // Returns empty array on error
  }
}
```

**Test Expectation** (line 302-306):
```typescript
const result = await listOrganizationInvites(mockSupabase as any, 'org-1');

expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
expect(result.data).toHaveLength(2);  // ❌ result is array, not { data }
expect(result.error).toBeNull();      // ❌ result has no error property
```

**Fix**:
```typescript
const result = await listOrganizationInvites(mockSupabase as any, 'org-1');

expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
expect(result).toHaveLength(2);
expect(Array.isArray(result)).toBe(true);
```

---

#### Failure 3: `handles errors when listing invites`
**Location**: `tests/unit/services/prompt-manager/invites.test.ts:309-319`

**Error**:
```
expected undefined to be null
```

**Root Cause**:
- Same as Failure 2 - return type mismatch
- Test expects `result.error` to be null, but `result` is an array

**Current Test** (line 315-318):
```typescript
const result = await listOrganizationInvites(mockSupabase as any, 'org-1');

expect(result.data).toBeNull();    // ❌ result is array
expect(result.error).toBeTruthy(); // ❌ no error property
```

**Fix**:
```typescript
const result = await listOrganizationInvites(mockSupabase as any, 'org-1');

expect(result).toEqual([]);  // Empty array on error
expect(Array.isArray(result)).toBe(true);
```

---

#### Failure 4: `revokes an invite successfully`
**Location**: `tests/unit/services/prompt-manager/invites.test.ts:323-334`

**Error**:
```
expected undefined to be null
```

**Root Cause**:
- `revokeInvite()` returns `{ success: boolean; error?: string }` (invites.ts:338)
- Test expects `{ error: string | null }` structure
- On success, `error` is `undefined`, not `null`

**Current Implementation** (invites.ts:335-355):
```typescript
export async function revokeInvite(
  supabase: Supabase,
  inviteId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('organization_invites')
      .update({ is_active: false })
      .eq('id', inviteId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };  // No error property
  } catch (err) {
    return { success: false, error: 'Failed to revoke invite' };
  }
}
```

**Current Test** (line 329-333):
```typescript
const result = await revokeInvite(mockSupabase as any, 'invite-1');

expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
expect(update).toHaveBeenCalledWith({ is_active: false });
expect(result.error).toBeNull();  // ❌ error is undefined on success
```

**Fix**:
```typescript
const result = await revokeInvite(mockSupabase as any, 'invite-1');

expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
expect(update).toHaveBeenCalledWith({ is_active: false });
expect(result.success).toBe(true);
expect(result.error).toBeUndefined();
```

---

#### Failure 5: `handles errors when revoking`
**Location**: `tests/unit/services/prompt-manager/invites.test.ts:336-345`

**Error**:
```
expected undefined to be truthy
```

**Root Cause**:
- Same as Failure 4 - return type mismatch
- Test expects error to exist, but checks wrong field structure

**Current Test** (line 342-344):
```typescript
const result = await revokeInvite(mockSupabase as any, 'invite-1');

expect(result.error).toBeTruthy();  // Works but should also check success
```

**Fix**:
```typescript
const result = await revokeInvite(mockSupabase as any, 'invite-1');

expect(result.success).toBe(false);
expect(result.error).toBeTruthy();
```

---

#### Failure 6: `retrieves invite statistics`
**Location**: `tests/unit/services/prompt-manager/invites.test.ts:349-367`

**Error**:
```
expected null to deeply equal { totalRedemptions: 3, newUsers: 2, existingUsers: 1 }
```

**Root Cause**:
- Implementation calls `.single()` on line 370 to get invite details first
- Mock doesn't properly set up the chain for `.single()`
- The implementation also makes an RPC call that the mock doesn't handle

**Current Implementation** (invites.ts:360-429):
```typescript
export async function getInviteStats(
  supabase: Supabase,
  inviteId: string,
): Promise<InviteStats | null> {
  try {
    // Step 1: Get invite details with .single()
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .select('max_uses, current_uses')
      .eq('id', inviteId)
      .single();  // ⚠️ Mock needs this

    if (inviteError || !invite) {
      return null;
    }

    // Step 2: Get redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('organization_invite_redemptions')
      .select('user_id, was_new_user, redeemed_at')
      .eq('invite_id', inviteId)
      .order('redeemed_at', { ascending: false });

    // Step 3: Get user emails via RPC
    const { data: userEmails } = await supabase.rpc('get_user_emails', {
      user_ids: userIds,
    });

    // ... build stats
  } catch (err) {
    return null;
  }
}
```

**Current Mock** (line 356-358):
```typescript
const eq = vi.fn().mockResolvedValue({ data: mockRedemptions, error: null });
const select = vi.fn().mockReturnValue({ eq });
mockSupabase.from.mockReturnValueOnce({ select });
```

**Problem**:
1. Mock only sets up `select -> eq`, but implementation needs `select -> eq -> single`
2. Implementation fetches from TWO tables: `organization_invites` and `organization_invite_redemptions`
3. Implementation calls RPC `get_user_emails`
4. Mock only handles one `from()` call

**Fix**: Completely rewrite the mock setup:
```typescript
it('retrieves invite statistics', async () => {
  // Mock 1: Get invite details (first from call)
  const inviteSingle = vi.fn().mockResolvedValue({
    data: { max_uses: null, current_uses: 3 },
    error: null
  });
  const inviteEq = vi.fn().mockReturnValue({ single: inviteSingle });
  const inviteSelect = vi.fn().mockReturnValue({ eq: inviteEq });

  // Mock 2: Get redemptions (second from call)
  const mockRedemptions = [
    { id: '1', invite_id: 'invite-1', user_id: 'user-1', was_new_user: true, redeemed_at: '2025-01-01' },
    { id: '2', invite_id: 'invite-1', user_id: 'user-2', was_new_user: false, redeemed_at: '2025-01-02' },
    { id: '3', invite_id: 'invite-1', user_id: 'user-3', was_new_user: true, redeemed_at: '2025-01-03' },
  ];
  const redemptionsOrder = vi.fn().mockResolvedValue({ data: mockRedemptions, error: null });
  const redemptionsEq = vi.fn().mockReturnValue({ order: redemptionsOrder });
  const redemptionsSelect = vi.fn().mockReturnValue({ eq: redemptionsEq });

  // Setup from() to return different mocks based on table name
  mockSupabase.from
    .mockReturnValueOnce({ select: inviteSelect })          // First call: organization_invites
    .mockReturnValueOnce({ select: redemptionsSelect });    // Second call: organization_invite_redemptions

  // Mock 3: RPC call for user emails
  mockSupabase.rpc.mockResolvedValueOnce({
    data: [
      { id: 'user-1', email: 'user1@example.com' },
      { id: 'user-2', email: 'user2@example.com' },
      { id: 'user-3', email: 'user3@example.com' },
    ],
    error: null,
  });

  const result = await getInviteStats(mockSupabase as any, 'invite-1');

  expect(result).toEqual({
    totalRedemptions: 3,
    newUsers: 2,
    existingUsers: 1,
    remainingUses: null,
    users: expect.arrayContaining([
      expect.objectContaining({ id: 'user-1', wasNewUser: true }),
      expect.objectContaining({ id: 'user-2', wasNewUser: false }),
      expect.objectContaining({ id: 'user-3', wasNewUser: true }),
    ]),
  });
});
```

---

### 2. Integration Tests: `invite-flow.test.ts` (2/4 failures)

#### Failure 7: `completes the full invite workflow successfully`
**Location**: `tests/integration/invite-flow.test.ts:38-296`

**Error**:
```
expected false to be true // Object.is equality
```

**Root Cause**:
- At line 156: `expect(redeemResult.success).toBe(true)` fails
- The `redeemInvite` call at line 150 returns `success: false`
- Mock chain for member check doesn't properly handle `.maybeSingle()`

**Implementation Detail** (invites.ts:216-223):
```typescript
// Check if user is already a member
const { data: existingMember } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('organization_id', validation.organization.id)
  .eq('user_id', params.userId)
  .maybeSingle();  // ⚠️ Uses maybeSingle, not single
```

**Current Mock** (line 107-114):
```typescript
const memberCheckQueryBuilder = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
};
mockSupabase.from.mockReturnValueOnce({
  select: vi.fn().mockReturnValue(memberCheckQueryBuilder),
} as any);
```

**Problem**:
The mock is configured correctly for `.maybeSingle()`, BUT the issue is in the **insert operations** that follow. Looking at line 129-136:

```typescript
// Insert new organization member
mockSupabase.from.mockReturnValueOnce({
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),  // ⚠️ Direct resolve
});

// Insert redemption record
mockSupabase.from.mockReturnValueOnce({
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),  // ⚠️ Direct resolve
});
```

The implementation (invites.ts:236) expects:
```typescript
const { error: memberError } = await supabase.from('organization_members').insert({...});
```

But `.insert()` returns `this`, not a promise. The chain should be:
```typescript
mockSupabase.from.mockReturnValueOnce({
  insert: vi.fn().mockReturnValue({
    // No await here - insert returns builder, not promise
    // The await happens on the builder itself
  }),
});
```

Actually, looking more carefully at the Supabase API, `insert()` without `.select()` **does** return a promise directly. So the mock is potentially correct.

Let me trace through more carefully. The implementation uses:
1. Line 236: `insert()` - returns PromiseLike
2. Line 251: `insert()` - returns PromiseLike
3. Line 265: `rpc()` - returns Promise

The issue might be with the RPC call. Looking at line 265-276:

```typescript
// Increment usage counter atomically
const { error: incrementError } = await supabase.rpc(
  'increment_invite_usage' as never,
  { invite_id: validation.invite.id } as never,
);

if (incrementError) {
  // If RPC doesn't exist, fall back to manual increment
  await supabase
    .from('organization_invites')
    .update({ current_uses: validation.invite.currentUses + 1 })
    .eq('id', validation.invite.id);
}
```

The test doesn't mock the RPC call! When RPC fails (because it's not mocked), it falls back to the update path, which ALSO isn't properly mocked in sequence.

**Fix**: Add proper RPC mock and update mock:
```typescript
// After the redemption insert mock (around line 136)

// Mock RPC increment call (or let it fail and mock the fallback)
mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

// OR: Mock the fallback update if RPC fails
// mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC not found' } });
// mockSupabase.from.mockReturnValueOnce({
//   update: vi.fn().mockReturnValue({
//     eq: vi.fn().mockResolvedValue({ data: null, error: null }),
//   }),
// });
```

---

#### Failure 8: `handles user already being a member (idempotent redemption)`
**Location**: `tests/integration/invite-flow.test.ts:368-442`

**Error**:
```
expected undefined to be 'Test Organization'
```

**Root Cause**:
- Line 441 expects: `redeemResult.organization?.name`
- Implementation returns: `redeemResult.organizationName` (flat structure)

**Implementation** (invites.ts:224-232):
```typescript
if (existingMember) {
  // User is already a member - idempotent success
  return {
    success: true,
    alreadyMember: true,
    organizationId: validation.organization.id,
    organizationSlug: validation.organization.slug,
    organizationName: validation.organization.name,  // Flat field
  };
}
```

**Type Definition** (types/invites.ts:40-48):
```typescript
export interface InviteRedemptionResult {
  success: boolean;
  alreadyMember?: boolean;
  organizationId?: string;
  organizationSlug?: string;
  organizationName?: string;  // Not nested
  error?: string;
  errorCode?: InviteErrorCode;
}
```

**Current Test** (line 439-441):
```typescript
expect(redeemResult.success).toBe(true);
expect(redeemResult.alreadyMember).toBe(true);
expect(redeemResult.organization?.name).toBe('Test Organization');  // ❌ Wrong field
```

**Fix**:
```typescript
expect(redeemResult.success).toBe(true);
expect(redeemResult.alreadyMember).toBe(true);
expect(redeemResult.organizationName).toBe('Test Organization');
```

Also check line 157 in the same file for consistency.

---

### 3. Middleware Test: `promptManagerMiddleware.test.ts` (1/6 failures)

#### Failure 9: `blocks prompt routes without organization membership`
**Location**: `tests/unit/middleware/promptManagerMiddleware.test.ts:156-168`

**Error**:
```
expected 302 to be 404
```

**Root Cause**:
- Test expects 404 when user has no organization membership
- Middleware redirects (302) to request access page instead

**Middleware Implementation** (src/middleware/index.ts:188-189):
```typescript
if (!hasPromptManagerAccess(context.organizations)) {
  return redirect(PROMPT_MANAGER_REQUEST_ACCESS_PATH);  // 302, not 404
}
```

**Current Test** (line 156-168):
```typescript
it('blocks prompt routes without organization membership', async () => {
  currentUser = createUser();
  delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
  mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
  buildPromptManagerContextMock.mockResolvedValue({
    organizations: [],
    activeOrganization: null,
  });
  const { onRequest } = await loadMiddleware();
  const context = createContext('/prompts');
  const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
  expect(response.status).toBe(404);  // ❌ Should be 302
});
```

**Fix**:
```typescript
it('blocks prompt routes without organization membership', async () => {
  currentUser = createUser();
  delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
  mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
  buildPromptManagerContextMock.mockResolvedValue({
    organizations: [],
    activeOrganization: null,
  });
  const { onRequest } = await loadMiddleware();
  const context = createContext('/prompts');
  const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
  expect(response.status).toBe(302);
  expect(response.headers.get('Location')).toBe('/prompts/request-access');
});
```

---

## Summary of Changes Required

| File | Test | Change Type | Lines |
|------|------|-------------|-------|
| `invites.test.ts` | Token length | Add `async/await` | 37-41 |
| `invites.test.ts` | List invites success | Update return type expectations | 267-307 |
| `invites.test.ts` | List invites error | Update return type expectations | 309-319 |
| `invites.test.ts` | Revoke success | Change to `success`-based assertion | 323-334 |
| `invites.test.ts` | Revoke error | Change to `success`-based assertion | 336-345 |
| `invites.test.ts` | Get stats | Complete mock rewrite | 349-377 |
| `invite-flow.test.ts` | Full workflow | Add RPC mock | ~150 |
| `invite-flow.test.ts` | Idempotent | Fix field name | 441, 157 |
| `promptManagerMiddleware.test.ts` | No membership | Update status expectation | 156-168 |

---

## Implementation Plan

### Phase 1: Quick Wins (Trivial fixes)
**Estimated Time**: 15 minutes

1. ✅ Fix async token generation test (Failure 1)
2. ✅ Fix middleware test expectation (Failure 9)
3. ✅ Fix idempotent redemption field name (Failure 8)

### Phase 2: Return Type Updates (Medium complexity)
**Estimated Time**: 30 minutes

4. ✅ Fix list invites success test (Failure 2)
5. ✅ Fix list invites error test (Failure 3)
6. ✅ Fix revoke invite success test (Failure 4)
7. ✅ Fix revoke invite error test (Failure 5)

### Phase 3: Complex Mock Refactoring (High complexity)
**Estimated Time**: 45 minutes

8. ✅ Fix get invite stats test (Failure 6) - requires multi-table mock
9. ✅ Fix full workflow test (Failure 7) - requires RPC mock

### Phase 4: Validation
**Estimated Time**: 15 minutes

10. ✅ Run all tests and verify 0 failures
11. ✅ Run tests in watch mode and verify stability
12. ✅ Review test coverage hasn't decreased

---

## Alternative Approach: Fix Implementation (Not Recommended)

If we were to update the implementation instead of tests, we would need to:

1. Make `generateInviteToken` synchronous again (breaking change for browser crypto)
2. Change `listOrganizationInvites` to return `{ data, error }` structure
3. Change `revokeInvite` to return `{ error }` instead of `{ success, error? }`
4. Change `InviteRedemptionResult` to have nested `organization` object
5. Change middleware to return 404 instead of redirecting

**Why this is not recommended**:
- Breaking changes to existing API consumers
- Current implementation is more idiomatic and type-safe
- Middleware redirect is better UX than 404
- Would require updates to API route handlers and frontend code

---

## Risk Assessment

### Low Risk Changes
- Async/await fixes
- Field name corrections
- Status code expectations

### Medium Risk Changes
- Return type expectations (need to verify no other consumers)
- Mock refactoring (isolated to tests)

### High Risk Changes
- None (we're not changing implementation)

---

## Testing Strategy

After implementing fixes:

1. **Unit Tests**: `npm run test tests/unit/services/prompt-manager/invites.test.ts`
2. **Integration Tests**: `npm run test tests/integration/invite-flow.test.ts`
3. **Middleware Tests**: `npm run test tests/unit/middleware/promptManagerMiddleware.test.ts`
4. **Full Suite**: `npm run test`
5. **Type Check**: `npm run lint:check`
6. **Coverage**: `npm run test:coverage` (ensure no regression)

---

## Appendix: Type Definitions Reference

### Current Return Types

```typescript
// ✅ Consistent pattern
createOrganizationInvite(): Promise<{ data: OrganizationInvite | null; error: string | null }>
validateInviteToken(): Promise<InviteValidationResult>  // Has valid/error/errorCode

// ❌ Inconsistent patterns
listOrganizationInvites(): Promise<OrganizationInvite[]>  // No error handling in return type
revokeInvite(): Promise<{ success: boolean; error?: string }>  // Different from create pattern
getInviteStats(): Promise<InviteStats | null>  // No error in return type

// ✅ Good pattern
redeemInvite(): Promise<InviteRedemptionResult>  // Has success/error/errorCode
```

### Recommended Future Refactoring (Post-Fix)

Consider standardizing all service functions to one of two patterns:

**Pattern A - Result Type**:
```typescript
type Result<T> = { success: true; data: T } | { success: false; error: string; errorCode?: string }
```

**Pattern B - Data/Error Tuple**:
```typescript
type DataResult<T> = { data: T | null; error: string | null }
```

This would make the API more predictable and easier to test.
