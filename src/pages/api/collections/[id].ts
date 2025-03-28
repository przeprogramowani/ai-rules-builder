import type { APIRoute } from 'astro';
import { Library } from '../../../data/dictionaries';

export const prerender = false;

interface Collection {
  id: string;
  name: string;
  description: string;
  libraries: Library[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Define mock collections directly in this file to avoid import issues
const mockCollections: Record<string, Collection[]> = {
  [DEFAULT_USER_ID]: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'React Project Setup',
      description: 'Standard configuration for React projects',
      libraries: [
        Library.REACT_CODING_STANDARDS,
        Library.NEXT_JS,
        Library.ZUSTAND,
        Library.TAILWIND,
        Library.ESLINT,
        Library.PRETTIER,
        Library.JEST,
      ],
      createdAt: '2024-03-20T10:00:00Z',
      updatedAt: '2024-03-20T10:00:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Testing Suite',
      description: 'Complete testing configuration',
      libraries: [Library.JEST, Library.CYPRESS, Library.PLAYWRIGHT, Library.CODECOV],
      createdAt: '2024-03-20T11:00:00Z',
      updatedAt: '2024-03-20T11:00:00Z',
    },
  ],
};

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
