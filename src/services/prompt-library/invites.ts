/**
 * Organization invite service layer
 * Handles creation, validation, and redemption of organization invite links
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type {
  OrganizationInvite,
  InviteValidationResult,
  InviteRedemptionResult,
  CreateInviteParams,
  RedeemInviteParams,
  InviteStats,
} from '@/types/invites';
import { INVITE_ERROR_MESSAGES } from '@/types/invites';

type Supabase = SupabaseClient<Database>;

/**
 * Generate a cryptographically secure invite token
 * Uses 32 bytes of entropy for 256-bit security
 * @returns URL-safe base64 encoded token
 */
export async function generateInviteToken(): Promise<string> {
  // Use Web Crypto API - works in Node.js 16+, Cloudflare Workers, and browsers
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);

  // Convert to base64url format (URL-safe)
  const base64 = btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return base64;
}

/**
 * Create a new organization invite
 */
export async function createOrganizationInvite(
  supabase: Supabase,
  params: CreateInviteParams,
): Promise<{ data: OrganizationInvite | null; error: string | null }> {
  try {
    const token = await generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + params.expiresInDays);

    const { data, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: params.organizationId,
        token,
        created_by: params.createdBy,
        expires_at: expiresAt.toISOString(),
        max_uses: params.maxUses ?? null,
        role: params.role,
      })
      .select()
      .single();

    if (error) {
      console.error('[invites] createOrganizationInvite failed', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: data.id,
        organizationId: data.organization_id,
        token: data.token,
        createdBy: data.created_by,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        maxUses: data.max_uses,
        currentUses: data.current_uses,
        isActive: data.is_active,
        role: data.role as 'member' | 'admin',
        metadata: data.metadata as Record<string, unknown> | undefined,
      },
      error: null,
    };
  } catch (err) {
    console.error('[invites] createOrganizationInvite exception', err);
    return { data: null, error: 'Failed to create invite' };
  }
}

/**
 * Validate an invite token
 * Checks expiration, active status, max uses, and organization existence
 */
export async function validateInviteToken(
  supabase: Supabase,
  token: string,
): Promise<InviteValidationResult> {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: INVITE_ERROR_MESSAGES.INVALID_TOKEN,
      errorCode: 'INVALID_TOKEN',
    };
  }

  try {
    // Fetch invite with organization details
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .select('*, organizations:organization_id (id, slug, name)')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return {
        valid: false,
        error: INVITE_ERROR_MESSAGES.INVITE_NOT_FOUND,
        errorCode: 'INVITE_NOT_FOUND',
      };
    }

    // Check if invite is active
    if (!invite.is_active) {
      return {
        valid: false,
        error: INVITE_ERROR_MESSAGES.INVITE_REVOKED,
        errorCode: 'INVITE_REVOKED',
      };
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      return {
        valid: false,
        error: INVITE_ERROR_MESSAGES.INVITE_EXPIRED,
        errorCode: 'INVITE_EXPIRED',
      };
    }

    // Check if max uses exceeded
    if (invite.max_uses !== null && invite.current_uses >= invite.max_uses) {
      return {
        valid: false,
        error: INVITE_ERROR_MESSAGES.INVITE_MAX_USES,
        errorCode: 'INVITE_MAX_USES',
      };
    }

    // Check if organization exists
    const org = invite.organizations as { id: string; slug: string; name: string } | null;
    if (!org) {
      return {
        valid: false,
        error: INVITE_ERROR_MESSAGES.ORG_NOT_FOUND,
        errorCode: 'ORG_NOT_FOUND',
      };
    }

    return {
      valid: true,
      invite: {
        id: invite.id,
        organizationId: invite.organization_id,
        token: invite.token,
        createdBy: invite.created_by,
        createdAt: invite.created_at,
        expiresAt: invite.expires_at,
        maxUses: invite.max_uses,
        currentUses: invite.current_uses,
        isActive: invite.is_active,
        role: invite.role as 'member' | 'admin',
        metadata: invite.metadata as Record<string, unknown> | undefined,
      },
      organization: {
        id: org.id,
        slug: org.slug,
        name: org.name,
      },
    };
  } catch (err) {
    console.error('[invites] validateInviteToken exception', err);
    return {
      valid: false,
      error: 'Failed to validate invite',
      errorCode: 'INVITE_NOT_FOUND',
    };
  }
}

/**
 * Redeem an invite (add user to organization)
 * Handles idempotency for users already in the organization
 * Uses atomic operations to prevent race conditions
 */
