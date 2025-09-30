import type { User } from '@supabase/supabase-js';
import {
  isPromptManagerEnabled,
  PROMPT_MANAGER_ENABLED,
  type FeatureFlag,
} from '@/features/featureFlags';

const DEFAULT_ORGANIZATION_SLUG = '10xdevs';
const DEFAULT_ORGANIZATION_NAME = '10xDevs';
const FALLBACK_MEMBERSHIP_ROLE: OrganizationRole = 'member';
const VALID_ROLES: OrganizationRole[] = ['member', 'admin'];

const METADATA_KEYS = [
  'prompt_manager',
  'promptManager',
  'prompt_manager_access',
  'promptManagerAccess',
] as const;
const MEMBERSHIP_COLLECTION_KEYS = [
  'organizations',
  'organization_memberships',
  'organizationMemberships',
  'memberships',
] as const;
const ACCESS_FLAG_KEYS = [
  'hasPromptManagerAccess',
  'has_access',
  'hasAccess',
  'prompt_manager_enabled',
] as const;

type MembershipSource = 'metadata' | 'fallback';

export type OrganizationRole = 'member' | 'admin';

export type OrganizationMembership = {
  id: string;
  role: OrganizationRole;
  slug: string;
  name: string;
  source: MembershipSource;
};

export type OrganizationParseIssueCode =
  | 'invalid_role'
  | 'missing_identifier'
  | 'not_array'
  | 'unknown_shape';

export type OrganizationParseIssue = {
  code: OrganizationParseIssueCode;
  message: string;
  raw?: unknown;
};

export type UserOrganizationsResult = {
  organizations: OrganizationMembership[];
  issues: OrganizationParseIssue[];
};

const DEFAULT_MEMBERSHIP: OrganizationMembership = {
  id: DEFAULT_ORGANIZATION_SLUG,
  slug: DEFAULT_ORGANIZATION_SLUG,
  name: DEFAULT_ORGANIZATION_NAME,
  role: FALLBACK_MEMBERSHIP_ROLE,
  source: 'fallback',
};

const isLocalEnv = (import.meta.env?.PUBLIC_ENV_NAME as string | undefined) === 'local';

function stringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function collectMetadataContainers(user: User): Record<string, unknown>[] {
  const containers: Record<string, unknown>[] = [];
  const appMetadata = asRecord(user.app_metadata);
  const userMetadata = asRecord(user.user_metadata);

  if (appMetadata) {
    containers.push(appMetadata);
  }

  if (userMetadata) {
    containers.push(userMetadata);
  }

  const nestedCandidates = [appMetadata, userMetadata].flatMap((metadata) =>
    METADATA_KEYS.map((key) => (metadata ? asRecord(metadata[key]) : null)).filter(Boolean),
  ) as Record<string, unknown>[];

  containers.push(...nestedCandidates);

  return containers;
}

function collectMembershipCandidates(
  containers: Record<string, unknown>[],
  issues: OrganizationParseIssue[],
): unknown[] {
  const candidates: unknown[] = [];

  for (const container of containers) {
    for (const key of MEMBERSHIP_COLLECTION_KEYS) {
      const raw = container[key];

      if (Array.isArray(raw)) {
        candidates.push(...raw);
        continue;
      }

      const record = asRecord(raw);
      if (record && Array.isArray(record.data)) {
        candidates.push(...record.data);
        continue;
      }

      if (raw && !Array.isArray(raw) && typeof raw === 'object') {
        const nestedArray = Array.isArray((raw as { items?: unknown[] }).items)
          ? (raw as { items: unknown[] }).items
          : null;
        if (nestedArray) {
          candidates.push(...nestedArray);
          continue;
        }
      }

      if (raw !== undefined) {
        const issue: OrganizationParseIssue = {
          code: 'not_array',
          message: `Expected organization memberships under key "${key}" to be an array-like structure.`,
          raw,
        };
        issues.push(issue);
        logIssue(issue);
      }
    }
  }

  return candidates;
}

