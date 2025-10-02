import type { APIRoute } from 'astro';
import { getSegments } from '@/services/prompt-manager/promptCollectionService';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.promptManager?.activeOrganization) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const collectionId = params.id;
    if (!collectionId) {
      return new Response(
        JSON.stringify({ error: 'Collection ID required', code: 'VALIDATION_ERROR' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await getSegments(collectionId);

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
    console.error('Error getting segments:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
