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
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (err) {
    console.error('Logout error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
    });
  }
};
