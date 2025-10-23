import type { APIRoute } from 'astro';
import { createPrompt, listPrompts } from '@/services/prompt-library/promptService';
import type { CreatePromptInput, PromptFilters } from '@/services/prompt-library/types';
import { createAuditContext, logPromptOperation } from '@/utils/auditLog';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Middleware ensures user and promptManager context exist
    if (!locals.user || !locals.promptLibrary?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role (defense-in-depth)
    if (locals.promptLibrary.activeOrganization.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin role required', code: 'FORBIDDEN' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const organizationId = locals.promptLibrary.activeOrganization.id;
    const userId = locals.user.id;

    const body = (await request.json()) as CreatePromptInput;

    // Validate required fields
    if (!body.title_en || !body.collection_id || !body.markdown_body_en) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: title_en, collection_id, markdown_body_en',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await createPrompt(locals.supabase, organizationId, {
      ...body,
      created_by: userId,
    });

    const auditContext = createAuditContext(request, locals);

    if (result.error) {
      // Log failed operation
      logPromptOperation(
        'create',
        auditContext,
        organizationId,
        'unknown',
        'failure',
        result.error.message,
      );

      return new Response(
        JSON.stringify({ error: result.error.message, code: result.error.code }),
        {
          status: result.error.code === 'NOT_FOUND' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Log successful operation
    logPromptOperation('create', auditContext, organizationId, result.data!.id, 'success');

    return new Response(JSON.stringify({ data: result.data, error: null }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error creating prompt:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    if (!locals.user || !locals.promptLibrary?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role (defense-in-depth)
    if (locals.promptLibrary.activeOrganization.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin role required', code: 'FORBIDDEN' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const organizationId = locals.promptLibrary.activeOrganization.id;

    // Parse query params for filtering
    const filters: PromptFilters = {};
    const status = url.searchParams.get('status');
    const collectionId = url.searchParams.get('collection_id');
    const segmentId = url.searchParams.get('segment_id');
    const search = url.searchParams.get('search');

    if (status === 'draft' || status === 'published') {
      filters.status = status;
    }
    if (collectionId) {
      filters.collection_id = collectionId;
    }
    if (segmentId) {
      filters.segment_id = segmentId;
    }
    if (search) {
      filters.search = search;
    }

    const result = await listPrompts(locals.supabase, organizationId, filters);

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message, code: result.error.code }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ data: result.data, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error listing prompts:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
