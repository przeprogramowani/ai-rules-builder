import type { APIRoute } from 'astro';
import { createSupabaseAdminInstance } from '@/db/supabase.client';

/**
 * Update password endpoint with atomic token verification.
 * This endpoint verifies the reset token and updates the password in a single operation.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password, confirmPassword, token_hash } = (await request.json()) as {
      password: string;
      confirmPassword: string;
      token_hash?: string;
    };

    // Validate inputs
    if (!password || !confirmPassword || password !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'Password and confirm password must match' }), {
        status: 400,
      });
    }

    if (!token_hash) {
      return new Response(JSON.stringify({ error: 'Reset token is required' }), {
        status: 400,
      });
    }

    // Create admin instance for token verification
    const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });

    // Step 1: Verify the token and get user data
    const {
      error: verifyError,
      data: { user },
    } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (verifyError || !user) {
      console.error('Token verification failed:', verifyError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
        status: 400,
      });
    }

    // Step 2: Update password using admin API (bypasses session requirement)
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
    });

    if (updateError) {
      console.error('Password update failed:', updateError.message);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
      });
    }

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
