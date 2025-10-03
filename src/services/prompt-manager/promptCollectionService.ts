import { supabaseAdmin } from '@/db/supabase-admin';
import { slugify } from '@/utils/slugify';
import type {
  PromptCollection,
  PromptSegment,
  CreateCollectionInput,
  CreateSegmentInput,
  ServiceResult,
} from './types';

/**
 * Get all collections for an organization, ordered by sort_order
 */
export async function getCollections(
  organizationId: string,
): Promise<ServiceResult<PromptCollection[]>> {
  try {
    const { data: collections, error } = await supabaseAdmin
      .from('prompt_collections')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true });

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: (collections as PromptCollection[]) || [], error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Get a collection by slug within an organization
 */
export async function getCollectionBySlug(
  organizationId: string,
  slug: string,
): Promise<ServiceResult<PromptCollection>> {
  try {
    const normalizedSlug = slug.trim().toLowerCase();

    const { data: collection, error } = await supabaseAdmin
      .from('prompt_collections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    if (!collection) {
      return {
        data: null,
        error: { message: 'Collection not found', code: 'NOT_FOUND' },
      };
    }

    return { data: collection as PromptCollection, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Get all segments for a collection, ordered by sort_order
 */
export async function getSegments(collectionId: string): Promise<ServiceResult<PromptSegment[]>> {
  try {
    const { data: segments, error } = await supabaseAdmin
      .from('prompt_collection_segments')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: (segments as PromptSegment[]) || [], error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Get a segment by slug within a collection
 */
export async function getSegmentBySlug(
  collectionId: string,
  slug: string,
): Promise<ServiceResult<PromptSegment>> {
  try {
    const normalizedSlug = slug.trim().toLowerCase();

    const { data: segment, error } = await supabaseAdmin
      .from('prompt_collection_segments')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    if (!segment) {
      return {
        data: null,
        error: { message: 'Segment not found', code: 'NOT_FOUND' },
      };
    }

    return { data: segment as PromptSegment, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Create a new collection (admin only)
 */
export async function createCollection(
  organizationId: string,
  data: CreateCollectionInput,
): Promise<ServiceResult<PromptCollection>> {
  try {
    // Auto-generate slug from title if not provided
    const slug = data.slug || slugify(data.title);

    // Calculate sort_order if not provided
    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const { data: maxResult } = await supabaseAdmin
        .from('prompt_collections')
        .select('sort_order')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      sortOrder = maxResult ? maxResult.sort_order + 1 : 0;
    }

    const { data: collection, error } = await supabaseAdmin
      .from('prompt_collections')
      .insert({
        organization_id: organizationId,
        slug,
        title: data.title,
        description: data.description ?? null,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: collection as PromptCollection, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}

/**
 * Create a new segment within a collection (admin only)
 */
export async function createSegment(
  collectionId: string,
  data: CreateSegmentInput,
): Promise<ServiceResult<PromptSegment>> {
  try {
    // Auto-generate slug from title if not provided
    const slug = data.slug || slugify(data.title);

    // Calculate sort_order if not provided
    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const { data: maxResult } = await supabaseAdmin
        .from('prompt_collection_segments')
        .select('sort_order')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      sortOrder = maxResult ? maxResult.sort_order + 1 : 0;
    }

    const { data: segment, error } = await supabaseAdmin
      .from('prompt_collection_segments')
      .insert({
        collection_id: collectionId,
        slug,
        title: data.title,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code || 'UNKNOWN_ERROR' },
      };
    }

    return { data: segment as PromptSegment, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message, code: 'INTERNAL_ERROR' },
    };
  }
}
