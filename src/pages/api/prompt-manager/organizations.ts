import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { fetchUserOrganizations } from '../../../services/prompt-manager/organizations';

export const prerender = false;

/**
 * GET /api/prompt-manager/organizations
 * Returns the list of organizations the authenticated user belongs to
 */
export const GET: APIRoute = async ({ locals }) => {
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

  // Fetch organizations for the authenticated user
  const organizations = await fetchUserOrganizations(locals.supabase, locals.user.id);

  return new Response(
    JSON.stringify({
      organizations,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
