import type { APIRoute } from 'astro';
import { withCaptcha } from '../guards/withCaptcha';
import { successResponse, serverError, validationError } from '../utils/apiResponse';
import { createAdminClient, getOrigin } from '../utils/supabaseHelpers';

export const POST: APIRoute = withCaptcha<{ email: string; captchaToken: string }>(
  async ({ body, request, cookies }) => {
    try {
      const { email } = body;

      if (!email) {
        return validationError('Email is required');
      }

      const supabase = createAdminClient({ cookies, headers: request.headers });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getOrigin(request)}/auth/update-password`,
      });

      // Don't disclose whether the email exists or not for security reasons.
      // Always return a success response.
      if (error) {
        console.error('Password reset error:', error.message);
      }

      return successResponse({
        message: 'Password reset instructions sent if email is valid',
      });
    } catch (err) {
      console.error('Reset password endpoint error:', err);
      return serverError(
        'An unexpected error occurred',
        err instanceof Error ? err.message : undefined,
      );
    }
  },
);
