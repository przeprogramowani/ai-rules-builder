import type { APIRoute } from 'astro';
import {
  createSupabaseAdminInstance,
  createSupabaseServerInstance,
} from '../../../db/supabase.client';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { PRIVACY_POLICY_VERSION } from '../../../pages/privacy/privacyPolicyVersion';
import { redeemInvite } from '../../../services/prompt-library/invites';
import { verifyCaptcha } from '../../../services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if auth feature is enabled
  if (!isFeatureEnabled('auth')) {
    return new Response(JSON.stringify({ error: 'Authentication is currently disabled' }), {
      status: 403,
    });
  }

  // Store email at top level for error handler access
  let userEmail: string | undefined;

  try {
    const { email, password, privacyPolicyConsent, inviteToken, captchaToken } =
      (await request.json()) as {
        email: string;
        password: string;
        privacyPolicyConsent: boolean;
        inviteToken?: string;
        captchaToken: string;
      };

    userEmail = email; // Store for error handler

    if (!email || !password || !privacyPolicyConsent || !captchaToken) {
      return new Response(
        JSON.stringify({
          error: 'Email, password, privacy policy consent, and captcha token are required',
        }),
        { status: 400 },
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

    const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });

    // FIX 3: Check for duplicate signup request (prevents network retry duplicates)
    // Gracefully handle if function doesn't exist yet (gradual rollout)
    try {
      // Use Web Crypto API (compatible with Cloudflare Workers)
      const encoder = new TextEncoder();
      const data = encoder.encode(captchaToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const captchaHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const { data: dedupResult, error: dedupError } = await supabase.rpc(
        'check_signup_duplicate',
        {
          p_email: email.toLowerCase(),
          p_ip_address: requestorIp,
          p_captcha_hash: captchaHash,
        },
      );

      if (dedupError) {
        console.error('Deduplication check error (function may not exist yet):', dedupError);
        // Don't block signup if dedup check fails - just log and continue
      } else if (dedupResult?.is_duplicate) {
        const secondsAgo = dedupResult.seconds_ago || 0;
        const remainingSeconds = Math.max(120 - secondsAgo, 0);
        return new Response(
          JSON.stringify({
            error: `Signup request already ${dedupResult.status}. Please wait ${remainingSeconds} seconds before trying again.`,
            type: 'duplicate_request',
          }),
          { status: 429 },
        );
      }
    } catch (dedupException) {
      console.error('Deduplication check exception (function may not exist yet):', dedupException);
      // Continue with signup - better to allow potential duplicate than block legitimate signup
    }

    // FIX 2: Use atomic database check to prevent race conditions
    // Gracefully fall back to old method if function doesn't exist yet
    type SignupCheckResult = {
      action: 'create' | 'resend' | 'rate_limited' | 'error';
      message?: string;
      type?: string;
      retry_after?: number;
      reason?: string;
      user_id?: string;
      email?: string;
    };

    let signupCheck: SignupCheckResult | null = null;
    try {
      const { data, error: checkError } = await supabase.rpc('safe_signup_or_resend', {
        p_email: email.toLowerCase(),
        p_ip_address: requestorIp,
      });

      if (checkError) {
        console.error(
          'Error checking signup eligibility (function may not exist yet):',
          checkError,
        );
        // Fall back to old behavior - check user existence manually
        signupCheck = null;
      } else {
        signupCheck = data as SignupCheckResult;
      }
    } catch (checkException) {
      console.error('Atomic check exception (function may not exist yet):', checkException);
      signupCheck = null;
    }

    // If atomic check failed, fall back to creating user directly
    if (!signupCheck) {
      console.log('Falling back to direct user creation (migrations not applied yet)');
      signupCheck = { action: 'create' };
    }

    // Handle the action returned by the atomic check
    if (signupCheck.action === 'error') {
      return new Response(
        JSON.stringify({
          error: signupCheck.message,
          type: signupCheck.type,
        }),
        { status: 400 },
      );
    }

    if (signupCheck.action === 'rate_limited') {
      const retryAfter = signupCheck.retry_after || 3600;
      const minutes = Math.ceil(retryAfter / 60);
      return new Response(
        JSON.stringify({
          error: `Verification email already sent recently. Please check your inbox or wait ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          type: 'rate_limit',
          retryAfter: retryAfter,
        }),
        { status: 429 },
      );
    }

    if (signupCheck.action === 'resend') {
      // User exists but unconfirmed, rate limit passed - resend verification
      const supabaseClient = createSupabaseServerInstance({ cookies, headers: request.headers });

      const { error: resendError } = await supabaseClient.auth.resend({
        type: 'signup',
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: `${new URL(request.url).origin}/auth/verify`,
        },
      });

      if (resendError) {
        console.error('Error resending verification email:', resendError);
      }

      // FIX 6: Log email send for monitoring (non-blocking)
      try {
        const { error: logError } = await supabase.rpc('log_email_send', {
          p_email: email.toLowerCase(),
          p_type: 'resend_verification',
          p_ip_address: requestorIp,
          p_user_agent: request.headers.get('user-agent'),
          p_request_path: '/api/auth/signup',
          p_user_id: signupCheck.user_id,
          p_status: resendError ? 'failed' : 'sent',
          p_error_message: resendError?.message || null,
        });
        if (logError) console.error('Failed to log email send:', logError);
      } catch (logException) {
        console.error('Email logging exception (function may not exist yet):', logException);
      }

      // Mark signup as completed (FIX 3) (non-blocking)
      try {
        const { error: statusError } = await supabase.rpc('update_signup_status', {
          p_email: email.toLowerCase(),
          p_status: 'completed',
        });
        if (statusError) console.error('Failed to update signup status:', statusError);
      } catch (statusException) {
        console.error('Status update exception (function may not exist yet):', statusException);
      }

      // Return success response (same as new signup) to trigger success UI
      return new Response(
        JSON.stringify({
          user: { id: signupCheck.user_id, email: signupCheck.email },
        }),
        { status: 200 },
      );
    }

    // signupCheck.action === 'create' - proceed with new user creation

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/verify`,
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'User creation failed' }), { status: 500 });
    }

    // FIX 6: Log email send for new signup (non-blocking)
    try {
      const { error: logError2 } = await supabase.rpc('log_email_send', {
        p_email: email.toLowerCase(),
        p_type: 'signup_verification',
        p_ip_address: requestorIp,
        p_user_agent: request.headers.get('user-agent'),
        p_request_path: '/api/auth/signup',
        p_user_id: authData.user.id,
      });
      if (logError2) console.error('Failed to log email send:', logError2);
    } catch (logException) {
      console.error('Email logging exception (function may not exist yet):', logException);
    }

    const { error: consentError } = await supabase.from('user_consents').insert({
      user_id: authData.user.id,
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    });

    if (consentError) {
      console.error('Error storing consent:', consentError);
    }

    // Handle invite token if provided
    if (inviteToken) {
      const redemptionResult = await redeemInvite(supabase, {
        token: inviteToken,
        userId: authData.user.id,
        wasNewUser: true,
      });

      if (redemptionResult.success) {
        return new Response(
          JSON.stringify({
            user: authData.user,
            organization: {
              id: redemptionResult.organizationId,
              slug: redemptionResult.organizationSlug,
              name: redemptionResult.organizationName,
            },
          }),
          { status: 200 },
        );
      } else {
        // Log invite redemption failure but don't block signup
        console.error('Failed to redeem invite during signup:', redemptionResult.error);
      }
    }

    // Mark signup as completed (FIX 3) (non-blocking)
    try {
      const { error: statusError2 } = await supabase.rpc('update_signup_status', {
        p_email: email.toLowerCase(),
        p_status: 'completed',
      });
      if (statusError2) console.error('Failed to update signup status:', statusError2);
    } catch (statusException) {
      console.error('Status update exception (function may not exist yet):', statusException);
    }

    return new Response(JSON.stringify({ user: authData.user }), { status: 200 });
  } catch (err) {
    console.error('Signup error:', err);

    // Mark signup as failed (FIX 3) - use stored email variable
    if (userEmail) {
      try {
        const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });
        await supabase.rpc('update_signup_status', {
          p_email: userEmail.toLowerCase(),
          p_status: 'failed',
        });
      } catch (updateErr) {
        console.error('Failed to update signup status on error:', updateErr);
      }
    }

    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
