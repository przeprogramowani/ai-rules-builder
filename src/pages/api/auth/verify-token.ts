import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';

/**
 * Verify recovery token and establish session.
 * This endpoint should be called when the update-password page loads,
 * BEFORE the user submits the password form.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { token_hash } = (await request.json()) as { token_hash?: string };

    if (!token_hash) {
      return new Response(JSON.stringify({ error: 'Reset token is required' }), {
        status: 400,
      });
    }

    // Create server instance for user authentication operations
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    console.log('[VERIFY-TOKEN] Verifying recovery token');
    console.log('[VERIFY-TOKEN] Token hash received:', token_hash?.substring(0, 20) + '...');

    // Verify the token and establish session
    const verifyResult = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    console.log('[VERIFY-TOKEN] verifyOtp result:', {
      hasError: !!verifyResult.error,
      errorMessage: verifyResult.error?.message,
      hasUser: !!verifyResult.data?.user,
      userId: verifyResult.data?.user?.id,
      userEmail: verifyResult.data?.user?.email,
      hasSession: !!verifyResult.data?.session,
    });

    if (verifyResult.error || !verifyResult.data?.user) {
      console.error('[VERIFY-TOKEN] Token verification failed:', verifyResult.error?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
        status: 400,
      });
    }

    // Check that session was established
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[VERIFY-TOKEN] Session established:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
    });

    return new Response(
      JSON.stringify({
        message: 'Token verified successfully',
        user: verifyResult.data.user,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error('[VERIFY-TOKEN] Endpoint error:', err instanceof Error ? err.message : err);
    if (err instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