function checkBooleanAccessFlag(containers: Record<string, unknown>[]): boolean {
  return containers.some((container) =>
    ACCESS_FLAG_KEYS.some((key) => {
      const value = container[key];
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['1', 'true', 'on', 'yes'].includes(normalized);
      }
      return false;
    }),
  );
}

function normaliseMembership(
  raw: Record<string, unknown>,
): OrganizationMembership | { issue: OrganizationParseIssue } {
  const id =
    stringOrNull(raw.id) ??
    stringOrNull(raw.organization_id) ??
    stringOrNull(raw.organizationId) ??
    stringOrNull(raw.slug) ??
    null;

  if (!id) {
    return {
      issue: {
        code: 'missing_identifier',
        message: 'Unable to resolve organization identifier from metadata entry.',
        raw,
      },
    };
  }

  const roleValue = stringOrNull(raw.role)?.toLowerCase();
  const role = VALID_ROLES.find((candidate) => candidate === roleValue);

  if (!role) {
    return {
      issue: {
        code: 'invalid_role',
        message: 'Organization membership role missing or invalid.',
        raw,
      },
    };
  }

  const slug =
    stringOrNull(raw.slug) ?? (id === DEFAULT_ORGANIZATION_SLUG ? DEFAULT_ORGANIZATION_SLUG : id);
  const name =
    stringOrNull(raw.name) ??
    (slug === DEFAULT_ORGANIZATION_SLUG ? DEFAULT_ORGANIZATION_NAME : slug);

  return {
    id,
    role,
    slug,
    name,
    source: 'metadata',
  };
}

function logIssue(issue: OrganizationParseIssue) {
  if (isLocalEnv) {
    console.debug('[prompt-manager] metadata parse issue', issue);
  }
}

export function getUserOrganizations(user: User | null): UserOrganizationsResult {
  if (!user) {
    return { organizations: [], issues: [] };
  }

  const containers = collectMetadataContainers(user);
  const issues: OrganizationParseIssue[] = [];
  const membershipCandidates = collectMembershipCandidates(containers, issues);

  const organizations: OrganizationMembership[] = [];

  for (const candidate of membershipCandidates) {
    const record = asRecord(candidate);
    if (!record) {
      const issue: OrganizationParseIssue = {
        code: 'unknown_shape',
        message: 'Organization membership entry is not an object.',
        raw: candidate,
      };
      issues.push(issue);
      logIssue(issue);
      continue;
    }

    const result = normaliseMembership(record);
    if ('issue' in result) {
      issues.push(result.issue);
      logIssue(result.issue);
      continue;
    }

    organizations.push(result);
  }

  if (!organizations.length) {
    if (membershipCandidates.length > 0 || checkBooleanAccessFlag(containers)) {
      return {
        organizations: [{ ...DEFAULT_MEMBERSHIP }],
        issues,
      };
    }

    return {
      organizations: [],
      issues,
    };
  }

  return {
    organizations: organizations.map((membership) => ({ ...membership })),
    issues,
  };
}

export function hasPromptManagerAccess(
  user: User | null,
  result?: UserOrganizationsResult,
): boolean {
  const data = result ?? getUserOrganizations(user);
  return data.organizations.length > 0;
}

export function hasPromptManagerAdminAccess(
  user: User | null,
  result?: UserOrganizationsResult,
): boolean {
  const data = result ?? getUserOrganizations(user);
  return data.organizations.some((membership) => membership.role === 'admin');
}

export function ensurePromptManagerEnabled(flags?: Partial<Record<FeatureFlag, boolean>>): boolean {
  return isPromptManagerEnabled(flags);
}

export function shouldAllowPromptManagerAccess(
  user: User | null,
  flags?: Partial<Record<FeatureFlag, boolean>>,
): boolean {
  if (!ensurePromptManagerEnabled(flags)) {
    return false;
  }

  return hasPromptManagerAccess(user);
}

export function shouldAllowPromptManagerAdminAccess(
  user: User | null,
  flags?: Partial<Record<FeatureFlag, boolean>>,
): boolean {
  if (!ensurePromptManagerEnabled(flags)) {
    return false;
  }

  return hasPromptManagerAdminAccess(user);
}

export { PROMPT_MANAGER_ENABLED };
