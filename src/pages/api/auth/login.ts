import type { APIRoute } from 'astro';
import { isFeatureEnabled } from '@/features/featureFlags';
import { createSupabaseServerInstance } from '@/db/supabase.client';
import { verifyCaptcha } from '@/services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if auth feature is enabled
  if (!isFeatureEnabled('auth')) {
    return new Response(JSON.stringify({ error: 'Authentication is currently disabled' }), {
      status: 403,
    });
  }

  try {
    const { email, password, captchaToken } = (await request.json()) as {
      email: string;
      password: string;
      captchaToken: string;
    };

    if (!email || !password || !captchaToken) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and captcha token are required' }),
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

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is due to unconfirmed email
      if (error.message.toLowerCase().includes('email not confirmed')) {
        // Auto-resend verification email
        const requestorIp = request.headers.get('cf-connecting-ip') || '';

        // Check rate limit first
        const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
          'check_and_log_verification_request',
          {
            p_email: email.toLowerCase(),
            p_ip_address: requestorIp,
          },
        );

        if (rateLimitError) {
          console.error('Rate limit check error:', rateLimitError);
          return new Response(
            JSON.stringify({
              error:
                'Your email address has not been verified. Please check your email or request a new verification link.',
              type: 'email_not_confirmed',
              email: email,
            }),
            { status: 400 },
          );
        }

        // Check if rate limited
        if (rateLimitResult && !rateLimitResult.allowed) {
          const retryAfter = rateLimitResult.retry_after || 3600;
          const minutes = Math.ceil(retryAfter / 60);

          return new Response(
            JSON.stringify({
              error: `Your email is not verified. We've already sent verification emails recently. You can request another email in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
              type: 'email_not_confirmed_rate_limited',
              email: email,
              retryAfter: retryAfter,
            }),
            { status: 400 },
          );
        }

        // Send verification email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email.toLowerCase(),
          options: {
            emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
          },
        });

        if (resendError) {
          console.error('Error resending verification email:', resendError);
        }

        return new Response(
          JSON.stringify({
            error:
              'Your email address has not been verified. We sent you a verification email - please check your inbox.',
            type: 'email_not_confirmed',
            email: email,
          }),
          { status: 400 },
        );
      }

      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ user: data.user }), { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
