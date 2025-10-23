import type {
  Prompt,
  PromptCollection,
  PromptSegment,
} from '@/services/prompt-library/types';

/**
 * Test fixtures for Prompt Library tests
 * Provides consistent, reusable test data across all test suites
 *
 * FIXTURE AUDIT (2025-10-04):
 * - Currently used in: integration tests
 * - NOT used in: unit tests (they use inline mock data, which is appropriate)
 * - All fixtures are actively maintained and represent valid test data
 * - Fixture relationships:
 *   - testOrganizations.org1 -> testCollections.fundamentals, .advanced
 *   - testOrganizations.org2 -> testCollections.org2Collection
 *   - testCollections.fundamentals -> testSegments.gettingStarted, .bestPractices
 *   - testCollections.advanced -> testSegments.advancedPatterns
 *   - All testPrompts reference valid collection_id and segment_id values
 *   - testUsers.adminUser is the creator of all test prompts
 */

// Test Organizations
export const testOrganizations = {
  org1: {
    id: 'org-test-1',
    name: 'Test Organization 1',
    slug: 'test-org-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  org2: {
    id: 'org-test-2',
    name: 'Test Organization 2',
    slug: 'test-org-2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
};

// Test Users
export const testUsers = {
  adminUser: {
    id: 'user-admin-1',
    email: 'admin@test.com',
    created_at: '2025-01-01T00:00:00Z',
  },
  memberUser: {
    id: 'user-member-1',
    email: 'member@test.com',
    created_at: '2025-01-01T00:00:00Z',
  },
};

// Test Organization Members
export const testOrganizationMembers = {
  org1Admin: {
    user_id: 'user-admin-1',
    organization_id: 'org-test-1',
    role: 'admin',
    created_at: '2025-01-01T00:00:00Z',
  },
  org1Member: {
    user_id: 'user-member-1',
    organization_id: 'org-test-1',
    role: 'member',
    created_at: '2025-01-01T00:00:00Z',
  },
};

// Test Collections
export const testCollections: Record<string, PromptCollection> = {
  fundamentals: {
    id: 'coll-test-1',
    organization_id: 'org-test-1',
    slug: 'fundamentals',
    title: 'Fundamentals',
    description: 'Core concepts and fundamentals',
    sort_order: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  advanced: {
    id: 'coll-test-2',
    organization_id: 'org-test-1',
    slug: 'advanced',
    title: 'Advanced Topics',
    description: 'Advanced concepts and techniques',
    sort_order: 2,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  org2Collection: {
    id: 'coll-test-org2-1',
    organization_id: 'org-test-2',
    slug: 'org2-collection',
    title: 'Org 2 Collection',
    description: 'Collection for org 2',
    sort_order: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
};

// Test Segments
export const testSegments: Record<string, PromptSegment> = {
  gettingStarted: {
    id: 'seg-test-1',
    collection_id: 'coll-test-1',
    slug: 'getting-started',
    title: 'Getting Started',
    sort_order: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  bestPractices: {
    id: 'seg-test-2',
    collection_id: 'coll-test-1',
    slug: 'best-practices',
    title: 'Best Practices',
    sort_order: 2,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  advancedPatterns: {
    id: 'seg-test-3',
    collection_id: 'coll-test-2',
    slug: 'advanced-patterns',
    title: 'Advanced Patterns',
    sort_order: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
};

// Test Prompts
export const testPrompts: Record<string, Prompt> = {
  draftPrompt1: {
    id: 'prompt-draft-1',
    organization_id: 'org-test-1',
    collection_id: 'coll-test-1',
    segment_id: 'seg-test-1',
    title_en: 'Draft Prompt 1',
    title_pl: 'Szkic Promptu 1',
    description_en: 'A draft prompt for testing',
    description_pl: 'Szkic promptu do testów',
    markdown_body_en: '# Draft Prompt 1\n\nThis is a draft prompt.',
    markdown_body_pl: '# Szkic Promptu 1\n\nTo jest szkic promptu.',
    status: 'draft',
    created_by: 'user-admin-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  draftPrompt2: {
    id: 'prompt-draft-2',
    organization_id: 'org-test-1',
    collection_id: 'coll-test-1',
    segment_id: 'seg-test-2',
    title_en: 'Draft Prompt 2',
    title_pl: null,
    description_en: 'Another draft prompt',
    description_pl: null,
    markdown_body_en: '# Draft Prompt 2\n\nAnother draft.',
    markdown_body_pl: null,
    status: 'draft',
    created_by: 'user-admin-1',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  publishedPrompt1: {
    id: 'prompt-published-1',
    organization_id: 'org-test-1',
    collection_id: 'coll-test-1',
    segment_id: 'seg-test-1',
    title_en: 'Published Prompt 1',
    title_pl: 'Opublikowany Prompt 1',
    description_en: 'A published prompt for testing',
    description_pl: 'Opublikowany prompt do testów',
    markdown_body_en: '# Published Prompt 1\n\nThis is a published prompt.',
    markdown_body_pl: '# Opublikowany Prompt 1\n\nTo jest opublikowany prompt.',
    status: 'published',
    created_by: 'user-admin-1',
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
  publishedPrompt2: {
    id: 'prompt-published-2',
    organization_id: 'org-test-1',
    collection_id: 'coll-test-2',
    segment_id: 'seg-test-3',
    title_en: 'Published Prompt 2',
    title_pl: null,
    description_en: 'Advanced content prompt',
    description_pl: null,
    markdown_body_en: '# Published Prompt 2\n\nAdvanced content.',
    markdown_body_pl: null,
    status: 'published',
    created_by: 'user-admin-1',
    created_at: '2025-01-04T00:00:00Z',
    updated_at: '2025-01-04T00:00:00Z',
  },
  org2Prompt: {
    id: 'prompt-org2-1',
    organization_id: 'org-test-2',
    collection_id: 'coll-test-org2-1',
    segment_id: null,
    title_en: 'Org 2 Prompt',
    title_pl: null,
    description_en: 'Prompt belonging to organization 2',
    description_pl: null,
    markdown_body_en: '# Org 2 Prompt\n\nThis belongs to org 2.',
    markdown_body_pl: null,
    status: 'published',
    created_by: 'user-admin-1',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
};

// Helper functions to filter and retrieve test data

/**
 * Get all prompts for a specific collection
 */
export function getCollectionPrompts(collectionId: string): Prompt[] {
  return Object.values(testPrompts).filter(
    (p) => p.collection_id === collectionId
  );
}

/**
 * Get all published prompts
 */
export function getPublishedPrompts(): Prompt[] {
  return Object.values(testPrompts).filter((p) => p.status === 'published');
}

/**
 * Get all draft prompts
 */
export function getDraftPrompts(): Prompt[] {
  return Object.values(testPrompts).filter((p) => p.status === 'draft');
}

/**
 * Get all prompts for a specific organization
 */
export function getOrganizationPrompts(organizationId: string): Prompt[] {
  return Object.values(testPrompts).filter(
    (p) => p.organization_id === organizationId
  );
}

/**
 * Get all collections for a specific organization
 */
export function getOrganizationCollections(
  organizationId: string
): PromptCollection[] {
  return Object.values(testCollections).filter(
    (c) => c.organization_id === organizationId
  );
}

/**
 * Get all segments for a specific collection
 */
export function getCollectionSegments(collectionId: string): PromptSegment[] {
  return Object.values(testSegments).filter(
    (s) => s.collection_id === collectionId
  );
}

/**
 * Get prompts filtered by organization and status (simulates RLS for members)
 */
export function getMemberVisiblePrompts(organizationId: string): Prompt[] {
  return Object.values(testPrompts).filter(
    (p) => p.organization_id === organizationId && p.status === 'published'
  );
}

/**
 * Get all prompts for an organization (simulates RLS for admins)
 */
export function getAdminVisiblePrompts(organizationId: string): Prompt[] {
  return Object.values(testPrompts).filter(
    (p) => p.organization_id === organizationId
  );
}
