import type { APIRoute } from 'astro';
import { mockCollections, DEFAULT_USER_ID, type Collection } from './collections/mockStorage';

export const prerender = false;

// const mockCollections: Record<string, Collection[]> = {
//   [DEFAULT_USER_ID]: [
//     {
//       id: '550e8400-e29b-41d4-a716-446655440001',
//       name: 'React Project Setup',
//       description: 'Standard configuration for React projects',
//       libraries: [
//         Library.REACT_CODING_STANDARDS,
//         Library.NEXT_JS,
//         Library.ZUSTAND,
//         Library.TAILWIND,
//         Library.ESLINT,
//         Library.PRETTIER,
//         Library.JEST,
//       ],
//       createdAt: '2024-03-20T10:00:00Z',
//       updatedAt: '2024-03-20T10:00:00Z',
//     },
//     {
//       id: '550e8400-e29b-41d4-a716-446655440002',
//       name: 'Testing Suite',
//       description: 'Complete testing configuration',
//       libraries: [Library.JEST, Library.CYPRESS, Library.PLAYWRIGHT, Library.CODECOV],
//       createdAt: '2024-03-20T11:00:00Z',
//       updatedAt: '2024-03-20T11:00:00Z',
//     },
//   ],
// };

export const GET = (async () => {
  const collections = mockCollections[DEFAULT_USER_ID];

  return new Response(JSON.stringify(collections), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}) satisfies APIRoute;

export const POST = (async ({ request }) => {
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
    const newCollection: Collection = {
      ...collection,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add the collection to the mock database
    mockCollections[DEFAULT_USER_ID].push(newCollection);

    return new Response(JSON.stringify(newCollection), {
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
