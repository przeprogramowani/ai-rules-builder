import type { APIRoute } from 'astro';
import { updatePrompt, deletePrompt, getPrompt } from '@/services/prompt-library/promptService';
import type { UpdatePromptInput } from '@/services/prompt-library/types';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.promptLibrary?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const promptId = params.id;
    if (!promptId) {
      return new Response(
        JSON.stringify({ error: 'Prompt ID required', code: 'VALIDATION_ERROR' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const organizationId = locals.promptLibrary.activeOrganization.id;
    const result = await getPrompt(locals.supabase, promptId, organizationId);

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message, code: result.error.code }),
        {
          status: result.error.code === 'NOT_FOUND' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ data: result.data, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error getting prompt:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user || !locals.promptLibrary?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const promptId = params.id;
    if (!promptId) {
      return new Response(
        JSON.stringify({ error: 'Prompt ID required', code: 'VALIDATION_ERROR' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const organizationId = locals.promptLibrary.activeOrganization.id;
    const body = (await request.json()) as UpdatePromptInput;

    const result = await updatePrompt(locals.supabase, promptId, organizationId, body);

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message, code: result.error.code }),
        {
          status: result.error.code === 'NOT_FOUND' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ data: result.data, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error updating prompt:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.promptLibrary?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const promptId = params.id;
    if (!promptId) {
      return new Response(
        JSON.stringify({ error: 'Prompt ID required', code: 'VALIDATION_ERROR' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const organizationId = locals.promptLibrary.activeOrganization.id;
    const result = await deletePrompt(locals.supabase, promptId, organizationId);

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message, code: result.error.code }),
        {
          status: result.error.code === 'NOT_FOUND' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(null, {
      status: 204,
    });
  } catch (err) {
    console.error('Error deleting prompt:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
