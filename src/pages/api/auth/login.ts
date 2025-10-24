import type { APIRoute } from 'astro';
import { withFeatureFlag } from '../guards/withFeatureFlag';
import { withCaptcha } from '../guards/withCaptcha';
import { successResponse, errorResponse, validationError } from '../utils/apiResponse';
import { createServerClient, getClientIp, getOrigin } from '../utils/supabaseHelpers';

export const POST: APIRoute = withFeatureFlag(
  'auth',
  withCaptcha<{ email: string; password: string; captchaToken: string }>(
    async ({ body, request, cookies }) => {
      const { email, password } = body;

      if (!email || !password) {
        return validationError('Email and password are required');
      }

      const supabase = createServerClient({ cookies, headers: request.headers });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message.toLowerCase().includes('email not confirmed')) {
          // Auto-resend verification email
          const requestorIp = getClientIp(request);

          // Check rate limit first
          const { data: rateLimitResult, error: rateLimitCheckError } = await supabase.rpc(
            'check_and_log_verification_request',
            {
              p_email: email.toLowerCase(),
              p_ip_address: requestorIp,
            },
          );

          if (rateLimitCheckError) {
            console.error('Rate limit check error:', rateLimitCheckError);
            return errorResponse(
              'Your email address has not been verified. Please check your email or request a new verification link.',
              400,
              {
                type: 'email_not_confirmed',
                email: email,
              },
            );
          }

          // Check if rate limited
          if (rateLimitResult && !rateLimitResult.allowed) {
            const retryAfter = rateLimitResult.retry_after || 3600;
            const minutes = Math.ceil(retryAfter / 60);

            return errorResponse(
              `Your email is not verified. We've already sent verification emails recently. You can request another email in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
              400,
              {
                type: 'email_not_confirmed_rate_limited',
                email: email,
                retryAfter: retryAfter,
              },
            );
          }

          // Send verification email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email.toLowerCase(),
            options: {
              emailRedirectTo: `${getOrigin(request)}/auth/login`,
            },
          });

          if (resendError) {
            console.error('Error resending verification email:', resendError);
          }

          return errorResponse(
            'Your email address has not been verified. We sent you a verification email - please check your inbox.',
            400,
            {
              type: 'email_not_confirmed',
              email: email,
            },
          );
        }

        return errorResponse(error.message, 400);
      }

      return successResponse({ user: data.user });
    },
  ),
);
