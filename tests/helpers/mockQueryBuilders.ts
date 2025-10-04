import { vi } from 'vitest';
import type { MockSupabaseClient } from './mockSupabaseClient';

/**
 * Mock Query Builders
 *
 * This file provides reusable helpers for setting up Supabase query builder mocks.
 * These helpers dramatically reduce boilerplate and improve test readability.
 *
 * @example
 * ```typescript
 * // Before:
 * const single = vi.fn().mockResolvedValue({ data: mockData, error: null });
 * const select = vi.fn().mockReturnValue({ single });
 * const insert = vi.fn().mockReturnValue({ select });
 * mockSupabase.from.mockReturnValue({ insert });
 *
 * // After:
 * mockInsert(mockSupabase, mockData);
 * ```
 */

export interface QueryResult<T = any> {
  data: T | null;
  error: any | null;
}

/**
 * Creates a successful query result
 */
export function success<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

/**
 * Creates an error query result
 */
export function error(message: string, code?: string): QueryResult {
  return {
    data: null,
    error: code ? { message, code } : { message }
  };
}

/**
 * Mocks a simple INSERT query with .select().single()
 *
 * @example
 * ```typescript
 * mockInsert(mockSupabase, mockPrompt);
 * const result = await createPrompt(mockSupabase, 'org-1', input);
 * ```
 */
export function mockInsert<T>(
  client: MockSupabaseClient,
  data: T | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  client.from.mockReturnValue({ insert });
}

/**
 * Mocks a SELECT query with .eq().single()
 *
 * @example
 * ```typescript
 * mockSelectSingle(mockSupabase, mockInvite);
 * const result = await validateInviteToken(mockSupabase, 'token');
 * ```
 */
export function mockSelectSingle<T>(
  client: MockSupabaseClient,
  data: T | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  client.from.mockReturnValue({ select });
}

/**
 * Mocks a SELECT query with .eq().order() (for lists)
 *
 * @example
 * ```typescript
 * mockSelectList(mockSupabase, [mockInvite1, mockInvite2]);
 * const result = await listOrganizationInvites(mockSupabase, 'org-1');
 * ```
 */
export function mockSelectList<T>(
  client: MockSupabaseClient,
  data: T[] | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  const order = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  client.from.mockReturnValue({ select });
}

/**
 * Mocks an UPDATE query with .eq().eq().select().single()
 * This is used when updating by ID within an organization
 *
 * @example
 * ```typescript
 * mockUpdate(mockSupabase, updatedPrompt);
 * const result = await updatePrompt(mockSupabase, 'prompt-1', 'org-1', input);
 * ```
 */
export function mockUpdate<T>(
  client: MockSupabaseClient,
  data: T | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const eq2 = vi.fn().mockReturnValue({ select });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const update = vi.fn().mockReturnValue({ eq: eq1 });
  client.from.mockReturnValue({ update });
}

/**
 * Mocks a simple UPDATE query with .eq() (awaited directly, no .single())
 * Used for single-condition updates (e.g., revoking an invite by ID only)
 *
 * @example
 * ```typescript
 * mockUpdateSimple(mockSupabase, { is_active: false });
 * const result = await revokeInvite(mockSupabase, 'invite-1');
 * ```
 */
export function mockUpdateSimple<T>(
  client: MockSupabaseClient,
  data: T | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  const eq = vi.fn().mockResolvedValue(result);
  const update = vi.fn().mockReturnValue({ eq });
  client.from.mockReturnValue({ update });
}

/**
 * Mocks a DELETE query with .eq().eq()
 *
 * @example
 * ```typescript
 * mockDelete(mockSupabase);
 * const result = await deletePrompt(mockSupabase, 'prompt-1', 'org-1');
 * ```
 */
export function mockDelete(
  client: MockSupabaseClient,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data: null, error: null };
  const eq2 = vi.fn().mockResolvedValue(result);
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const deleteMethod = vi.fn().mockReturnValue({ eq: eq1 });
  client.from.mockReturnValue({ delete: deleteMethod });
}

