import type { APIRoute } from 'astro';
import { type Collection, collectionMapper } from '../../types/collection.types';
import { isFeatureEnabled } from '../../features/featureFlags';

export const prerender = false;

export const GET: APIRoute = (async ({ locals }) => {
  // Check if collections feature is enabled
  if (!isFeatureEnabled('collections')) {
    return new Response(JSON.stringify({ error: 'Collections feature is currently disabled' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Check if auth is enabled and user is authenticated
  if (isFeatureEnabled('auth') && !locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const { data, error } = await locals.supabase
    .from('collections')
    .select('*')
    .eq('user_id', locals.user?.id || '');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let collections: Collection[] = [];

  if (data) {
    collections = data.map(collectionMapper);
  }

  return new Response(JSON.stringify(collections), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}) satisfies APIRoute;

export const POST = (async ({ request, locals }) => {
  // Check if collections feature is enabled
  if (!isFeatureEnabled('collections')) {
    return new Response(JSON.stringify({ error: 'Collections feature is currently disabled' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Check if auth is enabled and user is authenticated
  if (isFeatureEnabled('auth') && !locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const collection = await request.json();

    // Validate required fields
    if (!collection.name || !collection.description) {
      return new Response(JSON.stringify({ error: 'Name and description are required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Create a new collection with server-generated ID
    const { data, error } = await locals.supabase
      .from('collections')
      .insert({
        name: collection.name,
        description: collection.description,
        libraries: collection.libraries,
        user_id: locals.user?.id || '',
      })
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

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: unknown) {
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

// DELETE endpoint has been moved to [id].ts
