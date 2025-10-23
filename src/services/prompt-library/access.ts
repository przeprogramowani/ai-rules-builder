import type { SupabaseClient } from '@supabase/supabase-js';

import {
  isPromptLibraryEnabled,
  PROMPT_LIBRARY_ENABLED,
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

type PromptLibraryContextOptions = {
  supabase: Supabase;
  userId: string;
  requestedSlug?: string | null;
};

export type PromptLibraryContext = {
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;
};

export async function buildPromptLibraryContext(
  options: PromptLibraryContextOptions,
): Promise<PromptLibraryContext> {
  const organizations = await fetchUserOrganizations(options.supabase, options.userId);
  const activeOrganization = selectActiveOrganization(organizations, options.requestedSlug);

  return {
    organizations,
    activeOrganization,
  };
}

export function hasPromptLibraryAccess(organizations: OrganizationMembership[]): boolean {
  return organizations.length > 0;
}

export function hasPromptLibraryAdminAccess(organizations: OrganizationMembership[]): boolean {
  return organizations.some((membership) => membership.role === 'admin');
}

export function ensurePromptLibraryEnabled(flags?: Partial<Record<FeatureFlag, boolean>>): boolean {
  return isPromptLibraryEnabled(flags);
}

export function shouldAllowPromptLibraryAccess(
  organizations: OrganizationMembership[],
  flags?: Partial<Record<FeatureFlag, boolean>>,
): boolean {
  if (!ensurePromptLibraryEnabled(flags)) {
    return false;
  }

  return hasPromptLibraryAccess(organizations);
}

export function shouldAllowPromptLibraryAdminAccess(
  organizations: OrganizationMembership[],
  flags?: Partial<Record<FeatureFlag, boolean>>,
): boolean {
  if (!ensurePromptLibraryEnabled(flags)) {
    return false;
  }

  return hasPromptLibraryAdminAccess(organizations);
}

export {
  fetchOrganizationBySlug,
  fetchUserOrganizations,
  selectActiveOrganization,
  PROMPT_LIBRARY_ENABLED,
};
export type { OrganizationMembership, OrganizationRole } from './organizations';
