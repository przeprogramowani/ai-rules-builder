import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/db/database.types';
import {
  buildPromptLibraryContext,
  ensurePromptLibraryEnabled,
  hasPromptLibraryAccess,
  hasPromptLibraryAdminAccess,
  shouldAllowPromptLibraryAccess,
  shouldAllowPromptLibraryAdminAccess,
} from '@/services/prompt-library/access';
import {
  fetchOrganizationBySlug,
  fetchUserOrganizations,
  selectActiveOrganization,
  type OrganizationMembership,
} from '@/services/prompt-library/organizations';

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

type MembershipRow = {
  organization_id: string;
  role: 'member' | 'admin' | string;
  created_at: string;
  updated_at: string;
  user_id: string;
  organizations: {
    id: string;
    slug: string;
    name: string;
  } | null;
};

type SupabaseQueryResult = {
  data: MembershipRow[] | null;
  error: { message: string } | null;
};

type SupabaseMembershipSpies = {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
};

type SupabaseMembershipStub = {
  client: SupabaseClient<Database>;
  spies: SupabaseMembershipSpies;
};

function createMembershipStub(result: SupabaseQueryResult): SupabaseMembershipStub {
  const order = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockImplementation(() => ({ select }));

  return {
    client: { from } as unknown as SupabaseClient<Database>,
    spies: { from, select, eq, order },
  };
}

describe('prompt manager organizations service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps supabase rows into organization memberships', async () => {
    const stub = createMembershipStub({
      data: [
        {
          organization_id: 'org-1',
          role: 'member',
          created_at: '2025-04-13T00:00:00Z',
          updated_at: '2025-04-13T00:00:00Z',
          user_id: 'user-123',
          organizations: { id: 'org-1', slug: 'org-1', name: 'Org One' },
        },
        {
          organization_id: 'org-2',
          role: 'admin',
          created_at: '2025-04-13T00:00:01Z',
          updated_at: '2025-04-13T00:00:01Z',
          user_id: 'user-123',
          organizations: { id: 'org-2', slug: 'org-2', name: 'Org Two' },
        },
      ],
      error: null,
    });

    const memberships = await fetchUserOrganizations(stub.client, 'user-123');

    expect(stub.spies.from).toHaveBeenCalledWith('organization_members');
    expect(stub.spies.select).toHaveBeenCalled();
    expect(stub.spies.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(stub.spies.order).toHaveBeenCalledWith('created_at', { ascending: true });

    expect(memberships).toEqual<OrganizationMembership[]>([
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
      { id: 'org-2', slug: 'org-2', name: 'Org Two', role: 'admin' },
    ]);
  });

  it('filters out rows without organization join data', async () => {
    const stub = createMembershipStub({
      data: [
        {
          organization_id: 'org-3',
          role: 'member',
          created_at: '2025-04-13T00:00:02Z',
          updated_at: '2025-04-13T00:00:02Z',
          user_id: 'user-123',
          organizations: null,
        },
      ],
      error: null,
    });

    const memberships = await fetchUserOrganizations(stub.client, 'user-123');
    expect(memberships).toEqual([]);
  });

  it('returns an empty array and logs when supabase errors', async () => {
    const stub = createMembershipStub({ data: null, error: { message: 'boom' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const memberships = await fetchUserOrganizations(stub.client, 'user-123');

    expect(consoleSpy).toHaveBeenCalled();
    expect(memberships).toEqual([]);
  });

  it('selects the first membership when slug missing', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
      { id: 'org-2', slug: 'org-2', name: 'Org Two', role: 'admin' },
    ];

    expect(selectActiveOrganization(memberships, null)).toEqual(memberships[0]);
  });

  it('selects membership by slug ignoring case', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
      { id: 'org-2', slug: 'org-2', name: 'Org Two', role: 'admin' },
    ];

    const active = selectActiveOrganization(memberships, 'ORG-2');
    expect(active).toEqual(memberships[1]);
  });

  it('falls back to first membership when slug invalid', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
      { id: 'org-2', slug: 'org-2', name: 'Org Two', role: 'admin' },
    ];

    const active = selectActiveOrganization(memberships, 'unknown');
    expect(active).toEqual(memberships[0]);
  });
});

