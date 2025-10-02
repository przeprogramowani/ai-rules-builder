import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCollections,
  getSegments,
  createCollection,
  createSegment,
} from '@/services/prompt-manager/collectionService';
import type {
  PromptCollection,
  PromptSegment,
  CreateCollectionInput,
  CreateSegmentInput,
} from '@/services/prompt-manager/types';

// Mock the supabase admin client
vi.mock('@/db/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '@/db/supabase-admin';

describe('collectionService', () => {
  beforeEach(() => {
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

      const order = vi.fn().mockResolvedValue({ data: mockCollections, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getCollections('org-1');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompt_collections');
      expect(select).toHaveBeenCalledWith('*');
      expect(eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result.data).toEqual(mockCollections);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no collections exist', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getCollections('org-1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('returns error when database query fails', async () => {
      const order = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed', code: 'QUERY_ERROR' },
      });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getCollections('org-1');

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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getCollections('org-1');

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

      const order = vi.fn().mockResolvedValue({ data: mockCollections, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      await getCollections('org-1');

      expect(eq).toHaveBeenCalledWith('organization_id', 'org-1');
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

      const order = vi.fn().mockResolvedValue({ data: mockSegments, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getSegments('coll-1');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompt_collection_segments');
      expect(select).toHaveBeenCalledWith('*');
      expect(eq).toHaveBeenCalledWith('collection_id', 'coll-1');
      expect(order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result.data).toEqual(mockSegments);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no segments exist', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getSegments('coll-1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('returns error when database query fails', async () => {
      const order = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed', code: 'QUERY_ERROR' },
      });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getSegments('coll-1');

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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getSegments('coll-1');

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

      const single = vi.fn().mockResolvedValue({ data: mockCollection, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
        description: 'A new collection',
        sort_order: 3,
      };

      const result = await createCollection('org-1', input);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompt_collections');
      expect(insert).toHaveBeenCalledWith({
        organization_id: 'org-1',
        slug: 'new-collection',
        title: 'New Collection',
        description: 'A new collection',
        sort_order: 3,
      });
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

      const single = vi.fn().mockResolvedValue({ data: mockCollection, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
      };

      const result = await createCollection('org-1', input);

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_order: 0,
          description: null,
        })
      );
      expect(result.data).toEqual(mockCollection);
    });

    it('returns error when database insert fails', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed', code: 'INSERT_ERROR' },
      });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
      };

      const result = await createCollection('org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Insert failed',
        code: 'INSERT_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      const insert = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateCollectionInput = {
        slug: 'new-collection',
        title: 'New Collection',
      };

      const result = await createCollection('org-1', input);

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

      const single = vi.fn().mockResolvedValue({ data: mockSegment, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
        sort_order: 3,
      };

      const result = await createSegment('coll-1', input);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompt_collection_segments');
      expect(insert).toHaveBeenCalledWith({
        collection_id: 'coll-1',
        slug: 'new-segment',
        title: 'New Segment',
        sort_order: 3,
      });
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

      const single = vi.fn().mockResolvedValue({ data: mockSegment, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
      };

      const result = await createSegment('coll-1', input);

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_order: 0,
        })
      );
      expect(result.data).toEqual(mockSegment);
    });

    it('returns error when database insert fails', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed', code: 'INSERT_ERROR' },
      });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
      };

      const result = await createSegment('coll-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Insert failed',
        code: 'INSERT_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      const insert = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreateSegmentInput = {
        slug: 'new-segment',
        title: 'New Segment',
      };

      const result = await createSegment('coll-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unexpected error',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});
