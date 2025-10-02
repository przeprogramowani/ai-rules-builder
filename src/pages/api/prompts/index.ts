import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { listPublishedPrompts } from '../../../services/prompt-manager/promptService';

export const prerender = false;

/**
 * GET /api/prompts
 * List published prompts (member-accessible)
 * Query params: organization_id, collection_id, segment_id, search
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

  const organizationId = url.searchParams.get('organization_id');
  const collectionId = url.searchParams.get('collection_id');
  const segmentId = url.searchParams.get('segment_id');
  const search = url.searchParams.get('search');

  if (!organizationId) {
    return new Response(JSON.stringify({ error: 'organization_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user has access to this organization
  const hasAccess = locals.promptManager.organizations.some((org) => org.id === organizationId);
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'Access denied to this organization' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build filters
  const filters: {
    collection_id?: string;
    segment_id?: string;
  } = {};

  if (collectionId) {
    filters.collection_id = collectionId;
  }

  if (segmentId) {
    filters.segment_id = segmentId;
  }

  // Fetch published prompts
  const result = await listPublishedPrompts(organizationId, filters);

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let prompts = result.data || [];

  // Client-side search filtering (simple case-insensitive search)
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    prompts = prompts.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.markdown_body.toLowerCase().includes(searchLower),
    );
  }

  return new Response(JSON.stringify(prompts), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
