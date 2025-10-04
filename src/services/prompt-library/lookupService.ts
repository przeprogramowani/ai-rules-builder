/**
 * Lookup service for resolving prompts resources by slug or ID
 */

import type { PromptCollection, PromptSegment } from '@/store/promptsStore';
import { isUUID } from '@/utils/urlParams';

/**
 * Find a collection by slug or ID within an organization
 */
export async function findCollectionBySlugOrId(
  orgId: string,
  slugOrId: string,
): Promise<PromptCollection | null> {
  const normalized = slugOrId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  try {
    // If it's a UUID, try to find by ID directly
    if (isUUID(normalized)) {
      const response = await fetch(
        `/api/prompts/collections?organization_id=${orgId}&id=${normalized}`,
      );
      if (response.ok) {
        const collections = (await response.json()) as PromptCollection[];
        return collections.find((c) => c.id === normalized) ?? null;
      }
    }

    // Try to find by slug using the new API endpoint
    const response = await fetch(
      `/api/prompts/collections/by-slug?org_id=${orgId}&slug=${encodeURIComponent(normalized)}`,
    );

    if (!response.ok) {
      return null;
    }

    const collection = (await response.json()) as PromptCollection;
    return collection;
  } catch (error) {
    console.error('[lookupService] findCollectionBySlugOrId failed', error);
    return null;
  }
}

/**
 * Find a segment by slug or ID within a collection
 */
export async function findSegmentBySlugOrId(
  collectionId: string,
  slugOrId: string,
): Promise<PromptSegment | null> {
  const normalized = slugOrId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  try {
    // If it's a UUID, try to find by ID directly
    if (isUUID(normalized)) {
      const response = await fetch(`/api/prompts/collections/${collectionId}/segments`);
      if (response.ok) {
        const segments = (await response.json()) as PromptSegment[];
        return segments.find((s) => s.id === normalized) ?? null;
      }
    }

    // Try to find by slug using the new API endpoint
    const response = await fetch(
      `/api/prompts/segments/by-slug?collection_id=${collectionId}&slug=${encodeURIComponent(normalized)}`,
    );

    if (!response.ok) {
      return null;
    }

    const segment = (await response.json()) as PromptSegment;
    return segment;
  } catch (error) {
    console.error('[lookupService] findSegmentBySlugOrId failed', error);
    return null;
  }
}
