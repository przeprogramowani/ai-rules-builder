import type { SupabaseClient } from '@supabase/supabase-js';

import {
  isPromptManagerEnabled,
  PROMPT_MANAGER_ENABLED,
  type FeatureFlag,
} from '@/features/featureFlags';
import type { Database } from '@/db/database.types';
import {
  fetchOrganizationBySlug,
  fetchUserOrganizations,
  selectActiveOrganization,
  type OrganizationMembership,
} from './organizations';

type Supabase = SupabaseClient<Database>;

type PromptManagerContextOptions = {
  supabase: Supabase;
  userId: string;
  requestedSlug?: string | null;
};

export type PromptManagerContext = {
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;
};

export async function buildPromptManagerContext(
  options: PromptManagerContextOptions,
): Promise<PromptManagerContext> {
  const organizations = await fetchUserOrganizations(options.supabase, options.userId);
  const activeOrganization = selectActiveOrganization(organizations, options.requestedSlug);

  return {
    organizations,
    activeOrganization,
  };
}

export function hasPromptManagerAccess(organizations: OrganizationMembership[]): boolean {
  return organizations.length > 0;
}

export function hasPromptManagerAdminAccess(organizations: OrganizationMembership[]): boolean {
  return organizations.some((membership) => membership.role === 'admin');
}

export function ensurePromptManagerEnabled(flags?: Partial<Record<FeatureFlag, boolean>>): boolean {
  return isPromptManagerEnabled(flags);
}

export function shouldAllowPromptManagerAccess(
  organizations: OrganizationMembership[],
  flags?: Partial<Record<FeatureFlag, boolean>>,
): boolean {
  if (!ensurePromptManagerEnabled(flags)) {
    return false;
  }

  return hasPromptManagerAccess(organizations);
}

export function shouldAllowPromptManagerAdminAccess(
  organizations: OrganizationMembership[],
  flags?: Partial<Record<FeatureFlag, boolean>>,
): boolean {
  if (!ensurePromptManagerEnabled(flags)) {
    return false;
  }

  return hasPromptManagerAdminAccess(organizations);
}

export {
  fetchOrganizationBySlug,
  fetchUserOrganizations,
  selectActiveOrganization,
  PROMPT_MANAGER_ENABLED,
};
export type { OrganizationMembership, OrganizationRole } from './organizations';
