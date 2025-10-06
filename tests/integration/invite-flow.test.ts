import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createOrganizationInvite,
  validateInviteToken,
  redeemInvite,
  listOrganizationInvites,
  revokeInvite,
  getInviteStats,
} from '@/services/prompt-library/invites';
import { createMockSupabaseClient } from '../helpers/mockSupabaseClient';
import type { MockSupabaseClient } from '../helpers/mockSupabaseClient';

/**
 * Integration test that verifies the complete organization invite workflow:
 * 1. Admin creates an invite link
 * 2. Unauthenticated user validates the invite
 * 3. User signs up and redeems the invite (auto-joins org)
 * 4. Admin views invite statistics
 * 5. Admin revokes the invite
 */
describe('Organization Invite Flow Integration Test', () => {
  const ORG_ID = 'org-test-1';
  const ADMIN_USER_ID = 'user-admin-1';
  const NEW_USER_ID = 'user-new-1';
  const EXISTING_USER_ID = 'user-existing-1';

  let mockSupabase: MockSupabaseClient;
  let createdInviteId: string;
  let createdInviteToken: string;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    createdInviteId = 'invite-test-1';
    createdInviteToken = 'test-invite-token-123';
  });

  it('completes the full invite workflow successfully', async () => {
    // Step 1: Admin creates an invite link
    const mockCreatedInvite = {
      id: createdInviteId,
      organization_id: ORG_ID,
      token: createdInviteToken,
      created_by: ADMIN_USER_ID,
      created_at: '2025-01-01T00:00:00Z',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days from now
      max_uses: 50,
      current_uses: 0,
      is_active: true,
      role: 'member',
      metadata: {},
    };

    const createQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCreatedInvite, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockReturnValue(createQueryBuilder),
    });

    const createResult = await createOrganizationInvite(mockSupabase, {
      organizationId: ORG_ID,
      createdBy: ADMIN_USER_ID,
      expiresInDays: 7,
      maxUses: 50,
      role: 'member',
    });

    expect(createResult.error).toBeNull();
    expect(createResult.data).toBeTruthy();
    expect(createResult.data?.organizationId).toBe(ORG_ID);
    expect(createResult.data?.maxUses).toBe(50);

    // Step 2: Unauthenticated user validates the invite
    const mockValidationInvite = {
      ...mockCreatedInvite,
      organizations: {
        id: ORG_ID,
        slug: 'test-org',
        name: 'Test Organization',
      },
    };

    const validateQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockValidationInvite, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(validateQueryBuilder),
    });

    const validationResult = await validateInviteToken(mockSupabase, createdInviteToken);

    expect(validationResult.valid).toBe(true);
    expect(validationResult.organization?.name).toBe('Test Organization');
    expect(validationResult.invite?.maxUses).toBe(50);
    expect(validationResult.invite?.currentUses).toBe(0);

    // Step 3a: New user signs up and redeems invite
    // First, validate invite again
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(validateQueryBuilder),
    });

    // Check if user is already a member (should not be)
    const memberCheckQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(memberCheckQueryBuilder),
    });

    // Insert new organization member
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    // Insert redemption record
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    // Mock RPC for incrementing invite usage (succeeds, so no fallback update needed)
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const redeemResult = await redeemInvite(mockSupabase, {
      token: createdInviteToken,
      userId: NEW_USER_ID,
      wasNewUser: true,
    });

    expect(redeemResult.success).toBe(true);
    expect(redeemResult.organizationName).toBe('Test Organization');
    expect(redeemResult.alreadyMember).toBe(false);

    // Step 3b: Existing user redeems invite (should also work)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(validateQueryBuilder),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(memberCheckQueryBuilder),
    });

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    // Mock RPC for incrementing invite usage
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const existingUserRedeemResult = await redeemInvite(mockSupabase, {
      token: createdInviteToken,
      userId: EXISTING_USER_ID,
      wasNewUser: false,
    });

    expect(existingUserRedeemResult.success).toBe(true);

    // Step 4: Admin views invite statistics
    // Mock 1: Get invite details
    const inviteSingle = vi.fn().mockResolvedValue({
      data: { max_uses: 50, current_uses: 2 },
      error: null,
    });
    const inviteEq = vi.fn().mockReturnValue({ single: inviteSingle });
    const inviteSelect = vi.fn().mockReturnValue({ eq: inviteEq });

    // Mock 2: Get redemptions
    const mockRedemptions = [
      {
        id: 'redemption-1',
        invite_id: createdInviteId,
        user_id: NEW_USER_ID,
        redeemed_at: '2025-01-01T10:00:00Z',
        was_new_user: true,
      },
      {
        id: 'redemption-2',
        invite_id: createdInviteId,
        user_id: EXISTING_USER_ID,
        redeemed_at: '2025-01-01T11:00:00Z',
        was_new_user: false,
      },
    ];
    const redemptionsOrder = vi.fn().mockResolvedValue({ data: mockRedemptions, error: null });
    const redemptionsEq = vi.fn().mockReturnValue({ order: redemptionsOrder });
    const redemptionsSelect = vi.fn().mockReturnValue({ eq: redemptionsEq });

    mockSupabase.from
      .mockReturnValueOnce({ select: inviteSelect })
      .mockReturnValueOnce({ select: redemptionsSelect });

    // Mock 3: RPC for user emails (new function returns user_id)
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [
        { user_id: NEW_USER_ID, email: 'newuser@example.com' },
        { user_id: EXISTING_USER_ID, email: 'existinguser@example.com' },
      ],
      error: null,
    });

    const stats = await getInviteStats(mockSupabase, createdInviteId);

    expect(stats).toBeTruthy();
    expect(stats?.totalRedemptions).toBe(2);
    expect(stats?.newUsers).toBe(1);
    expect(stats?.existingUsers).toBe(1);

    // Step 5: Admin lists all invites for organization
    const mockInvitesList = [
      mockCreatedInvite,
      {
        id: 'invite-test-2',
        organization_id: ORG_ID,
        token: 'another-token',
        created_by: ADMIN_USER_ID,
        created_at: '2025-01-02T00:00:00Z',
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        max_uses: null,
        current_uses: 0,
        is_active: true,
        role: 'admin',
        metadata: {},
      },
    ];

    const listQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockInvitesList, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(listQueryBuilder),
    });

    const listResult = await listOrganizationInvites(mockSupabase, ORG_ID);

    expect(listResult).toHaveLength(2);
    expect(Array.isArray(listResult)).toBe(true);

    // Step 6: Admin revokes the invite
    const revokeEq = vi.fn().mockResolvedValue({
      data: { ...mockCreatedInvite, is_active: false },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({ eq: revokeEq }),
    });

    const revokeResult = await revokeInvite(mockSupabase, createdInviteId);

    expect(revokeResult.success).toBe(true);
    expect(revokeResult.error).toBeUndefined();

    // Step 7: Verify revoked invite cannot be validated
    const mockRevokedInvite = {
      ...mockValidationInvite,
      is_active: false,
    };

    const revokedValidateQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRevokedInvite, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(revokedValidateQueryBuilder),
    });

    const revokedValidationResult = await validateInviteToken(mockSupabase, createdInviteToken);

    expect(revokedValidationResult.valid).toBe(false);
    expect(revokedValidationResult.errorCode).toBe('INVITE_REVOKED');
  });

  it('handles invite expiration correctly', async () => {
    const expiredToken = 'expired-token';
    const mockExpiredInvite = {
      id: 'expired-invite-1',
      organization_id: ORG_ID,
      token: expiredToken,
      created_by: ADMIN_USER_ID,
      created_at: '2025-01-01T00:00:00Z',
      expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      max_uses: null,
      current_uses: 0,
      is_active: true,
      role: 'member',
      metadata: {},
      organizations: {
        id: ORG_ID,
        slug: 'test-org',
        name: 'Test Organization',
      },
    };

    const validateQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockExpiredInvite, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(validateQueryBuilder),
    });

    const validationResult = await validateInviteToken(mockSupabase, expiredToken);

    expect(validationResult.valid).toBe(false);
    expect(validationResult.errorCode).toBe('INVITE_EXPIRED');
  });

  it('handles max uses exceeded correctly', async () => {
    const maxedToken = 'maxed-token';
    const mockMaxedInvite = {
      id: 'maxed-invite-1',
      organization_id: ORG_ID,
      token: maxedToken,
      created_by: ADMIN_USER_ID,
      created_at: '2025-01-01T00:00:00Z',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      max_uses: 10,
      current_uses: 10, // Maxed out
      is_active: true,
      role: 'member',
      metadata: {},
      organizations: {
        id: ORG_ID,
        slug: 'test-org',
        name: 'Test Organization',
      },
    };

    const validateQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMaxedInvite, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(validateQueryBuilder),
    });

    const validationResult = await validateInviteToken(mockSupabase, maxedToken);

    expect(validationResult.valid).toBe(false);
    expect(validationResult.errorCode).toBe('INVITE_MAX_USES');
  });

  it('handles user already being a member (idempotent redemption)', async () => {
    const mockInvite = {
      id: createdInviteId,
      organization_id: ORG_ID,
      token: createdInviteToken,
      created_by: ADMIN_USER_ID,
      created_at: '2025-01-01T00:00:00Z',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      max_uses: null,
      current_uses: 0,
      is_active: true,
      role: 'member',
      metadata: {},
      organizations: {
        id: ORG_ID,
        slug: 'test-org',
        name: 'Test Organization',
      },
    };

    // Validate invite
    const validateQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockInvite, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(validateQueryBuilder),
    });

    // User is already a member
    const memberCheckQueryBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          user_id: EXISTING_USER_ID,
          organization_id: ORG_ID,
          role: 'member',
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          user_id: EXISTING_USER_ID,
          organization_id: ORG_ID,
          role: 'member',
        },
        error: null,
      }),
    };
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue(memberCheckQueryBuilder),
    });

    const redeemResult = await redeemInvite(mockSupabase, {
      token: createdInviteToken,
      userId: EXISTING_USER_ID,
      wasNewUser: false,
    });

    expect(redeemResult.success).toBe(true);
    expect(redeemResult.alreadyMember).toBe(true);
    expect(redeemResult.organizationName).toBe('Test Organization');
  });
});
