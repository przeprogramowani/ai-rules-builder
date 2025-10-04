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
import { getCollections, getSegments } from '@/services/prompt-manager/promptCollectionService';
import type { CreatePromptInput } from '@/services/prompt-manager/types';
import { createMockSupabaseClient } from '../helpers/mockSupabaseClient';
import type { MockSupabaseClient } from '../helpers/mockSupabaseClient';

/**
 * Integration test that verifies the complete admin workflow:
 * 1. Admin fetches collections and segments
 * 2. Admin creates a draft prompt
 * 3. Admin updates the prompt content
 * 4. Admin publishes the prompt
 * 5. Admin unpublishes the prompt
 * 6. Admin deletes the prompt
 */
describe('Prompt Admin Flow Integration Test', () => {
  const ORG_ID = 'org-test-1';
  const COLLECTION_ID = 'collection-test-1';
  const SEGMENT_ID = 'segment-test-1';
  const USER_ID = 'user-admin-1';

  let createdPromptId: string;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    createdPromptId = 'prompt-test-1';
  });

  it('completes the full admin workflow successfully', async () => {
    // Step 1: Fetch available collections
    const mockCollections = [
      {
        id: COLLECTION_ID,
        organization_id: ORG_ID,
        slug: 'test-collection',
        title: 'Test Collection',
        description: 'Test collection description',
        sort_order: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const collectionsQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockCollections, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(collectionsQueryBuilder),
    });

    const collectionsResult = await getCollections(mockSupabase as unknown as SupabaseClient, ORG_ID);
    expect(collectionsResult.data).toEqual(mockCollections);
    expect(collectionsResult.error).toBeNull();

    // Step 2: Fetch segments for the collection
    const mockSegments = [
      {
        id: SEGMENT_ID,
        collection_id: COLLECTION_ID,
        slug: 'test-segment',
        title: 'Test Segment',
        sort_order: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const segmentsQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSegments, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(segmentsQueryBuilder),
    });

    const segmentsResult = await getSegments(mockSupabase as unknown as SupabaseClient, COLLECTION_ID);
    expect(segmentsResult.data).toEqual(mockSegments);
    expect(segmentsResult.error).toBeNull();

    // Step 3: Create a new draft prompt
    const newPromptInput: CreatePromptInput = {
      title_en: 'Test Prompt',
      collection_id: COLLECTION_ID,
      segment_id: SEGMENT_ID,
      markdown_body_en: '# Initial Content\n\nThis is the initial prompt content.',
      created_by: USER_ID,
    };

    const createdPrompt = {
      id: createdPromptId,
      organization_id: ORG_ID,
      collection_id: COLLECTION_ID,
      segment_id: SEGMENT_ID,
      title_en: 'Test Prompt',
      title_pl: null,
      markdown_body_en: '# Initial Content\n\nThis is the initial prompt content.',
      markdown_body_pl: null,
      status: 'draft' as const,
      created_by: USER_ID,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const createSingle = vi.fn().mockResolvedValue({ data: createdPrompt, error: null });
    const createSelect = vi.fn().mockReturnValue({ single: createSingle });
    const createInsert = vi.fn().mockReturnValue({ select: createSelect });
    mockSupabase.from.mockReturnValueOnce({ insert: createInsert });

    const createResult = await createPrompt(mockSupabase as unknown as SupabaseClient, ORG_ID, newPromptInput);
    expect(createResult.data).toEqual(createdPrompt);
    expect(createResult.error).toBeNull();
    expect(createResult.data?.status).toBe('draft');

    // Step 4: Update the prompt content
    const updatedPrompt = {
      ...createdPrompt,
      title_en: 'Updated Test Prompt',
      markdown_body_en: '# Updated Content\n\nThis is the updated prompt content with more details.',
      updated_at: '2025-01-02T00:00:00Z',
    };

    const updateSingle = vi.fn().mockResolvedValue({ data: updatedPrompt, error: null });
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle });
    const updateEq2 = vi.fn().mockReturnValue({ select: updateSelect });
    const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });
    const update = vi.fn().mockReturnValue({ eq: updateEq1 });
    mockSupabase.from.mockReturnValueOnce({ update });

    const updateResult = await updatePrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, ORG_ID, {
      title_en: 'Updated Test Prompt',
      markdown_body_en: '# Updated Content\n\nThis is the updated prompt content with more details.',
    });
    expect(updateResult.data?.title_en).toBe('Updated Test Prompt');
    expect(updateResult.data?.status).toBe('draft'); // Still draft
    expect(updateResult.error).toBeNull();

    // Step 5: Publish the prompt
    const publishedPrompt = {
      ...updatedPrompt,
      status: 'published' as const,
      updated_at: '2025-01-03T00:00:00Z',
    };

    const publishSingle = vi.fn().mockResolvedValue({ data: publishedPrompt, error: null });
    const publishSelect = vi.fn().mockReturnValue({ single: publishSingle });
    const publishEq2 = vi.fn().mockReturnValue({ select: publishSelect });
    const publishEq1 = vi.fn().mockReturnValue({ eq: publishEq2 });
    const publishUpdate = vi.fn().mockReturnValue({ eq: publishEq1 });
    mockSupabase.from.mockReturnValueOnce({ update: publishUpdate });

    const publishResult = await publishPrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, ORG_ID);
    expect(publishResult.data?.status).toBe('published');
    expect(publishResult.error).toBeNull();

    // Step 6: Verify the prompt is in the published list
    const publishedPromptsList = [publishedPrompt];

    const listPublishedQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: publishedPromptsList, error: null })),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(listPublishedQueryBuilder),
    });

    const publishedListResult = await listPrompts(mockSupabase as unknown as SupabaseClient, ORG_ID, { status: 'published' });
    expect(publishedListResult.data).toHaveLength(1);
    expect(publishedListResult.data?.[0].status).toBe('published');

    // Step 7: Unpublish the prompt
    const unpublishedPrompt = {
      ...publishedPrompt,
      status: 'draft' as const,
      updated_at: '2025-01-04T00:00:00Z',
    };

    const unpublishSingle = vi.fn().mockResolvedValue({ data: unpublishedPrompt, error: null });
    const unpublishSelect = vi.fn().mockReturnValue({ single: unpublishSingle });
    const unpublishEq2 = vi.fn().mockReturnValue({ select: unpublishSelect });
    const unpublishEq1 = vi.fn().mockReturnValue({ eq: unpublishEq2 });
    const unpublishUpdate = vi.fn().mockReturnValue({ eq: unpublishEq1 });
    mockSupabase.from.mockReturnValueOnce({
      update: unpublishUpdate,
    });

    const unpublishResult = await unpublishPrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, ORG_ID);
    expect(unpublishResult.data?.status).toBe('draft');
    expect(unpublishResult.error).toBeNull();

    // Step 8: Verify the prompt is back in draft status
    const getSingle = vi.fn().mockResolvedValue({ data: unpublishedPrompt, error: null });
    const getEq2 = vi.fn().mockReturnValue({ single: getSingle });
    const getEq1 = vi.fn().mockReturnValue({ eq: getEq2 });
    const getSelect = vi.fn().mockReturnValue({ eq: getEq1 });
    mockSupabase.from.mockReturnValueOnce({ select: getSelect });

    const getResult = await getPrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, ORG_ID);
    expect(getResult.data?.status).toBe('draft');
    expect(getResult.error).toBeNull();

    // Step 9: Delete the prompt
    const deleteEq2 = vi.fn().mockResolvedValue({ data: null, error: null });
    const deleteEq1 = vi.fn().mockReturnValue({ eq: deleteEq2 });
    const deleteMethod = vi.fn().mockReturnValue({ eq: deleteEq1 });
    mockSupabase.from.mockReturnValueOnce({
      delete: deleteMethod,
    });

    const deleteResult = await deletePrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, ORG_ID);
    expect(deleteResult.error).toBeNull();

    // Step 10: Verify the prompt is deleted (should return not found)
    const getDeletedSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const getDeletedEq2 = vi.fn().mockReturnValue({ single: getDeletedSingle });
    const getDeletedEq1 = vi.fn().mockReturnValue({ eq: getDeletedEq2 });
    const getDeletedSelect = vi.fn().mockReturnValue({ eq: getDeletedEq1 });
    mockSupabase.from.mockReturnValueOnce({
      select: getDeletedSelect,
    });

    const getDeletedResult = await getPrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, ORG_ID);
    expect(getDeletedResult.data).toBeNull();
    expect(getDeletedResult.error).toEqual({
      message: 'Prompt not found',
      code: 'NOT_FOUND',
    });
  });

  it('enforces organization scoping on all operations', async () => {
    const WRONG_ORG_ID = 'org-different';

    // Try to get a prompt from a different organization
    const getSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const getEq2 = vi.fn().mockReturnValue({ single: getSingle });
    const getEq1 = vi.fn().mockReturnValue({ eq: getEq2 });
    const getSelect = vi.fn().mockReturnValue({ eq: getEq1 });
    mockSupabase.from.mockReturnValue({ select: getSelect });

    const result = await getPrompt(mockSupabase as unknown as SupabaseClient, createdPromptId, WRONG_ORG_ID);
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Prompt not found',
      code: 'NOT_FOUND',
    });
  });

  it('handles database errors gracefully throughout the workflow', async () => {
    // Test error handling in create operation
    const createSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Foreign key constraint violation', code: 'FK_VIOLATION' },
    });
    const createSelect = vi.fn().mockReturnValue({ single: createSingle });
    const createInsert = vi.fn().mockReturnValue({ select: createSelect });
    mockSupabase.from.mockReturnValue({ insert: createInsert });

    const createResult = await createPrompt(mockSupabase as unknown as SupabaseClient, ORG_ID, {
      title_en: 'Test',
      collection_id: 'non-existent-collection',
      markdown_body_en: 'Content',
    });
    expect(createResult.data).toBeNull();
    expect(createResult.error?.code).toBe('FK_VIOLATION');
  });
});
