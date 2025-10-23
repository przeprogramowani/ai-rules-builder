import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MockClientOptions {
  role?: 'member' | 'admin';
  userId?: string;
  orgId?: string;
  rlsEnabled?: boolean;
}

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  containedBy: ReturnType<typeof vi.fn>;
  rangeGt: ReturnType<typeof vi.fn>;
  rangeGte: ReturnType<typeof vi.fn>;
  rangeLt: ReturnType<typeof vi.fn>;
  rangeLte: ReturnType<typeof vi.fn>;
  rangeAdjacent: ReturnType<typeof vi.fn>;
  overlaps: ReturnType<typeof vi.fn>;
  textSearch: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  abortSignal: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  csv: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  mockSelect: (table: string, result: { data: unknown; error: unknown }) => void;
  mockInsert: (table: string, result: { data: unknown; error: unknown }) => void;
  mockUpdate: (table: string, result: { data: unknown; error: unknown }) => void;
  mockDelete: (table: string, result: { data: unknown; error: unknown }) => void;
  reset: () => void;
  _options?: MockClientOptions;
}

/**
 * Type helper to use MockSupabaseClient where SupabaseClient is expected
 * This is safe because our mock implements all the methods actually used by the services
 */
export type TestSupabaseClient = Pick<SupabaseClient, 'from' | 'rpc'>;

/**
 * Creates a mock Supabase client with comprehensive query builder support
 *
 * @param options - Optional configuration for role-based mocking
 * @returns A mock Supabase client that supports method chaining
 *
 * @example
 * ```typescript
 * const mockClient = createMockSupabaseClient();
 * mockClient.mockSelect('prompts', { data: [mockPrompt], error: null });
 * const result = await listPrompts(mockClient as unknown as SupabaseClient, 'org-1');
 * ```
 */
export function createMockSupabaseClient(
  options: MockClientOptions = {}
): MockSupabaseClient {
  const queryResults = new Map<string, unknown>();

  const createQueryBuilder = (table: string): MockQueryBuilder => {
    const currentResult = queryResults.get(table) || { data: [], error: null };

    const builder: MockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(currentResult),
      maybeSingle: vi.fn().mockResolvedValue(currentResult),
      csv: vi.fn().mockResolvedValue(currentResult),
      then: vi.fn((resolve) => resolve(currentResult)),
    };

    // Make mockReturnThis() return the builder itself for proper chaining
    Object.keys(builder).forEach((key) => {
      const method = builder[key as keyof MockQueryBuilder];
      if (method.mockReturnThis) {
        method.mockReturnThis = () => {
          method.mockReturnValue(builder);
          return method;
        };
      }
    });

    return builder;
  };

  const client: MockSupabaseClient = {
    from: vi.fn().mockImplementation((table: string) => createQueryBuilder(table)),

    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),

    mockSelect: (table: string, result: { data: unknown; error: unknown }) => {
      queryResults.set(table, result);
    },

    mockInsert: (table: string, result: { data: unknown; error: unknown }) => {
      queryResults.set(table, result);
    },

    mockUpdate: (table: string, result: { data: unknown; error: unknown }) => {
      queryResults.set(table, result);
    },

    mockDelete: (table: string, result: { data: unknown; error: unknown }) => {
      queryResults.set(table, result);
    },

    reset: () => {
      queryResults.clear();
      vi.clearAllMocks();
    },

    _options: options,
  };

  return client;
}

/**
 * Creates a mock Supabase client configured for a member user
 *
 * @param orgId - Organization ID the member belongs to
 * @param userId - User ID of the member
 * @returns A mock Supabase client with member role context
 */
export function createMemberMockClient(
  orgId: string,
  userId: string
): MockSupabaseClient {
  return createMockSupabaseClient({
    role: 'member',
    orgId,
    userId,
    rlsEnabled: true,
  });
}

/**
 * Creates a mock Supabase client configured for an admin user
 *
 * @param orgId - Organization ID the admin belongs to
 * @param userId - User ID of the admin
 * @returns A mock Supabase client with admin role context
 */
export function createAdminMockClient(
  orgId: string,
  userId: string
): MockSupabaseClient {
  return createMockSupabaseClient({
    role: 'admin',
    orgId,
    userId,
    rlsEnabled: true,
  });
}
