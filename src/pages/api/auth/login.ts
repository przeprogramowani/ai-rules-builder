import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { isFeatureEnabled } from '../../../features/featureFlags';

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
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
      });
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ user: data.user }), { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
