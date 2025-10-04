import type { APIRoute } from 'astro';
import { createSupabaseAdminInstance } from '../../../db/supabase.client';
import { isFeatureEnabled } from '../../../features/featureFlags';
import { PRIVACY_POLICY_VERSION } from '../../../pages/privacy/privacyPolicyVersion';
import { redeemInvite } from '../../../services/prompt-library/invites';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if auth feature is enabled
  if (!isFeatureEnabled('auth')) {
    return new Response(JSON.stringify({ error: 'Authentication is currently disabled' }), {
      status: 403,
    });
  }

  try {
    const { email, password, privacyPolicyConsent, inviteToken } = (await request.json()) as {
      email: string;
      password: string;
      privacyPolicyConsent: boolean;
      inviteToken?: string;
    };

    if (!email || !password || !privacyPolicyConsent) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and privacy policy consent are required' }),
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminInstance({ cookies, headers: request.headers });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'User creation failed' }), { status: 500 });
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

    return new Response(JSON.stringify({ user: authData.user }), { status: 200 });
  } catch (err) {
    console.error('Signup error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
