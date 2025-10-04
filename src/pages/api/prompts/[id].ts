import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { getPublishedPrompt } from '../../../services/prompt-library/promptService';

export const prerender = false;

/**
 * GET /api/prompts/:id
 * Get a single published prompt (member-accessible)
 */
export const GET: APIRoute = async ({ locals, params, url }) => {
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

  const promptId = params.id;
  const organizationId = url.searchParams.get('organization_id');

  if (!promptId) {
    return new Response(JSON.stringify({ error: 'Prompt ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!organizationId) {
    return new Response(JSON.stringify({ error: 'organization_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user has access to this organization
  const hasAccess = locals.promptLibrary.organizations.some((org) => org.id === organizationId);
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'Access denied to this organization' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch published prompt
  const result = await getPublishedPrompt(locals.supabase, promptId, organizationId);

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