/**
 * Mocks a SELECT query with .eq().eq().single()
 * Used for queries with two equality conditions (e.g., getPrompt by ID and org_id)
 *
 * @example
 * ```typescript
 * mockSelectWithDoubleEq(mockSupabase, mockPrompt);
 * const result = await getPrompt(mockSupabase, 'prompt-1', 'org-1');
 * ```
 */
export function mockSelectWithDoubleEq<T>(
  client: MockSupabaseClient,
  data: T | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  const single = vi.fn().mockResolvedValue(result);
  const eq2 = vi.fn().mockReturnValue({ single });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  client.from.mockReturnValue({ select });
}

/**
 * Mocks multiple sequential from() calls with different return values
 * Useful for tests that make multiple database queries
 *
 * @example
 * ```typescript
 * mockSequentialQueries(mockSupabase, [
 *   { type: 'selectSingle', result: mockInvite },
 *   { type: 'selectList', result: mockRedemptions }
 * ]);
 * const stats = await getInviteStats(mockSupabase, 'invite-1');
 * ```
 */
export interface QueryMock {
  type: 'insert' | 'selectSingle' | 'selectList' | 'update' | 'updateSimple' | 'delete' | 'selectWithDoubleEq' | 'selectMaxSortOrder';
  result: any;
  error?: any;
}

export function mockSequentialQueries(
  client: MockSupabaseClient,
  queries: QueryMock[]
) {
  const builders = queries.map(({ type, result, error: errorResult }) => {
    const queryResult = errorResult ? { data: null, error: errorResult } : { data: result, error: null };

    switch (type) {
      case 'insert': {
        const single = vi.fn().mockResolvedValue(queryResult);
        const select = vi.fn().mockReturnValue({ single });
        const insert = vi.fn().mockReturnValue({ select });
        return { insert };
      }
      case 'selectSingle': {
        const single = vi.fn().mockResolvedValue(queryResult);
        const eq = vi.fn().mockReturnValue({ single });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      }
      case 'selectList': {
        const order = vi.fn().mockResolvedValue(queryResult);
        const eq = vi.fn().mockReturnValue({ order });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      }
      case 'selectMaxSortOrder': {
        // Special pattern for getting max sort_order: .select().eq().order().limit().single()
        const single = vi.fn().mockResolvedValue(queryResult);
        const limit = vi.fn().mockReturnValue({ single });
        const order = vi.fn().mockReturnValue({ limit });
        const eq = vi.fn().mockReturnValue({ order });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      }
      case 'update': {
        const single = vi.fn().mockResolvedValue(queryResult);
        const select = vi.fn().mockReturnValue({ single });
        const eq2 = vi.fn().mockReturnValue({ select });
        const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
        const update = vi.fn().mockReturnValue({ eq: eq1 });
        return { update };
      }
      case 'updateSimple': {
        const single = vi.fn().mockResolvedValue(queryResult);
        const eq = vi.fn().mockReturnValue({ single });
        const update = vi.fn().mockReturnValue({ eq });
        return { update };
      }
      case 'delete': {
        const eq2 = vi.fn().mockResolvedValue(queryResult);
        const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
        const deleteMethod = vi.fn().mockReturnValue({ eq: eq1 });
        return { delete: deleteMethod };
      }
      case 'selectWithDoubleEq': {
        const single = vi.fn().mockResolvedValue(queryResult);
        const eq2 = vi.fn().mockReturnValue({ single });
        const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
        const select = vi.fn().mockReturnValue({ eq: eq1 });
        return { select };
      }
      default:
        return {};
    }
  });

  builders.forEach((builder) => {
    client.from.mockReturnValueOnce(builder);
  });
}

/**
 * Mocks an RPC call
 *
 * @example
 * ```typescript
 * mockRpc(mockSupabase, [{ id: 'user-1', email: 'test@example.com' }]);
 * const stats = await getInviteStats(mockSupabase, 'invite-1');
 * ```
 */
export function mockRpc<T>(
  client: MockSupabaseClient,
  data: T | null,
  errorResult?: any
) {
  const result = errorResult ? { data: null, error: errorResult } : { data, error: null };
  client.rpc.mockResolvedValueOnce(result);
}
