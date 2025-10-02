import type { APIRoute } from 'astro';
import { publishPrompt, unpublishPrompt, getPrompt } from '@/services/prompt-manager/promptService';

export const PATCH: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.promptManager?.activeOrganization) {
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

    const organizationId = locals.promptManager.activeOrganization.id;

    // Get current status
    const currentPrompt = await getPrompt(promptId, organizationId);
    if (currentPrompt.error) {
      return new Response(
        JSON.stringify({ error: currentPrompt.error.message, code: currentPrompt.error.code }),
        {
          status: currentPrompt.error.code === 'NOT_FOUND' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Toggle status
    const result =
      currentPrompt.data.status === 'published'
        ? await unpublishPrompt(promptId, organizationId)
        : await publishPrompt(promptId, organizationId);

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
    console.error('Error toggling prompt publish status:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
