import { supabaseAdmin } from '@/db/supabase-admin';
import type {
  Prompt,
  CreatePromptInput,
  UpdatePromptInput,
  PromptFilters,
  ServiceResult,
} from './types';

/**
 * Create a new draft prompt
 */
export async function createPrompt(
  organizationId: string,
  data: CreatePromptInput,
): Promise<ServiceResult<Prompt>> {
  try {
    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .insert({
        organization_id: organizationId,
        collection_id: data.collection_id,
        segment_id: data.segment_id ?? null,
        title: data.title,
        markdown_body: data.markdown_body,
        status: 'draft',
        created_by: data.created_by ?? null,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: prompt as Prompt, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(
  promptId: string,
  organizationId: string,
  data: UpdatePromptInput,
): Promise<ServiceResult<Prompt>> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.markdown_body !== undefined) updateData.markdown_body = data.markdown_body;
    if (data.segment_id !== undefined) updateData.segment_id = data.segment_id;

    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .update(updateData)
      .eq('id', promptId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    if (!prompt) {
      return {
        data: null,
        error: { message: 'Prompt not found or access denied', code: 'NOT_FOUND' },
      };
    }

    return { data: prompt as Prompt, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Publish a prompt (change status to published)
 */
export async function publishPrompt(
  promptId: string,
  organizationId: string,
): Promise<ServiceResult<Prompt>> {
  try {
    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    if (!prompt) {
      return {
        data: null,
        error: { message: 'Prompt not found or access denied', code: 'NOT_FOUND' },
      };
    }

    return { data: prompt as Prompt, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Unpublish a prompt (revert status to draft)
 */
export async function unpublishPrompt(
  promptId: string,
  organizationId: string,
): Promise<ServiceResult<Prompt>> {
  try {
    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    if (!prompt) {
      return {
        data: null,
        error: { message: 'Prompt not found or access denied', code: 'NOT_FOUND' },
      };
    }

    return { data: prompt as Prompt, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Delete a prompt
 */
export async function deletePrompt(
  promptId: string,
  organizationId: string,
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabaseAdmin
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .eq('organization_id', organizationId);

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: undefined as void, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Get a single prompt by ID
 */
export async function getPrompt(
  promptId: string,
  organizationId: string,
): Promise<ServiceResult<Prompt>> {
  try {
    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    if (!prompt) {
      return {
        data: null,
        error: { message: 'Prompt not found', code: 'NOT_FOUND' },
      };
    }

    return { data: prompt as Prompt, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * List prompts with optional filtering
 */
export async function listPrompts(
  organizationId: string,
  filters?: PromptFilters,
): Promise<ServiceResult<Prompt[]>> {
  try {
    let query = supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.collection_id) {
      query = query.eq('collection_id', filters.collection_id);
    }

    if (filters?.segment_id) {
      query = query.eq('segment_id', filters.segment_id);
    }

    const { data: prompts, error } = await query;

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: (prompts as Prompt[]) || [], error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}
