import type { APIRoute } from 'astro';
import { getInviteStats } from '@/services/prompt-library/invites';

/**
 * GET /api/prompts/admin/invites/[id]/stats
 * Get usage statistics for an organization invite
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.promptLibrary?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is an admin
    if (locals.promptLibrary.activeOrganization.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin role required', code: 'FORBIDDEN' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Invite ID is required', code: 'VALIDATION_ERROR' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const supabase = locals.supabase;
    const stats = await getInviteStats(supabase, id);

    if (!stats) {
      return new Response(JSON.stringify({ error: 'Invite not found', code: 'NOT_FOUND' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: stats, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching invite stats:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
