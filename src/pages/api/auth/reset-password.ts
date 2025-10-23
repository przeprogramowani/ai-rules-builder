import type { APIRoute } from 'astro';
import { createSupabaseAdminInstance } from '@/db/supabase.client';
import { verifyCaptcha } from '@/services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

export const POST: APIRoute = async ({ request, url, cookies }) => {
  try {
    const { email, captchaToken } = (await request.json()) as {
      email: string;
      captchaToken: string;
    };

    if (!email || !captchaToken) {
      return new Response(JSON.stringify({ error: 'Email and captcha token are required' }), {
        status: 400,
      });
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

    const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/update-password`,
    });

    // Don't disclose whether the email exists or not for security reasons.
    // Always return a success response.
    if (error) {
      console.error('Password reset error:', error.message);
    }

    return new Response(
      JSON.stringify({ message: 'Password reset instructions sent if email is valid' }),
      { status: 200 },
    );
  } catch (err) {
    console.error('Reset password endpoint error:', err);
    // Handle JSON parsing errors or other unexpected issues
    if (err instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
