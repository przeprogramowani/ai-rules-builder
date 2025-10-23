import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';
import { verifyCaptcha } from '@/services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

/**
 * Update password endpoint.
 * NOTE: The recovery token must be verified FIRST via /api/auth/verify-token
 * to establish a session. This endpoint then uses that session to update the password.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password, confirmPassword, captchaToken } = (await request.json()) as {
      password: string;
      confirmPassword: string;
      captchaToken: string;
    };

    // Validate inputs
    if (!password || !confirmPassword || password !== confirmPassword || !captchaToken) {
      return new Response(
        JSON.stringify({
          error: 'Password, confirm password, and captcha token are required and must match',
        }),
        {
          status: 400,
        },
      );
    }

    // Verify captcha on backend
    const requestorIp = request.headers.get('cf-connecting-ip') || '';
    const captchaResult = await verifyCaptcha(CF_CAPTCHA_SECRET_KEY, captchaToken, requestorIp);

    if (!captchaResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Security verification failed. Please try again.',
          errorCodes: captchaResult['error-codes'],
        }),
        { status: 400 },
      );
    }

    // Create server instance for user authentication operations
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    console.log('[UPDATE-PASSWORD] Starting password update');

    // Check that user has an established session (from verify-token endpoint)
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[UPDATE-PASSWORD] Current session:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
    });

    if (!sessionData.session) {
      console.error('[UPDATE-PASSWORD] No active session found');
      return new Response(
        JSON.stringify({ error: 'No active session. Please verify your reset token first.' }),
        {
          status: 401,
        },
      );
    }

    // Update password using the established user session
    const updateResult = await supabase.auth.updateUser({
      password,
    });

    console.log('[UPDATE-PASSWORD] updateUser result:', {
      hasError: !!updateResult.error,
      errorMessage: updateResult.error?.message,
      hasUser: !!updateResult.data?.user,
      userId: updateResult.data?.user?.id,
    });

    if (updateResult.error) {
      console.error('[UPDATE-PASSWORD] Password update failed:', updateResult.error.message);
      return new Response(JSON.stringify({ error: updateResult.error.message }), {
        status: 400,
      });
    }

    console.log(
      '[UPDATE-PASSWORD] Password updated successfully for user:',
      updateResult.data?.user?.email,
    );

    return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
      status: 200,
    });
  } catch (err) {
    console.error('Update password endpoint error:', err instanceof Error ? err.message : err);
    if (err instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
