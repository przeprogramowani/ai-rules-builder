import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/db/database.types';

export type OrganizationRole = 'member' | 'admin';

export type OrganizationSummary = Pick<
  Database['public']['Tables']['organizations']['Row'],
  'id' | 'slug' | 'name'
>;

type OrganizationMembershipRow = Database['public']['Tables']['organization_members']['Row'];

type MembershipQueryRow = OrganizationMembershipRow & {
  organizations: OrganizationSummary | null;
};

export type OrganizationMembership = {
  id: string;
  slug: string;
  name: string;
  role: OrganizationRole;
};

type Supabase = SupabaseClient<Database>;

const ORGANIZATION_SELECT =
  'organization_id, role, created_at, organizations:organization_id ( id, slug, name )';

export async function fetchUserOrganizations(
  supabase: Supabase,
  userId: string,
): Promise<OrganizationMembership[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select(ORGANIZATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[prompt-manager] fetchUserOrganizations failed', error);
    return [];
  }

  const rows = (data ?? []) as MembershipQueryRow[];

  return rows
    .filter((row) => row.organizations)
    .map((row) => ({
      id: row.organizations?.id ?? row.organization_id,
      slug: row.organizations?.slug ?? row.organization_id,
      name: row.organizations?.name ?? row.organizations?.slug ?? row.organization_id,
      role: row.role === 'admin' ? 'admin' : 'member',
    }));
}

export async function fetchOrganizationBySlug(
  supabase: Supabase,
  slug: string,
): Promise<OrganizationSummary | null> {
  const normalisedSlug = slug.trim().toLowerCase();
  if (!normalisedSlug) {
    return null;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug, name')
    .eq('slug', normalisedSlug)
    .maybeSingle();

  if (error) {
    console.error('[prompt-manager] fetchOrganizationBySlug failed', error);
    return null;
  }

  return data ?? null;
}

export function selectActiveOrganization(
  memberships: OrganizationMembership[],
  requestedSlug?: string | null,
): OrganizationMembership | null {
  if (!memberships.length) {
    return null;
  }

  if (!requestedSlug) {
    return memberships[0];
  }

  const normalized = requestedSlug.trim().toLowerCase();
  if (!normalized) {
    return memberships[0];
  }

  const match = memberships.find((membership) => membership.slug.toLowerCase() === normalized);
  return match ?? memberships[0];
}
