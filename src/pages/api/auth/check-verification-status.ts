import type { APIRoute } from 'astro';
import { createSupabaseAdminInstance } from '../../../db/supabase.client';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { verifyCaptcha } from '../../../services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

export const prerender = false;

/**
 * Check verification status endpoint
 *
 * Allows users to check if their email is verified without triggering
 * rate limits or consuming verification tokens.
 *
 * Returns:
 * - verified: boolean - whether the email is confirmed
 * - canResend: boolean - whether user can request a new verification email
 * - nextResendAt: timestamp - when the user can next resend (if rate limited)
 */
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

    // Verify captcha to prevent abuse
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

    // Use admin client to check user status
    const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });

    // Look up user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error checking user status:', userError);
      return new Response(
        JSON.stringify({
          error: 'Failed to check verification status',
        }),
        { status: 500 },
      );
    }

    // Find user with matching email
    const user = userData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal that user doesn't exist (prevent email enumeration)
      return new Response(
        JSON.stringify({
          verified: false,
          canResend: true,
          message: 'If an account exists with this email, verification status is shown above.',
        }),
        { status: 200 },
      );
    }

    // Check if email is verified
    const isVerified = !!user.email_confirmed_at;

    // Check rate limiting for resend
    let canResend = true;
    let nextResendAt: string | null = null;

    if (!isVerified) {
      // Check rate limit using the same function as resend-verification
      const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
        'check_and_log_verification_request',
        {
          p_email: email.toLowerCase(),
          p_ip_address: requestorIp,
        },
      );

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
        // Don't fail the request, just assume resend is available
        canResend = true;
      } else if (rateLimitResult && !rateLimitResult.allowed) {
        canResend = false;
        const retryAfter = rateLimitResult.retry_after || 3600;
        nextResendAt = new Date(Date.now() + retryAfter * 1000).toISOString();
      }
    }

    return new Response(
      JSON.stringify({
        verified: isVerified,
        canResend: !isVerified && canResend,
        nextResendAt: nextResendAt,
        message: isVerified
          ? 'Your email is verified. You can log in to your account.'
          : canResend
            ? 'Your email is not verified. You can request a new verification email.'
            : 'Your email is not verified. Please wait before requesting another email.',
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error('Check verification status error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
    });
  }
};
