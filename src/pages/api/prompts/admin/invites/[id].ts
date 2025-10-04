import type { APIRoute } from 'astro';
import { revokeInvite } from '@/services/prompt-manager/invites';

/**
 * DELETE /api/prompts/admin/invites/[id]
 * Revoke an organization invite
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.promptManager?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is an admin
    if (locals.promptManager.activeOrganization.role !== 'admin') {
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
    const result = await revokeInvite(supabase, id);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error ?? 'Failed to revoke invite', code: 'REVOKE_FAILED' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ data: { success: true }, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error revoking invite:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
