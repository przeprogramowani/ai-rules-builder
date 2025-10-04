import type { APIRoute } from 'astro';
import { redeemInvite } from '@/services/prompt-library/invites';

export const prerender = false;

/**
 * POST /api/invites/redeem
 * Redeem an invite for an authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Require authentication for redemption
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const body = await request.json();

    if (!body.token || typeof body.token !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid request: token is required',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const supabase = locals.supabase;
    const result = await redeemInvite(supabase, {
      token: body.token,
      userId: locals.user.id,
      wasNewUser: false, // For existing user joining via this endpoint
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        }),
        {
          status: result.errorCode === 'UNAUTHORIZED' ? 403 : 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        alreadyMember: result.alreadyMember,
        organization: {
          id: result.organizationId,
          slug: result.organizationSlug,
          name: result.organizationName,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Error redeeming invite:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
