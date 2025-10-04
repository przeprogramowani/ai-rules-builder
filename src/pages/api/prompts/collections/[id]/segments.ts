import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '../../../../../features/featureFlags';
import { getSegments } from '../../../../../services/prompt-library/promptCollectionService';

export const prerender = false;

/**
 * GET /api/prompts/prompt-collections/:id/segments
 * List segments for a collection (member-accessible)
 */
export const GET: APIRoute = async ({ locals, params }) => {
  // Check if prompt manager feature is enabled
  if (!isFeatureEnabled('promptLibrary')) {
    return new Response(JSON.stringify({ error: 'Prompt Library feature is disabled' }), {
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
  if (!locals.promptLibrary?.activeOrganization) {
    return new Response(
      JSON.stringify({ error: 'No active organization. Please join an organization first.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const collectionId = params.id;

  if (!collectionId) {
    return new Response(JSON.stringify({ error: 'Collection ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch segments
  const result = await getSegments(locals.supabase, collectionId);

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result.data || []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
