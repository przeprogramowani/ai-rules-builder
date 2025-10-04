import type { APIRoute } from 'astro';
import { validateInviteToken } from '@/services/prompt-manager/invites';

export const prerender = false;

/**
 * POST /api/invites/validate
 * Validate an invite token (public endpoint, no auth required)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
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
    const result = await validateInviteToken(supabase, body.token);

    if (!result.valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: result.error,
          errorCode: result.errorCode,
        }),
        {
          status: 200, // Return 200 even for invalid tokens to allow client handling
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        organization: result.organization,
        invite: {
          expiresAt: result.invite?.expiresAt,
          role: result.invite?.role,
          maxUses: result.invite?.maxUses,
          currentUses: result.invite?.currentUses,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Error validating invite:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
