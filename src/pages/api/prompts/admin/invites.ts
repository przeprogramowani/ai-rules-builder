import type { APIRoute } from 'astro';
import {
  createOrganizationInvite,
  listOrganizationInvites,
} from '@/services/prompt-library/invites';
import type { CreateInviteParams } from '@/types/invites';
import { createAuditContext, logInviteOperation } from '@/utils/auditLog';

/**
 * POST /api/prompts/admin/invites
 * Create a new organization invite link
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Middleware ensures user and promptManager context exist
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

    const organizationId = locals.promptLibrary.activeOrganization.id;
    const userId = locals.user.id;
    const supabase = locals.supabase;

    const body = await request.json();

    // Validate required fields
    if (!body.expiresInDays || typeof body.expiresInDays !== 'number') {
      return new Response(
        JSON.stringify({
          error: 'Missing or invalid required field: expiresInDays',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Validate expiration range (max 365 days)
    if (body.expiresInDays < 1 || body.expiresInDays > 365) {
      return new Response(
        JSON.stringify({
          error: 'expiresInDays must be between 1 and 365',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const params: CreateInviteParams = {
      organizationId,
      createdBy: userId,
      expiresInDays: body.expiresInDays,
      maxUses: body.maxUses ?? null,
      role: body.role === 'admin' ? 'admin' : 'member',
    };

    const result = await createOrganizationInvite(supabase, params);
    const auditContext = createAuditContext(request, locals);

    if (result.error || !result.data) {
      console.error('[invites] CREATE endpoint failed:', {
        error: result.error,
        organizationId,
        userId,
        params,
      });

      // Log failed operation
      logInviteOperation(
        'create',
        auditContext,
        organizationId,
        'unknown',
        'failure',
        result.error ?? 'Failed to create invite',
      );

      return new Response(
        JSON.stringify({ error: result.error ?? 'Failed to create invite', code: 'CREATE_FAILED' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Log successful operation
    logInviteOperation('create', auditContext, organizationId, result.data.id, 'success');

    // Generate full invite URL
    const baseUrl = new URL(request.url).origin;
    const inviteUrl = `${baseUrl}/invites/${result.data.token}`;

    return new Response(
      JSON.stringify({
        data: {
          ...result.data,
          inviteUrl,
        },
        error: null,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Error creating invite:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

/**
 * GET /api/prompts/admin/invites?organizationId={id}
 * List all invites for an organization
 */
export const GET: APIRoute = async ({ url, locals }) => {
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

    const organizationId = locals.promptLibrary.activeOrganization.id;
    const supabase = locals.supabase;

    const invites = await listOrganizationInvites(supabase, organizationId);

    // Generate full URLs for each invite
    const baseUrl = new URL(url).origin;
    const invitesWithUrls = invites.map((invite) => ({
      ...invite,
      inviteUrl: `${baseUrl}/invites/${invite.token}`,
    }));

    return new Response(
      JSON.stringify({
        data: invitesWithUrls,
        error: null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Error listing invites:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