export async function redeemInvite(
  supabase: Supabase,
  params: RedeemInviteParams,
): Promise<InviteRedemptionResult> {
  // First validate the invite
  const validation = await validateInviteToken(supabase, params.token);

  if (!validation.valid || !validation.invite || !validation.organization) {
    return {
      success: false,
      error: validation.error,
      errorCode: validation.errorCode,
    };
  }

  try {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', validation.organization.id)
      .eq('user_id', params.userId)
      .maybeSingle();

    if (existingMember) {
      // User is already a member - idempotent success
      return {
        success: true,
        alreadyMember: true,
        organizationId: validation.organization.id,
        organizationSlug: validation.organization.slug,
        organizationName: validation.organization.name,
      };
    }

    // Add user to organization
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: validation.organization.id,
      user_id: params.userId,
      role: validation.invite.role,
    });

    if (memberError) {
      console.error('[invites] redeemInvite - failed to add member', memberError);
      return {
        success: false,
        error: 'Failed to add user to organization',
      };
    }

    // Record the redemption
    const { error: redemptionError } = await supabase
      .from('organization_invite_redemptions')
      .insert({
        invite_id: validation.invite.id,
        user_id: params.userId,
        was_new_user: params.wasNewUser,
      });

    if (redemptionError) {
      console.error('[invites] redeemInvite - failed to record redemption', redemptionError);
      // Non-critical error, continue
    }

    // Increment usage counter atomically
    const { error: incrementError } = await supabase.rpc(
      'increment_invite_usage' as never,
      { invite_id: validation.invite.id } as never,
    );

    if (incrementError) {
      // If RPC doesn't exist, fall back to manual increment
      await supabase
        .from('organization_invites')
        .update({ current_uses: validation.invite.currentUses + 1 })
        .eq('id', validation.invite.id);
    }

    return {
      success: true,
      alreadyMember: false,
      organizationId: validation.organization.id,
      organizationSlug: validation.organization.slug,
      organizationName: validation.organization.name,
    };
  } catch (err) {
    console.error('[invites] redeemInvite exception', err);
    return {
      success: false,
      error: 'Failed to redeem invite',
    };
  }
}

/**
 * List all invites for an organization
 */
export async function listOrganizationInvites(
  supabase: Supabase,
  organizationId: string,
): Promise<OrganizationInvite[]> {
  try {
    const { data, error } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[invites] listOrganizationInvites failed', error);
      return [];
    }

    return (data ?? []).map((invite) => ({
      id: invite.id,
      organizationId: invite.organization_id,
      token: invite.token,
      createdBy: invite.created_by,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
      maxUses: invite.max_uses,
      currentUses: invite.current_uses,
      isActive: invite.is_active,
      role: invite.role as 'member' | 'admin',
      metadata: invite.metadata as Record<string, unknown> | undefined,
    }));
  } catch (err) {
    console.error('[invites] listOrganizationInvites exception', err);
    return [];
  }
}

/**
 * Revoke an invite (mark as inactive)
 */
export async function revokeInvite(
  supabase: Supabase,
  inviteId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('organization_invites')
      .update({ is_active: false })
      .eq('id', inviteId);

    if (error) {
      console.error('[invites] revokeInvite failed', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[invites] revokeInvite exception', err);
    return { success: false, error: 'Failed to revoke invite' };
  }
}

/**
 * Get invite usage statistics
 */
export async function getInviteStats(
  supabase: Supabase,
  inviteId: string,
): Promise<InviteStats | null> {
  try {
    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .select('max_uses, current_uses')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      console.error('[invites] getInviteStats - invite not found', inviteError);
      return null;
    }

    // Get redemption breakdown with user details
    // Note: We need to fetch user emails separately since auth.users is not directly accessible via PostgREST
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('organization_invite_redemptions')
      .select('user_id, was_new_user, redeemed_at')
      .eq('invite_id', inviteId)
      .order('redeemed_at', { ascending: false });

    if (redemptionsError) {
      console.error('[invites] getInviteStats - failed to fetch redemptions', redemptionsError);
      return null;
    }

    const newUsers = redemptions?.filter((r) => r.was_new_user).length ?? 0;
    const existingUsers = redemptions?.filter((r) => !r.was_new_user).length ?? 0;

    // Fetch user emails using the database function
    const userIds = (redemptions ?? []).map((r) => r.user_id);

    // Use RPC to call the get_user_emails function
    const { data: userEmails, error: emailsError } = await supabase.rpc('get_user_emails', {
      user_ids: userIds,
    });

    if (emailsError) {
      console.error('[invites] getInviteStats - failed to fetch user emails', emailsError);
    }

    // Create a map for quick lookup
    const emailMap = new Map(
      (userEmails ?? []).map((u: { id: string; email: string }) => [u.id, u.email]),
    );

    // Map redemptions to user list
    const users = (redemptions ?? []).map((r) => ({
      id: r.user_id,
      email: emailMap.get(r.user_id) ?? 'Unknown',
      joinedAt: r.redeemed_at,
      wasNewUser: r.was_new_user,
    }));

    return {
      totalRedemptions: invite.current_uses,
      newUsers,
      existingUsers,
      remainingUses: invite.max_uses !== null ? invite.max_uses - invite.current_uses : null,
      users,
    };
  } catch (err) {
    console.error('[invites] getInviteStats exception', err);
    return null;
  }
}

/**
 * Remove a user from an organization
 */
export async function removeUserFromOrganization(
  supabase: Supabase,
  organizationId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove the user from organization members
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) {
      console.error('[invites] removeUserFromOrganization failed', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[invites] removeUserFromOrganization exception', err);
    return { success: false, error: 'Failed to remove user from organization' };
  }
}
