import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { verifyCaptcha } from '../../../services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if auth feature is enabled
  if (!isFeatureEnabled('auth')) {
    return new Response(JSON.stringify({ error: 'Authentication is currently disabled' }), {
      status: 403,
    });
  }

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

    // Verify captcha
    const requestorIp = request.headers.get('cf-connecting-ip') || '';
    const captchaResult = await verifyCaptcha(CF_CAPTCHA_SECRET_KEY, captchaToken, requestorIp);

    if (!captchaResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Captcha verification failed',
          errorCodes: captchaResult['error-codes'],
        }),
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    // Check rate limiting using database function (SECURITY DEFINER)
    const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
      'check_and_log_verification_request',
      {
        p_email: email.toLowerCase(),
        p_ip_address: requestorIp,
      },
    );

    if (rateLimitError) {
      // Detailed logging for developers
      console.error('Rate limit check error:', {
        error: rateLimitError,
        code: rateLimitError.code,
        message: rateLimitError.message,
        details: rateLimitError.details,
        hint: rateLimitError.hint,
      });

      // Check if function doesn't exist (migration not applied)
      if (rateLimitError.code === '42883' || rateLimitError.message?.includes('function')) {
        console.warn(
          '⚠️  Database function "check_and_log_verification_request" not found. ' +
            'Run: npx supabase db push',
        );
      }

      // User-friendly error message
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable. Please try again in a few moments.',
          type: 'service_error',
          developerMessage: import.meta.env.DEV ? rateLimitError.message : undefined,
        }),
        {
          status: 503, // Service Unavailable (not Internal Server Error)
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '10', // Suggest retry after 10 seconds
          },
        },
      );
    }

    // Check if rate limited
    if (rateLimitResult && !rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retry_after || 3600;
      const minutes = Math.ceil(retryAfter / 60);

      return new Response(
        JSON.stringify({
          error: `Too many verification email requests. You can request another email in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          type: 'rate_limit',
          retryAfter: retryAfter,
        }),
        { status: 429 },
      );
    }

    // Attempt to send verification email
    // Note: Supabase will silently handle cases where:
    // - Email doesn't exist
    // - Email is already confirmed
    // This prevents email enumeration attacks
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/verify`,
      },
    });

    // Always return success to prevent email enumeration
    // Even if there was an error, we don't want to reveal whether the email exists
    if (resendError) {
      console.error('Resend verification error:', resendError);
      // Still return success to user
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'If an unverified account exists with this email, a verification link has been sent.',
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error('Resend verification error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
    });
  }
};
