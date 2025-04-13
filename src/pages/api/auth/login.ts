import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '@/features/featureFlags';
import { createSupabaseServerInstance } from '@/db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if auth feature is enabled
  if (!isFeatureEnabled('auth')) {
    return new Response(JSON.stringify({ error: 'Authentication is currently disabled' }), {
      status: 403,
    });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      console.warn('Login attempt failed: Email or password missing.');
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log headers received in the production environment
    console.log(
      'Received headers:',
      JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2),
    );

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase sign-in error:', error.message, 'Status:', error.status);
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    let errorMessage = 'An unknown error occurred';
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.error('Login endpoint general error:', errorMessage, err);
    return new Response(JSON.stringify({ error: 'An unexpected server error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
