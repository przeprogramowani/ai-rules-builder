import type { APIRoute } from 'astro';
import { Library } from '../../data/dictionaries';

interface Collection {
  id: string;
  name: string;
  description: string;
  libraries: Library[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const mockCollections: Record<string, Collection[]> = {
  [DEFAULT_USER_ID]: [
    {
      id: 'col-1',
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
      id: 'col-2',
      name: 'Testing Suite',
      description: 'Complete testing configuration',
      libraries: [Library.JEST, Library.CYPRESS, Library.PLAYWRIGHT, Library.CODECOV],
      createdAt: '2024-03-20T11:00:00Z',
      updatedAt: '2024-03-20T11:00:00Z',
    },
  ],
};

export const GET = (async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || DEFAULT_USER_ID;
  const collections = mockCollections[userId] || mockCollections[DEFAULT_USER_ID];

  return new Response(JSON.stringify(collections), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}) satisfies APIRoute;
