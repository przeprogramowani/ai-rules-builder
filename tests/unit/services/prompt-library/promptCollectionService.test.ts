import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getCollections,
  getSegments,
  createCollection,
  createSegment,
} from '@/services/prompt-library/promptCollectionService';
import type {
  PromptCollection,
  PromptSegment,
  CreateCollectionInput,
  CreateSegmentInput,
} from '@/services/prompt-library/types';
import { createMockSupabaseClient } from '../../../helpers/mockSupabaseClient';
import type { MockSupabaseClient } from '../../../helpers/mockSupabaseClient';
import {
  mockInsert,
  mockSelectList,
  mockSequentialQueries,
} from '../../../helpers/mockQueryBuilders';

describe('collectionService', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('getCollections', () => {
    it('retrieves all collections for an organization ordered by sort_order', async () => {
      const mockCollections: PromptCollection[] = [
        {
          id: 'coll-1',
          organization_id: 'org-1',
          slug: 'fundamentals',
          title: 'Fundamentals',
          description: 'Core concepts',
          sort_order: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'coll-2',
          organization_id: 'org-1',
          slug: 'advanced',
          title: 'Advanced Topics',
          description: 'Advanced concepts',
          sort_order: 2,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSelectList(mockSupabase, mockCollections);

      const result = await getCollections(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_collections');
      expect(result.data).toEqual(mockCollections);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no collections exist', async () => {
      mockSelectList(mockSupabase, []);

      const result = await getCollections(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('returns error when database query fails', async () => {
      mockSelectList(mockSupabase, null, { message: 'Query failed', code: 'QUERY_ERROR' });

      const result = await getCollections(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Query failed',
        code: 'QUERY_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      const select = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      mockSupabase.from.mockReturnValue({ select });

      const result = await getCollections(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unexpected error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('filters collections by organization', async () => {
      const mockCollections: PromptCollection[] = [
        {
          id: 'coll-1',
          organization_id: 'org-1',
          slug: 'fundamentals',
          title: 'Fundamentals',
          description: 'Core concepts',
          sort_order: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSelectList(mockSupabase, mockCollections);

      await getCollections(mockSupabase as unknown as SupabaseClient, 'org-1');
    });
  });

  describe('getSegments', () => {
    it('retrieves all segments for a collection ordered by sort_order', async () => {
      const mockSegments: PromptSegment[] = [
        {
          id: 'seg-1',
          collection_id: 'coll-1',
          slug: 'getting-started',
          title: 'Getting Started',
          sort_order: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'seg-2',
          collection_id: 'coll-1',
          slug: 'best-practices',
          title: 'Best Practices',
          sort_order: 2,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSelectList(mockSupabase, mockSegments);

      const result = await getSegments(mockSupabase as unknown as SupabaseClient, 'coll-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_collection_segments');
      expect(result.data).toEqual(mockSegments);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no segments exist', async () => {
      mockSelectList(mockSupabase, []);

      const result = await getSegments(mockSupabase as unknown as SupabaseClient, 'coll-1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('returns error when database query fails', async () => {
      mockSelectList(mockSupabase, null, { message: 'Query failed', code: 'QUERY_ERROR' });

      const result = await getSegments(mockSupabase as unknown as SupabaseClient, 'coll-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Query failed',
        code: 'QUERY_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      const select = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      mockSupabase.from.mockReturnValue({ select });

      const result = await getSegments(mockSupabase as unknown as SupabaseClient, 'coll-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unexpected error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('createCollection', () => {
    it('creates a new collection successfully', async () => {
      const mockCollection: PromptCollection = {
        id: 'coll-1',
        organization_id: 'org-1',
        slug: 'new-collection',
        title: 'New Collection',
        description: 'A new collection',
        sort_order: 3,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockInsert(mockSupabase, mockCollection);

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
        description: 'A new collection',
        sort_order: 3,
      };

      const result = await createCollection(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_collections');
      expect(result.data).toEqual(mockCollection);
      expect(result.error).toBeNull();
    });

    it('creates collection with default sort_order when not provided', async () => {
      const mockCollection: PromptCollection = {
        id: 'coll-1',
        organization_id: 'org-1',
        slug: 'new-collection',
        title: 'New Collection',
        description: null,
        sort_order: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSequentialQueries(mockSupabase, [
        { type: 'selectMaxSortOrder', result: null },
        { type: 'insert', result: mockCollection }
      ]);

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
      };

      const result = await createCollection(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(result.data).toEqual(mockCollection);
    });

    it('returns error when database insert fails', async () => {
      mockSequentialQueries(mockSupabase, [
        { type: 'selectMaxSortOrder', result: null },
        { type: 'insert', result: null, error: { message: 'Insert failed', code: 'INSERT_ERROR' } }
      ]);

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
      };

      const result = await createCollection(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Insert failed',
        code: 'INSERT_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      // Mock to throw an error
      const select = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      mockSupabase.from.mockReturnValue({ select });

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
      };

      const result = await createCollection(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unexpected error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('createSegment', () => {
    it('creates a new segment successfully', async () => {
      const mockSegment: PromptSegment = {
        id: 'seg-1',
        collection_id: 'coll-1',
        slug: 'new-segment',
        title: 'New Segment',
        sort_order: 3,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockInsert(mockSupabase, mockSegment);

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
        sort_order: 3,
      };

      const result = await createSegment(mockSupabase as unknown as SupabaseClient, 'coll-1', input);

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_collection_segments');
      expect(result.data).toEqual(mockSegment);
      expect(result.error).toBeNull();
    });

    it('creates segment with default sort_order when not provided', async () => {
      const mockSegment: PromptSegment = {
        id: 'seg-1',
        collection_id: 'coll-1',
        slug: 'new-segment',
        title: 'New Segment',
        sort_order: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSequentialQueries(mockSupabase, [
        { type: 'selectMaxSortOrder', result: null },
        { type: 'insert', result: mockSegment }
      ]);

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
      };

      const result = await createSegment(mockSupabase as unknown as SupabaseClient, 'coll-1', input);

      expect(result.data).toEqual(mockSegment);
    });

    it('returns error when database insert fails', async () => {
      mockSequentialQueries(mockSupabase, [
        { type: 'selectMaxSortOrder', result: null },
        { type: 'insert', result: null, error: { message: 'Insert failed', code: 'INSERT_ERROR' } }
      ]);

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
      };

      const result = await createSegment(mockSupabase as unknown as SupabaseClient, 'coll-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Insert failed',
        code: 'INSERT_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      // Mock to throw an error
      const select = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      mockSupabase.from.mockReturnValue({ select });

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
      };

      const result = await createSegment(mockSupabase as unknown as SupabaseClient, 'coll-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unexpected error',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});
