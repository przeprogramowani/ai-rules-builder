import { beforeEach, describe, expect, it, vi } from 'vitest';
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

// Mock the supabase admin client
vi.mock('@/db/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '@/db/supabase-admin';

type QueryBuilder = {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
};

function createQueryBuilder(result: { data: unknown; error: unknown }): QueryBuilder {
  const single = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }), select: vi.fn().mockReturnValue({ single }), single });
  const select = vi.fn().mockReturnValue({ eq, single, order });
  const insert = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const deleteMethod = vi.fn().mockReturnValue({ eq });

  return { insert, update, delete: deleteMethod, select, eq, single, order };
}

describe('promptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('creates a new draft prompt successfully', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title: 'Test Prompt',
        markdown_body: '# Test Content',
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreatePromptInput = {
        title: 'Test Prompt',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        markdown_body: '# Test Content',
        created_by: 'user-1',
      };

      const result = await createPrompt('org-1', input);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompts');
      expect(insert).toHaveBeenCalledWith({
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title: 'Test Prompt',
        markdown_body: '# Test Content',
        status: 'draft',
        created_by: 'user-1',
      });
      expect(result.data).toEqual(mockPrompt);
      expect(result.error).toBeNull();
    });

    it('creates prompt with null segment_id when not provided', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-2',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: null,
        title: 'Test Prompt',
        markdown_body: '# Test Content',
        status: 'draft',
        created_by: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreatePromptInput = {
        title: 'Test Prompt',
        collection_id: 'collection-1',
        markdown_body: '# Test Content',
      };

      const result = await createPrompt('org-1', input);

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          segment_id: null,
          created_by: null,
        })
      );
      expect(result.data).toEqual(mockPrompt);
    });

    it('returns error when database insert fails', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreatePromptInput = {
        title: 'Test Prompt',
        collection_id: 'collection-1',
        markdown_body: '# Test Content',
      };

      const result = await createPrompt('org-1', input);

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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const input: CreatePromptInput = {
        title: 'Test Prompt',
        collection_id: 'collection-1',
        markdown_body: '# Test Content',
      };

      const result = await createPrompt('org-1', input);

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
        title: 'Updated Prompt',
        markdown_body: '# Updated Content',
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const input: UpdatePromptInput = {
        title: 'Updated Prompt',
        markdown_body: '# Updated Content',
      };

      const result = await updatePrompt('prompt-1', 'org-1', input);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompts');
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Prompt',
          markdown_body: '# Updated Content',
          updated_at: expect.any(String),
        })
      );
      expect(result.data).toEqual(mockPrompt);
      expect(result.error).toBeNull();
    });

    it('updates only specified fields', async () => {
      const mockPrompt: Prompt = {
        id: 'prompt-1',
        organization_id: 'org-1',
        collection_id: 'collection-1',
        segment_id: 'segment-1',
        title: 'Updated Title Only',
        markdown_body: '# Original Content',
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const input: UpdatePromptInput = {
        title: 'Updated Title Only',
      };

      const result = await updatePrompt('prompt-1', 'org-1', input);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title Only',
          updated_at: expect.any(String),
        })
      );
      expect(update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          markdown_body: expect.anything(),
        })
      );
      expect(result.data).toEqual(mockPrompt);
    });

    it('returns error when prompt not found', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const input: UpdatePromptInput = {
        title: 'Updated Prompt',
      };

      const result = await updatePrompt('prompt-1', 'org-1', input);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found or access denied',
        code: 'NOT_FOUND',
      });
    });

    it('returns error when database update fails', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: 'UPDATE_ERROR' },
      });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const input: UpdatePromptInput = {
        title: 'Updated Prompt',
      };

      const result = await updatePrompt('prompt-1', 'org-1', input);

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
        title: 'Test Prompt',
        markdown_body: '# Test Content',
        status: 'published',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const result = await publishPrompt('prompt-1', 'org-1');

      expect(update).toHaveBeenCalledWith({
        status: 'published',
        updated_at: expect.any(String),
      });
      expect(result.data?.status).toBe('published');
      expect(result.error).toBeNull();
    });

    it('returns error when prompt not found', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const result = await publishPrompt('prompt-1', 'org-1');

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
        title: 'Test Prompt',
        markdown_body: '# Test Content',
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const result = await unpublishPrompt('prompt-1', 'org-1');

      expect(update).toHaveBeenCalledWith({
        status: 'draft',
        updated_at: expect.any(String),
      });
      expect(result.data?.status).toBe('draft');
      expect(result.error).toBeNull();
    });

    it('returns error when prompt not found', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq2 = vi.fn().mockReturnValue({ select });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const update = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

      const result = await unpublishPrompt('prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found or access denied',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('deletePrompt', () => {
    it('deletes a prompt successfully', async () => {
      const eq2 = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const deleteMethod = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ delete: deleteMethod });

      const result = await deletePrompt('prompt-1', 'org-1');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompts');
      expect(deleteMethod).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('returns error when database delete fails', async () => {
      const eq2 = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed', code: 'DELETE_ERROR' },
      });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const deleteMethod = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ delete: deleteMethod });

      const result = await deletePrompt('prompt-1', 'org-1');

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
        title: 'Test Prompt',
        markdown_body: '# Test Content',
        status: 'draft',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: mockPrompt, error: null });
      const eq2 = vi.fn().mockReturnValue({ single });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getPrompt('prompt-1', 'org-1');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompts');
      expect(select).toHaveBeenCalledWith('*');
      expect(result.data).toEqual(mockPrompt);
      expect(result.error).toBeNull();
    });

    it('returns error when prompt not found', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq2 = vi.fn().mockReturnValue({ single });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getPrompt('prompt-1', 'org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Prompt not found',
        code: 'NOT_FOUND',
      });
    });

    it('returns error when database query fails', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed', code: 'QUERY_ERROR' },
      });
      const eq2 = vi.fn().mockReturnValue({ single });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq: eq1 });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await getPrompt('prompt-1', 'org-1');

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
          title: 'Prompt 1',
          markdown_body: '# Content 1',
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
          title: 'Prompt 2',
          markdown_body: '# Content 2',
          status: 'draft',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const order = vi.fn().mockResolvedValue({ data: mockPrompts, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await listPrompts('org-1');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('prompts');
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
          title: 'Prompt 1',
          markdown_body: '# Content 1',
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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await listPrompts('org-1', { status: 'published' });

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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await listPrompts('org-1', { collection_id: 'collection-2' });

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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await listPrompts('org-1', { segment_id: 'segment-2' });

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no prompts found', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await listPrompts('org-1');

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

      const result = await listPrompts('org-1');

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
      (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      await listPrompts('org-1');

      expect(eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });
  });
});
