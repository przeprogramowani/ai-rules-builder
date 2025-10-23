/**
 * Organization invite system types
 * Supports time-limited, multi-use invite links for organization onboarding
 */

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  token: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  role: 'member' | 'admin';
  metadata?: Record<string, unknown>;
}

export interface OrganizationInviteRedemption {
  id: string;
  inviteId: string;
  userId: string;
  redeemedAt: string;
  wasNewUser: boolean;
}

export interface InviteValidationResult {
  valid: boolean;
  invite?: OrganizationInvite;
  organization?: {
    id: string;
    slug: string;
    name: string;
  };
  error?: string;
  errorCode?: InviteErrorCode;
}

export interface InviteRedemptionResult {
  success: boolean;
  alreadyMember?: boolean;
  organizationId?: string;
  organizationSlug?: string;
  organizationName?: string;
  error?: string;
  errorCode?: InviteErrorCode;
}

export interface CreateInviteParams {
  organizationId: string;
  createdBy: string;
  expiresInDays: number;
  maxUses?: number;
  role: 'member' | 'admin';
}

export interface RedeemInviteParams {
  token: string;
  userId: string;
  wasNewUser: boolean;
}

export interface InviteUser {
  id: string;
  email: string;
  joinedAt: string;
  wasNewUser: boolean;
}

export interface InviteStats {
  totalRedemptions: number;
  newUsers: number;
  existingUsers: number;
  remainingUses: number | null;
  users: InviteUser[];
}

export type InviteErrorCode =
  | 'INVITE_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_REVOKED'
  | 'INVITE_MAX_USES'
  | 'ORG_NOT_FOUND'
  | 'ALREADY_MEMBER'
  | 'INVALID_TOKEN'
  | 'UNAUTHORIZED';

export const INVITE_ERROR_MESSAGES: Record<InviteErrorCode, string> = {
  INVITE_NOT_FOUND: 'This invite link is invalid. Please check the link and try again.',
  INVITE_EXPIRED:
    'This invite link has expired. Please request a new invite from your administrator.',
  INVITE_REVOKED: 'This invite link has been revoked. Please contact your administrator.',
  INVITE_MAX_USES:
    'This invite link has reached its maximum number of uses. Please request a new invite.',
  ORG_NOT_FOUND: 'The organization for this invite no longer exists.',
  ALREADY_MEMBER: "You're already a member of this organization.",
  INVALID_TOKEN: 'Invalid invite token format.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
};
