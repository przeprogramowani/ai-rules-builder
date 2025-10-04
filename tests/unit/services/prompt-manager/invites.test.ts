import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  generateInviteToken,
  createOrganizationInvite,
  validateInviteToken,
  redeemInvite,
  listOrganizationInvites,
  revokeInvite,
  getInviteStats,
} from '@/services/prompt-manager/invites';
import type { OrganizationInvite } from '@/types/invites';
import { INVITE_ERROR_MESSAGES } from '@/types/invites';
import { createMockSupabaseClient } from '../../../helpers/mockSupabaseClient';
import type { MockSupabaseClient } from '../../../helpers/mockSupabaseClient';

describe('invites service', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('generateInviteToken', () => {
    it('generates a unique token each time', async () => {
      const token1 = await generateInviteToken();
      const token2 = await generateInviteToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
    });

    it('generates a token of expected length', async () => {
      const token = await generateInviteToken();
      // 32 bytes base64url encoded should be ~43 characters
      expect(token.length).toBeGreaterThan(40);
    });
  });

  describe('createOrganizationInvite', () => {
    it('creates an invite successfully', async () => {
      const mockInvite = {
        id: 'invite-1',
        organization_id: 'org-1',
        token: 'test-token',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: '2025-01-08T00:00:00Z',
        max_uses: null,
        current_uses: 0,
        is_active: true,
        role: 'member',
        metadata: {},
      };

      const single = vi.fn().mockResolvedValue({ data: mockInvite, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      mockSupabase.from.mockReturnValue({ insert });

      const result = await createOrganizationInvite(mockSupabase as unknown as SupabaseClient, {
        organizationId: 'org-1',
        createdBy: 'user-1',
        expiresInDays: 7,
        role: 'member',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.organizationId).toBe('org-1');
      expect(result.data?.role).toBe('member');
    });

    it('creates an invite with max uses', async () => {
      const mockInvite = {
        id: 'invite-2',
        organization_id: 'org-1',
        token: 'test-token',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: '2025-01-08T00:00:00Z',
        max_uses: 10,
        current_uses: 0,
        is_active: true,
        role: 'admin',
        metadata: {},
      };

      const single = vi.fn().mockResolvedValue({ data: mockInvite, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      mockSupabase.from.mockReturnValue({ insert });

      const result = await createOrganizationInvite(mockSupabase as unknown as SupabaseClient, {
        organizationId: 'org-1',
        createdBy: 'user-1',
        expiresInDays: 7,
        maxUses: 10,
        role: 'admin',
      });

      expect(result.data?.maxUses).toBe(10);
      expect(result.data?.role).toBe('admin');
    });

    it('handles database errors gracefully', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      mockSupabase.from.mockReturnValue({ insert });

      const result = await createOrganizationInvite(mockSupabase as unknown as SupabaseClient, {
        organizationId: 'org-1',
        createdBy: 'user-1',
        expiresInDays: 7,
        role: 'member',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('validateInviteToken', () => {
    it('validates a valid invite token', async () => {
      const mockInvite = {
        id: 'invite-1',
        organization_id: 'org-1',
        token: 'valid-token',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        max_uses: null,
        current_uses: 0,
        is_active: true,
        role: 'member',
        metadata: {},
        organizations: {
          id: 'org-1',
          slug: 'test-org',
          name: 'Test Organization',
        },
      };

      const single = vi.fn().mockResolvedValue({ data: mockInvite, error: null });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await validateInviteToken(mockSupabase as unknown as SupabaseClient, 'valid-token');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.organization?.name).toBe('Test Organization');
    });

    it('rejects an invalid token', async () => {
      const result = await validateInviteToken(mockSupabase as unknown as SupabaseClient, '');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVITE_ERROR_MESSAGES.INVALID_TOKEN);
    });

    it('rejects a non-existent invite', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await validateInviteToken(mockSupabase as unknown as SupabaseClient, 'non-existent');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVITE_ERROR_MESSAGES.INVITE_NOT_FOUND);
    });

    it('rejects a revoked invite', async () => {
      const mockInvite = {
        id: 'invite-1',
        organization_id: 'org-1',
        token: 'revoked-token',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        max_uses: null,
        current_uses: 0,
        is_active: false, // Revoked
        role: 'member',
        metadata: {},
        organizations: { id: 'org-1', slug: 'test-org', name: 'Test Organization' },
      };

      const single = vi.fn().mockResolvedValue({ data: mockInvite, error: null });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await validateInviteToken(mockSupabase as unknown as SupabaseClient, 'revoked-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVITE_ERROR_MESSAGES.INVITE_REVOKED);
    });

    it('rejects an expired invite', async () => {
      const mockInvite = {
        id: 'invite-1',
        organization_id: 'org-1',
        token: 'expired-token',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        max_uses: null,
        current_uses: 0,
        is_active: true,
        role: 'member',
        metadata: {},
        organizations: { id: 'org-1', slug: 'test-org', name: 'Test Organization' },
      };

      const single = vi.fn().mockResolvedValue({ data: mockInvite, error: null });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await validateInviteToken(mockSupabase as unknown as SupabaseClient, 'expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVITE_ERROR_MESSAGES.INVITE_EXPIRED);
    });

    it('rejects an invite that reached max uses', async () => {
      const mockInvite = {
        id: 'invite-1',
        organization_id: 'org-1',
        token: 'maxed-token',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        max_uses: 10,
        current_uses: 10, // Maxed out
        is_active: true,
        role: 'member',
        metadata: {},
        organizations: { id: 'org-1', slug: 'test-org', name: 'Test Organization' },
      };

      const single = vi.fn().mockResolvedValue({ data: mockInvite, error: null });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await validateInviteToken(mockSupabase as unknown as SupabaseClient, 'maxed-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVITE_ERROR_MESSAGES.INVITE_MAX_USES);
    });
  });

  describe('listOrganizationInvites', () => {
    it('lists invites for an organization', async () => {
      const mockInvites = [
        {
          id: 'invite-1',
          organization_id: 'org-1',
          token: 'token-1',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          expires_at: '2025-01-08T00:00:00Z',
          max_uses: null,
          current_uses: 0,
          is_active: true,
          role: 'member',
          metadata: {},
        },
        {
          id: 'invite-2',
          organization_id: 'org-1',
          token: 'token-2',
          created_by: 'user-1',
          created_at: '2025-01-02T00:00:00Z',
          expires_at: '2025-01-09T00:00:00Z',
          max_uses: 10,
          current_uses: 5,
          is_active: true,
          role: 'admin',
          metadata: {},
        },
      ];

      const order = vi.fn().mockResolvedValue({ data: mockInvites, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await listOrganizationInvites(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles errors when listing invites', async () => {
      const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await listOrganizationInvites(mockSupabase as unknown as SupabaseClient, 'org-1');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('revokeInvite', () => {
    it('revokes an invite successfully', async () => {
      const single = vi.fn().mockResolvedValue({ data: { is_active: false }, error: null });
      const eq = vi.fn().mockReturnValue({ single });
      const update = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ update });

      const result = await revokeInvite(mockSupabase as unknown as SupabaseClient, 'invite-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('organization_invites');
      expect(update).toHaveBeenCalledWith({ is_active: false });
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('handles errors when revoking', async () => {
      const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const update = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ update });

      const result = await revokeInvite(mockSupabase as unknown as SupabaseClient, 'invite-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getInviteStats', () => {
    it('retrieves invite statistics', async () => {
      // Mock 1: Get invite details (first from call)
      const inviteSingle = vi.fn().mockResolvedValue({
        data: { max_uses: null, current_uses: 3 },
        error: null,
      });
      const inviteEq = vi.fn().mockReturnValue({ single: inviteSingle });
      const inviteSelect = vi.fn().mockReturnValue({ eq: inviteEq });

      // Mock 2: Get redemptions (second from call)
      const mockRedemptions = [
        { id: '1', invite_id: 'invite-1', user_id: 'user-1', was_new_user: true, redeemed_at: '2025-01-01T00:00:00Z' },
        { id: '2', invite_id: 'invite-1', user_id: 'user-2', was_new_user: false, redeemed_at: '2025-01-02T00:00:00Z' },
        { id: '3', invite_id: 'invite-1', user_id: 'user-3', was_new_user: true, redeemed_at: '2025-01-03T00:00:00Z' },
      ];
      const redemptionsOrder = vi.fn().mockResolvedValue({ data: mockRedemptions, error: null });
      const redemptionsEq = vi.fn().mockReturnValue({ order: redemptionsOrder });
      const redemptionsSelect = vi.fn().mockReturnValue({ eq: redemptionsEq });

      // Setup from() to return different mocks based on call order
      mockSupabase.from
        .mockReturnValueOnce({ select: inviteSelect })          // First call: organization_invites
        .mockReturnValueOnce({ select: redemptionsSelect });    // Second call: organization_invite_redemptions

      // Mock 3: RPC call for user emails
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' },
          { id: 'user-3', email: 'user3@example.com' },
        ],
        error: null,
      });

      const result = await getInviteStats(mockSupabase as unknown as SupabaseClient, 'invite-1');

      expect(result).toEqual({
        totalRedemptions: 3,
        newUsers: 2,
        existingUsers: 1,
        remainingUses: null,
        users: expect.arrayContaining([
          expect.objectContaining({ id: 'user-1', wasNewUser: true, email: 'user1@example.com' }),
          expect.objectContaining({ id: 'user-2', wasNewUser: false, email: 'user2@example.com' }),
          expect.objectContaining({ id: 'user-3', wasNewUser: true, email: 'user3@example.com' }),
        ]),
      });
    });

    it('returns null for non-existent invite', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValueOnce({ select });

      const result = await getInviteStats(mockSupabase as unknown as SupabaseClient, 'non-existent');

      expect(result).toBeNull();
    });
  });
});
