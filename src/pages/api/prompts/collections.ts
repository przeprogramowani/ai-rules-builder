import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { getCollections } from '../../../services/prompt-manager/promptCollectionService';

export const prerender = false;

/**
 * GET /api/prompts/prompt-collections
 * List collections for an organization (member-accessible)
 * Query params: organization_id
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

  // Fetch collections
  const result = await getCollections(organizationId);

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
