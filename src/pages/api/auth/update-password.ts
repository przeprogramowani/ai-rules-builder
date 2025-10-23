import type { APIRoute } from 'astro';
import { withCaptcha } from '../guards/withCaptcha';
import {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedError,
} from '../utils/apiResponse';
import { createServerClient } from '../utils/supabaseHelpers';

/**
 * Update password endpoint.
 * NOTE: The recovery token must be verified FIRST via /api/auth/verify-token
 * to establish a session. This endpoint then uses that session to update the password.
 */
export const POST: APIRoute = withCaptcha<{
  password: string;
  confirmPassword: string;
  captchaToken: string;
}>(async ({ body, request, cookies }) => {
  const { password, confirmPassword } = body;

  // Validate inputs
  if (!password || !confirmPassword) {
    return validationError('Password and confirm password are required');
  }

  if (password !== confirmPassword) {
    return validationError('Passwords do not match');
  }

  // Create server instance for user authentication operations
  const supabase = createServerClient({ cookies, headers: request.headers });

  console.log('[UPDATE-PASSWORD] Starting password update');

  // Check that user has an established session (from verify-token endpoint)
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('[UPDATE-PASSWORD] Current session:', {
    hasSession: !!sessionData.session,
    userId: sessionData.session?.user?.id,
  });

  if (!sessionData.session) {
    console.error('[UPDATE-PASSWORD] No active session found');
    return unauthorizedError('No active session. Please verify your reset token first.');
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
    return errorResponse(updateResult.error.message, 400);
  }

  console.log(
    '[UPDATE-PASSWORD] Password updated successfully for user:',
    updateResult.data?.user?.email,
  );

  return successResponse({ message: 'Password updated successfully' });
});
