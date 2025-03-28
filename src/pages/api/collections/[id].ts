import type { APIRoute } from 'astro';
import { mockCollections, DEFAULT_USER_ID, type Collection } from './mockStorage';

export const prerender = false;

export const PUT = (async ({ params, request }) => {
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

  const userId = DEFAULT_USER_ID;

  // Check if user exists
  if (!mockCollections[userId]) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Find collection index
  const collectionIndex = mockCollections[userId].findIndex((col) => col.id === collectionId);

  if (collectionIndex === -1) {
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
    if (!updatedCollection.id || !updatedCollection.name || !Array.isArray(updatedCollection.libraries)) {
      return new Response(JSON.stringify({ error: 'Invalid collection data' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Update collection in mock data
    mockCollections[userId][collectionIndex] = {
      ...updatedCollection,
      id: collectionId, // Ensure ID doesn't change
    };

    return new Response(JSON.stringify(mockCollections[userId][collectionIndex]), {
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

export const DELETE = (async ({ params, request }) => {
  const collectionId = params.id;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || DEFAULT_USER_ID;

  // Check if user exists
  if (!mockCollections[userId]) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Find collection index
  const collectionIndex = mockCollections[userId].findIndex((col) => col.id === collectionId);

  if (collectionIndex === -1) {
    return new Response(JSON.stringify({ error: 'Collection not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Remove collection from mock data
  mockCollections[userId].splice(collectionIndex, 1);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}) satisfies APIRoute;
