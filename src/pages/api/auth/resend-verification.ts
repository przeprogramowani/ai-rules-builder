import type { APIRoute } from 'astro';
import { withFeatureFlag } from '../guards/withFeatureFlag';
import { withCaptcha } from '../guards/withCaptcha';
import {
  successResponse,
  serverError,
  validationError,
  serviceUnavailableError,
  rateLimitError,
} from '../utils/apiResponse';
import { createServerClient, getClientIp, getOrigin, getUserAgent } from '../utils/supabaseHelpers';

export const prerender = false;

export const POST: APIRoute = withFeatureFlag(
  'auth',
  withCaptcha<{ email: string; captchaToken: string }>(async ({ body, request, cookies }) => {
    try {
      const { email } = body;

      if (!email) {
        return validationError('Email is required');
      }

      const supabase = createServerClient({ cookies, headers: request.headers });

      // Check rate limiting using database function (SECURITY DEFINER)
      const requestorIp = getClientIp(request);
      const { data: rateLimitResult, error: rateLimitCheckError } = await supabase.rpc(
        'check_and_log_verification_request',
        {
          p_email: email.toLowerCase(),
          p_ip_address: requestorIp,
        },
      );

      if (rateLimitCheckError) {
        // Detailed logging for developers
        console.error('Rate limit check error:', {
          error: rateLimitCheckError,
          code: rateLimitCheckError.code,
          message: rateLimitCheckError.message,
          details: rateLimitCheckError.details,
          hint: rateLimitCheckError.hint,
        });

        // Check if function doesn't exist (migration not applied)
        if (
          rateLimitCheckError.code === '42883' ||
          rateLimitCheckError.message?.includes('function')
        ) {
          console.warn(
            '⚠️  Database function "check_and_log_verification_request" not found. ' +
              'Run: npx supabase db push',
          );
        }

        // User-friendly error message
        return serviceUnavailableError(
          'Service temporarily unavailable. Please try again in a few moments.',
          10,
        );
      }

      // Check if rate limited
      if (rateLimitResult && !rateLimitResult.allowed) {
        const retryAfter = rateLimitResult.retry_after || 3600;
        const minutes = Math.ceil(retryAfter / 60);

        return rateLimitError(
          `Too many verification email requests. You can request another email in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          retryAfter,
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
          emailRedirectTo: `${getOrigin(request)}/auth/verify`,
        },
      });

      // FIX 6: Log email send for monitoring (non-blocking)
      try {
        const { error: logError } = await supabase.rpc('log_email_send', {
          p_email: email.toLowerCase(),
          p_type: 'resend_verification',
          p_ip_address: requestorIp,
          p_user_agent: getUserAgent(request),
          p_request_path: '/api/auth/resend-verification',
          p_user_id: null, // We don't have user ID in this endpoint
          p_status: resendError ? 'failed' : 'sent',
          p_error_message: resendError?.message || null,
        });
        if (logError) console.error('Failed to log email send:', logError);
      } catch (logException) {
        console.error('Email logging exception (function may not exist yet):', logException);
      }

      // Always return success to prevent email enumeration
      // Even if there was an error, we don't want to reveal whether the email exists
      if (resendError) {
        console.error('Resend verification error:', resendError);
        // Still return success to user
      }

      return successResponse({
        success: true,
        message:
          'If an unverified account exists with this email, a verification link has been sent.',
      });
    } catch (err) {
      console.error('Resend verification error:', err);
      return serverError(
        'An unexpected error occurred',
        err instanceof Error ? err.message : undefined,
      );
    }
  }),
);
