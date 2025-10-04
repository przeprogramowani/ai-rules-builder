import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createPrompt,
  updatePrompt,
  publishPrompt,
  unpublishPrompt,
  deletePrompt,
  getPrompt,
  listPrompts,
} from '@/services/prompt-manager/promptService';
import type { Prompt, CreatePromptInput, UpdatePromptInput } from '@/services/prompt-manager/types';
import { createMockSupabaseClient } from '../../../helpers/mockSupabaseClient';
import type { MockSupabaseClient } from '../../../helpers/mockSupabaseClient';
import {
  mockInsert,
  mockUpdate,
  mockDelete,
  mockSelectWithDoubleEq,
} from '../../../helpers/mockQueryBuilders';

describe('promptService', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('creates a new draft prompt successfully', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title_en: 'Test Prompt',
        title_pl: null,
        markdown_body_en: '# Test Content',
        markdown_body_pl: null,
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockInsert(mockSupabase, mockPrompt);

      const input: CreatePromptInput = {
        title_en: 'Test Prompt',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        markdown_body_en: '# Test Content',
        created_by: 'user-1',
      };

      const result = await createPrompt(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
      expect(result.data).toEqual(mockPrompt);
      expect(result.error).toBeNull();
    });

    it('creates prompt with null segment_id when not provided', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-2',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: null,
        title_en: 'Test Prompt',
        title_pl: null,
        markdown_body_en: '# Test Content',
        markdown_body_pl: null,
        status: 'draft',
        created_by: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockInsert(mockSupabase, mockPrompt);

      const input: CreatePromptInput = {
        title_en: 'Test Prompt',
        collection_id: 'collection-1',
        markdown_body_en: '# Test Content',
      };

      const result = await createPrompt(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(result.data).toEqual(mockPrompt);
    });

    it('returns error when database insert fails', async () => {
      mockInsert(mockSupabase, null, { message: 'Database error', code: 'DB_ERROR' });

      const input: CreatePromptInput = {
        title_en: 'Test Prompt',
        collection_id: 'collection-1',
        markdown_body_en: '# Test Content',
      };

      const result = await createPrompt(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Database error',
        code: 'DB_ERROR',
      });
    });

    it('handles unexpected exceptions', async () => {
      const insert = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      mockSupabase.from.mockReturnValue({ insert });

      const input: CreatePromptInput = {
        title_en: 'Test Prompt',
        collection_id: 'collection-1',
        markdown_body_en: '# Test Content',
      };

      const result = await createPrompt(mockSupabase as unknown as SupabaseClient, 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unexpected error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('updatePrompt', () => {
    it('updates an existing prompt successfully', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title_en: 'Updated Prompt',
        title_pl: null,
        markdown_body_en: '# Updated Content',
        markdown_body_pl: null,
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      mockUpdate(mockSupabase, mockPrompt);

      const input: UpdatePromptInput = {
        title_en: 'Updated Prompt',
        markdown_body_en: '# Updated Content',
      };

      const result = await updatePrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1', input);

      expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
      expect(result.data).toEqual(mockPrompt);
      expect(result.error).toBeNull();
    });

    it('updates only specified fields', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title_en: 'Updated Title Only',
        title_pl: null,
        markdown_body_en: '# Original Content',
        markdown_body_pl: null,
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      mockUpdate(mockSupabase, mockPrompt);

      const input: UpdatePromptInput = {
        title_en: 'Updated Title Only',
      };

      const result = await updatePrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1', input);

      expect(result.data).toEqual(mockPrompt);
    });

    it('returns error when prompt not found', async () => {
      mockUpdate(mockSupabase, null);

      const input: UpdatePromptInput = {
        title_en: 'Updated Prompt',
      };

      const result = await updatePrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found or access denied',
        code: 'NOT_FOUND',
      });
    });

    it('returns error when database update fails', async () => {
      mockUpdate(mockSupabase, null, { message: 'Update failed', code: 'UPDATE_ERROR' });

      const input: UpdatePromptInput = {
        title_en: 'Updated Prompt',
      };

      const result = await updatePrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Update failed',
        code: 'UPDATE_ERROR',
      });
    });
  });

  describe('publishPrompt', () => {
    it('publishes a prompt successfully', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title_en: 'Test Prompt',
        title_pl: null,
        markdown_body_en: '# Test Content',
        markdown_body_pl: null,
        status: 'published',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      mockUpdate(mockSupabase, mockPrompt);

      const result = await publishPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data?.status).toBe('published');
      expect(result.error).toBeNull();
    });

    it('returns error when prompt not found', async () => {
      mockUpdate(mockSupabase, null);

      const result = await publishPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found or access denied',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('unpublishPrompt', () => {
    it('unpublishes a prompt successfully', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title_en: 'Test Prompt',
        title_pl: null,
        markdown_body_en: '# Test Content',
        markdown_body_pl: null,
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      mockUpdate(mockSupabase, mockPrompt);

      const result = await unpublishPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data?.status).toBe('draft');
      expect(result.error).toBeNull();
    });

    it('returns error when prompt not found', async () => {
      mockUpdate(mockSupabase, null);

      const result = await unpublishPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found or access denied',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('deletePrompt', () => {
    it('deletes a prompt successfully', async () => {
      mockDelete(mockSupabase);

      const result = await deletePrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
      expect(result.error).toBeNull();
    });

    it('returns error when database delete fails', async () => {
      mockDelete(mockSupabase, { message: 'Delete failed', code: 'DELETE_ERROR' });

      const result = await deletePrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Delete failed',
        code: 'DELETE_ERROR',
      });
    });
  });

  describe('getPrompt', () => {
    it('retrieves a single prompt successfully', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title_en: 'Test Prompt',
        title_pl: null,
        markdown_body_en: '# Test Content',
        markdown_body_pl: null,
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSelectWithDoubleEq(mockSupabase, mockPrompt);

      const result = await getPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
      expect(result.data).toEqual(mockPrompt);
      expect(result.error).toBeNull();
    });

    it('returns error when prompt not found', async () => {
      mockSelectWithDoubleEq(mockSupabase, null);

      const result = await getPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found',
        code: 'NOT_FOUND',
      });
    });

    it('returns error when database query fails', async () => {
      mockSelectWithDoubleEq(mockSupabase, null, { message: 'Query failed', code: 'QUERY_ERROR' });

      const result = await getPrompt(mockSupabase as unknown as SupabaseClient, 'prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Query failed',
        code: 'QUERY_ERROR',
      });
    });
  });

  describe('listPrompts', () => {
    it('lists all prompts for an organization', async () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'prompt-1',
          organization_id: 'org-1',
          collection_id: 'collection-1',
          segment_id: 'segment-1',
          title_en: 'Prompt 1',
          title_pl: null,
          markdown_body_en: '# Content 1',
          markdown_body_pl: null,
          status: 'published',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        {
          id: 'prompt-2',
          organization_id: 'org-1',
          collection_id: 'collection-1',
          segment_id: null,
          title_en: 'Prompt 2',
          title_pl: null,
          markdown_body_en: '# Content 2',
          markdown_body_pl: null,
          status: 'draft',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const order = vi.fn().mockResolvedValue({ data: mockPrompts, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
      expect(select).toHaveBeenCalledWith('*');
      expect(order).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result.data).toEqual(mockPrompts);
      expect(result.error).toBeNull();
    });

    it('filters prompts by status', async () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'prompt-1',
          organization_id: 'org-1',
          collection_id: 'collection-1',
          segment_id: 'segment-1',
          title_en: 'Prompt 1',
          title_pl: null,
          markdown_body_en: '# Content 1',
          markdown_body_pl: null,
          status: 'published',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      // Create a chainable query builder mock
      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockPrompts, error: null })),
      };

      const select = vi.fn().mockReturnValue(queryBuilder);
      mockSupabase.from.mockReturnValue({ select });

      const result = await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1', { status: 'published' });

      expect(result.data).toEqual(mockPrompts);
      expect(result.error).toBeNull();
    });

    it('filters prompts by collection_id', async () => {
      const mockPrompts: Prompt[] = [];

      // Create a chainable query builder mock
      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockPrompts, error: null })),
      };

      const select = vi.fn().mockReturnValue(queryBuilder);
      mockSupabase.from.mockReturnValue({ select });

      const result = await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1', { collection_id: 'collection-2' });

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('filters prompts by segment_id', async () => {
      const mockPrompts: Prompt[] = [];

      // Create a chainable query builder mock
      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockPrompts, error: null })),
      };

      const select = vi.fn().mockReturnValue(queryBuilder);
      mockSupabase.from.mockReturnValue({ select });

      const result = await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1', { segment_id: 'segment-2' });

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no prompts found', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1');

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
      mockSupabase.from.mockReturnValue({ select });

      const result = await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Query failed',
        code: 'QUERY_ERROR',
      });
    });

    it('enforces organization scoping', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      await listPrompts(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });
  });
});
