import type { APIRoute } from 'astro';
import { type Collection } from '../../../types/collection.types';

export const prerender = false;

export const PUT: APIRoute = (async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const collectionId = params.id;
  if (!collectionId) {
    return new Response(JSON.stringify({ error: 'Collection ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Check if collection exists for the user
  const { error: findError } = await locals.supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', locals.user.id)
    .single();

  if (findError) {
    return new Response(JSON.stringify({ error: 'Collection not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const updatedCollection: Collection = await request.json();

    // Validate the updated collection
    if (
      !updatedCollection.id ||
      !updatedCollection.name ||
      !Array.isArray(updatedCollection.libraries)
    ) {
      return new Response(JSON.stringify({ error: 'Invalid collection data' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Update collection in database
    const { data, error } = await locals.supabase
      .from('collections')
      .update({
        name: updatedCollection.name,
        description: updatedCollection.description,
        libraries: updatedCollection.libraries,
      })
      .eq('id', collectionId)
      .eq('user_id', locals.user.id)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify(data[0]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid request body';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}) satisfies APIRoute;

export const DELETE: APIRoute = (async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const collectionId = params.id;
  if (!collectionId) {
    return new Response(JSON.stringify({ error: 'Collection ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Check if collection exists for the user
  const { error: findError } = await locals.supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', locals.user.id)
    .single();

  if (findError) {
    return new Response(JSON.stringify({ error: 'Collection not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Remove collection from database
  const { error } = await locals.supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', locals.user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}) satisfies APIRoute;
