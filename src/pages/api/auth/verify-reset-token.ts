import type { APIRoute } from 'astro';
import { createSupabaseAdminInstance } from '@/db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { token_hash } = (await request.json()) as { token_hash: string };

    if (!token_hash) {
      return new Response(JSON.stringify({ error: 'Token hash is required' }), {
        status: 400,
      });
    }

    const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });

    const {
      error,
      data: { user },
    } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (error) {
      console.error('Error verifying OTP:', error.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400 });
    }

    return new Response(JSON.stringify({ user }), { status: 200 });
  } catch (err) {
    console.error('Verify reset token error:', err instanceof Error ? err.message : err);
    if (err instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
