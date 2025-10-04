import type { APIRoute } from 'astro';
import { removeUserFromOrganization } from '@/services/prompt-library/invites';

/**
 * DELETE /api/prompts/admin/invites/[id]/users/[userId]
 * Remove a user from the organization who joined via this invite
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const { id, userId } = params;
    if (!id || !userId) {
      return new Response(
        JSON.stringify({ error: 'Invite ID and User ID are required', code: 'VALIDATION_ERROR' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Verify the invite belongs to the active organization
    const supabase = locals.supabase;
    const { data: invite } = await supabase
      .from('organization_invites')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!invite || invite.organization_id !== locals.promptLibrary.activeOrganization.id) {
      return new Response(
        JSON.stringify({ error: 'Invite not found or unauthorized', code: 'NOT_FOUND' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Remove the user from the organization
    const result = await removeUserFromOrganization(supabase, invite.organization_id, userId);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to remove user', code: 'INTERNAL_ERROR' }),
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
    console.error('Error removing user from organization:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
