import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '../../../../features/featureFlags';
import { getSegmentBySlug } from '../../../../services/prompt-manager/promptCollectionService';

export const prerender = false;

/**
 * GET /api/prompts/segments/by-slug
 * Find a segment by slug within a collection
 * Query params: collection_id (required), slug (required)
 */
export const GET: APIRoute = async ({ locals, url }) => {
  // Check if prompt manager feature is enabled
  if (!isFeatureEnabled('promptManager')) {
    return new Response(JSON.stringify({ error: 'Prompt Manager feature is disabled' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check organization access
  if (!locals.promptManager?.activeOrganization) {
    return new Response(
      JSON.stringify({ error: 'No active organization. Please join an organization first.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const collectionId = url.searchParams.get('collection_id');
  const slug = url.searchParams.get('slug');

  if (!collectionId) {
    return new Response(JSON.stringify({ error: 'collection_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch segment by slug
  const result = await getSegmentBySlug(collectionId, slug);

  if (result.error) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
    return new Response(JSON.stringify({ error: result.error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result.data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
