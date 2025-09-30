import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

type MutableEnv = Record<string, unknown>;

const mutableEnv = import.meta.env as MutableEnv;
const originalEnv = { ...mutableEnv };

function resetEnv() {
  for (const key of Object.keys(mutableEnv)) {
    if (!(key in originalEnv)) {
      delete mutableEnv[key];
    }
  }

  Object.assign(mutableEnv, originalEnv);
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: overrides.id ?? 'user-123',
    aud: overrides.aud ?? 'authenticated',
    created_at: overrides.created_at ?? new Date().toISOString(),
    email: overrides.email ?? 'member@example.com',
    phone: overrides.phone ?? '',
    app_metadata: overrides.app_metadata ?? {},
    user_metadata: overrides.user_metadata ?? {},
    role: overrides.role ?? 'authenticated',
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    identities: overrides.identities ?? [],
    factors: overrides.factors ?? [],
    confirmed_at: overrides.confirmed_at ?? new Date().toISOString(),
    email_confirmed_at: overrides.email_confirmed_at ?? new Date().toISOString(),
    phone_confirmed_at: overrides.phone_confirmed_at ?? null,
    last_sign_in_at: overrides.last_sign_in_at ?? new Date().toISOString(),
    app_state: overrides.app_state ?? undefined,
    raw_app_meta_data: overrides.raw_app_meta_data ?? {},
    raw_user_meta_data: overrides.raw_user_meta_data ?? {},
    reauthentication_token: overrides.reauthentication_token ?? null,
    reauthentication_token_sent_at: overrides.reauthentication_token_sent_at ?? null,
    is_anonymous: overrides.is_anonymous ?? false,
    invited_at: overrides.invited_at ?? null,
    email_change_confirm_status: overrides.email_change_confirm_status ?? 0,
    email_change_sent_at: overrides.email_change_sent_at ?? null,
    email_change_token_current: overrides.email_change_token_current ?? null,
    email_change_token_new: overrides.email_change_token_new ?? null,
    email_change: overrides.email_change ?? null,
    phone_change: overrides.phone_change ?? '',
    phone_change_sent_at: overrides.phone_change_sent_at ?? null,
    phone_change_token: overrides.phone_change_token ?? null,
    phone_change_token_current: overrides.phone_change_token_current ?? null,
    phone_change_token_new: overrides.phone_change_token_new ?? null,
    recovery_sent_at: overrides.recovery_sent_at ?? null,
    confirmation_sent_at: overrides.confirmation_sent_at ?? null,
  } as User;
}

describe('prompt manager access helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
    mutableEnv.PUBLIC_ENV_NAME = 'prod';
    delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
    delete mutableEnv.PROMPT_MANAGER_ENABLED;
  });

  it('returns empty organizations when metadata missing', async () => {
    const { getUserOrganizations } = await import('@/services/prompt-manager/access');
    const result = getUserOrganizations(createUser());
    expect(result.organizations).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });

  it('parses prompt manager organizations from metadata array', async () => {
    const { getUserOrganizations, hasPromptManagerAccess } = await import('@/services/prompt-manager/access');
    const user = createUser({
      user_metadata: {
        prompt_manager: {
          organizations: [
            { id: 'org-1', role: 'member', name: 'Org One', slug: 'org-1' },
            { organizationId: 'org-2', role: 'admin', name: 'Org Two' },
          ],
        },
      },
    });

    const result = getUserOrganizations(user);
    expect(result.organizations).toHaveLength(2);
    expect(result.organizations[0]).toMatchObject({ id: 'org-1', role: 'member', name: 'Org One' });
    expect(result.organizations[1]).toMatchObject({ id: 'org-2', role: 'admin' });
    expect(hasPromptManagerAccess(user, result)).toBe(true);
  });

  it('collects issues and falls back to default organization when entries invalid', async () => {
    const { getUserOrganizations } = await import('@/services/prompt-manager/access');
    const user = createUser({
      app_metadata: {
        prompt_manager: {
          organizations: [{ role: 'admin' }],
        },
      },
    });

    const result = getUserOrganizations(user);
    expect(result.organizations).toHaveLength(1);
    expect(result.organizations[0]).toMatchObject({ id: '10xdevs', role: 'member' });
    expect(result.issues.map((issue) => issue.code)).toContain('missing_identifier');
  });

  it('creates default membership when boolean access flag is set', async () => {
    const { getUserOrganizations } = await import('@/services/prompt-manager/access');
    const user = createUser({
      user_metadata: {
        promptManagerAccess: {
          hasPromptManagerAccess: true,
        },
      },
    });

    const result = getUserOrganizations(user);
    expect(result.organizations).toEqual([
      expect.objectContaining({ id: '10xdevs', role: 'member' }),
    ]);
  });

  it('detects admin membership via helper', async () => {
    const { getUserOrganizations, hasPromptManagerAdminAccess } = await import('@/services/prompt-manager/access');
    const user = createUser({
      user_metadata: {
        prompt_manager: {
          organizationMemberships: [{ organization_id: 'org-admin', role: 'admin' }],
        },
      },
    });

    const result = getUserOrganizations(user);
    expect(hasPromptManagerAdminAccess(user, result)).toBe(true);
  });
});