describe('prompt manager access helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetEnv();
    mutableEnv.PUBLIC_ENV_NAME = 'local';
    delete mutableEnv.PUBLIC_PROMPT_LIBRARY_ENABLED;
    delete mutableEnv.PROMPT_LIBRARY_ENABLED;
  });

  afterEach(() => {
    resetEnv();
  });

  it('builds context and resolves active organization with slug override', async () => {
    const stub = createMembershipStub({
      data: [
        {
          organization_id: 'org-1',
          role: 'member',
          created_at: '2025-04-13T00:00:00Z',
          updated_at: '2025-04-13T00:00:00Z',
          user_id: 'user-123',
          organizations: { id: 'org-1', slug: 'org-1', name: 'Org One' },
        },
        {
          organization_id: 'org-2',
          role: 'admin',
          created_at: '2025-04-13T00:00:01Z',
          updated_at: '2025-04-13T00:00:01Z',
          user_id: 'user-123',
          organizations: { id: 'org-2', slug: 'org-2', name: 'Org Two' },
        },
      ],
      error: null,
    });

    const context = await buildPromptLibraryContext({
      supabase: stub.client,
      userId: 'user-123',
      requestedSlug: 'ORG-2',
    });

    expect(context.organizations).toHaveLength(2);
    expect(context.activeOrganization?.slug).toBe('org-2');
  });

  it('indicates access when memberships available', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
    ];
    expect(hasPromptLibraryAccess(memberships)).toBe(true);
  });

  it('detects admin membership correctly', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
      { id: 'org-2', slug: 'org-2', name: 'Org Two', role: 'admin' },
    ];
    expect(hasPromptLibraryAdminAccess(memberships)).toBe(true);
  });

  it('respects feature flag overrides when checking access', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-1', slug: 'org-1', name: 'Org One', role: 'member' },
    ];

    expect(shouldAllowPromptLibraryAccess(memberships, { promptLibrary: true })).toBe(true);
    expect(shouldAllowPromptLibraryAccess(memberships, { promptLibrary: false })).toBe(false);
  });

  it('respects flag overrides for admin access checks', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'org-2', slug: 'org-2', name: 'Org Two', role: 'admin' },
    ];

    expect(shouldAllowPromptLibraryAdminAccess(memberships, { promptLibrary: true })).toBe(true);
    expect(shouldAllowPromptLibraryAdminAccess(memberships, { promptLibrary: false })).toBe(false);
  });

  it('mirrors feature flag state via ensurePromptLibraryEnabled', () => {
    expect(ensurePromptLibraryEnabled()).toBe(true);
    expect(ensurePromptLibraryEnabled({ promptLibrary: false })).toBe(false);
  });
});

describe('fetchOrganizationBySlug', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when slug empty', async () => {
    const stub = {
      from: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    expect(await fetchOrganizationBySlug(stub, '')).toBeNull();
    expect(await fetchOrganizationBySlug(stub, '   ')).toBeNull();
  });

  it('returns organization summary when found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'org-1', slug: 'org-1', name: 'Org One' },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const stub = { from } as unknown as SupabaseClient<Database>;
    const result = await fetchOrganizationBySlug(stub, 'org-1');

    expect(from).toHaveBeenCalledWith('organizations');
    expect(eq).toHaveBeenCalledWith('slug', 'org-1');
    expect(result).toEqual({ id: 'org-1', slug: 'org-1', name: 'Org One' });
  });

  it('returns null and logs when supabase errors', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stub = { from } as unknown as SupabaseClient<Database>;
    const result = await fetchOrganizationBySlug(stub, 'org-1');

    expect(consoleSpy).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
