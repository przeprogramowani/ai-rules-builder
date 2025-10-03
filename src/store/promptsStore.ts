import { create } from 'zustand';
import type { Tables } from '../db/database.types';
import type { OrganizationMembership } from '../services/prompt-manager/organizations';
import type { Language } from '../services/prompt-manager/language';
import { saveLanguagePreference } from '../services/prompt-manager/language';
import type { PromptLinkParams } from '../utils/urlParams';
import { isUUID } from '../utils/urlParams';
import {
  findCollectionBySlugOrId,
  findSegmentBySlugOrId,
} from '../services/prompt-manager/lookupService';

// Type aliases for database tables
export type Prompt = Tables<'prompts'>;
export type PromptCollection = Tables<'prompt_collections'>;
export type PromptSegment = Tables<'prompt_collection_segments'>;

// Admin action input types
export interface CreatePromptInput {
  title_en: string;
  title_pl?: string | null;
  collection_id: string;
  segment_id: string;
  markdown_body_en: string;
  markdown_body_pl?: string | null;
}

export interface UpdatePromptInput {
  title_en?: string;
  title_pl?: string | null;
  collection_id?: string;
  segment_id?: string;
  markdown_body_en?: string;
  markdown_body_pl?: string | null;
}

interface PromptsState {
  // Organization context
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;

  // Collections & Segments
  collections: PromptCollection[];
  segments: PromptSegment[];

  // Prompts (published only for members)
  prompts: Prompt[];

  // Admin-specific state
  adminPrompts: Prompt[]; // includes drafts
  isAdminMode: boolean;
  statusFilter: 'all' | 'draft' | 'published';

  // Filters
  selectedCollectionId: string | null;
  selectedSegmentId: string | null;
  searchQuery: string;

  // UI State
  selectedPromptId: string | null;
  isLoading: boolean;
  error: string | null;

  // Language preference
  preferredLanguage: Language;

  // Actions
  fetchOrganizations: () => Promise<void>;
  fetchOrganizationsList: () => Promise<void>;
  setActiveOrganization: (org: OrganizationMembership | null) => void;
  fetchCollections: (
    orgId: string,
    skipLoadingToggle?: boolean,
    skipPromptFetch?: boolean,
  ) => Promise<void>;
  fetchSegments: (collectionId: string, skipLoadingToggle?: boolean) => Promise<void>;
  fetchPrompts: (
    filters?: {
      organizationId?: string;
      collectionId?: string;
      segmentId?: string;
      search?: string;
    },
    skipLoadingToggle?: boolean,
  ) => Promise<void>;
  selectPrompt: (promptId: string | null) => void;
  setFilters: (collectionId: string | null, segmentId: string | null, search?: string) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;

  // Deep linking
  hydrateFromUrl: (params: PromptLinkParams) => Promise<{
    success: boolean;
    errors: string[];
  }>;

  // Language actions
  setPreferredLanguage: (lang: Language) => void;

  // Admin actions
  createPrompt: (data: CreatePromptInput) => Promise<void>;
  updatePrompt: (id: string, data: UpdatePromptInput) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  togglePublishStatus: (id: string) => Promise<void>;
  fetchAdminPrompts: (filters?: {
    organizationId?: string;
    collectionId?: string;
    segmentId?: string;
    search?: string;
    status?: 'all' | 'draft' | 'published';
  }) => Promise<void>;
  setStatusFilter: (status: 'all' | 'draft' | 'published') => void;
  setAdminMode: (enabled: boolean) => void;
  createCollection: (data: {
    title: string;
    description?: string;
    slug?: string;
  }) => Promise<PromptCollection>;
  createSegment: (
    collectionId: string,
    data: { title: string; slug?: string },
  ) => Promise<PromptSegment>;
}

const initialState = {
  organizations: [],
  activeOrganization: null,
  collections: [],
  segments: [],
  prompts: [],
  adminPrompts: [],
  isAdminMode: false,
  statusFilter: 'all' as const,
  selectedCollectionId: null,
  selectedSegmentId: null,
  searchQuery: '',
  selectedPromptId: null,
  isLoading: false,
  error: null,
  preferredLanguage: 'en' as Language,
};

export const usePromptsStore = create<PromptsState>((set, get) => ({
  ...initialState,

  fetchOrganizations: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/prompt-manager/organizations');

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = (await response.json()) as { organizations: OrganizationMembership[] };
      const organizations = data.organizations || [];

      // Set the first organization as active if none is selected
      const activeOrg = get().activeOrganization || organizations[0] || null;

      set({
        organizations,
        activeOrganization: activeOrg,
      });

      // Fetch collections for the active organization (skip loading toggle)
      if (activeOrg) {
        await get().fetchCollections(activeOrg.id, true);
      }

      // Only set loading false after the entire cascade completes
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  // Lightweight version for deep-linking - just fetches org list without side effects
  fetchOrganizationsList: async () => {
    try {
      const response = await fetch('/api/prompt-manager/organizations');

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = (await response.json()) as { organizations: OrganizationMembership[] };
      const organizations = data.organizations || [];

      set({ organizations });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  setActiveOrganization: async (org: OrganizationMembership | null) => {
    set({
      activeOrganization: org,
      collections: [],
      segments: [],
      prompts: [],
      selectedCollectionId: null,
      selectedSegmentId: null,
      selectedPromptId: null,
      isLoading: true,
    });

    if (org) {
      await get().fetchCollections(org.id, true);
      set({ isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchCollections: async (orgId: string, skipLoadingToggle = false, skipPromptFetch = false) => {
    try {
      if (!skipLoadingToggle) {
        set({ isLoading: true, error: null });
      }
      const response = await fetch(`/api/prompts/collections?organization_id=${orgId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const collections = (await response.json()) as PromptCollection[];

      set({
        collections,
      });

      // Fetch segments for all collections so they're available for display (skip loading toggle)
      await Promise.all(collections.map((collection) => get().fetchSegments(collection.id, true)));

      // Fetch prompts for the organization (skip loading toggle and skip if in deep-link mode)
      if (!skipPromptFetch) {
        await get().fetchPrompts({ organizationId: orgId }, true);
      }

      if (!skipLoadingToggle) {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchSegments: async (collectionId: string, skipLoadingToggle = false) => {
    try {
      if (!skipLoadingToggle) {
        set({ isLoading: true, error: null });
      }
      const response = await fetch(`/api/prompts/collections/${collectionId}/segments`);

      if (!response.ok) {
        throw new Error('Failed to fetch segments');
      }

      const newSegments = (await response.json()) as PromptSegment[];

      // Accumulate segments instead of replacing - keep segments from other collections
      const { segments: existingSegments } = get();
      const otherSegments = existingSegments.filter((s) => s.collection_id !== collectionId);
      const allSegments = [...otherSegments, ...newSegments];

      set({
        segments: allSegments,
      });

      if (!skipLoadingToggle) {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchPrompts: async (filters = {}, skipLoadingToggle = false) => {
    const {
      activeOrganization,
      selectedCollectionId,
      selectedSegmentId,
      searchQuery,
      preferredLanguage,
    } = get();

    const orgId = filters.organizationId || activeOrganization?.id;
    if (!orgId) {
      set({ prompts: [] });
      return;
    }

    try {
      if (!skipLoadingToggle) {
        set({ isLoading: true, error: null });
      }

      const params = new URLSearchParams({ organization_id: orgId });

      const collectionId = filters.collectionId ?? selectedCollectionId;
      if (collectionId) {
        params.append('collection_id', collectionId);
      }

      const segmentId = filters.segmentId ?? selectedSegmentId;
      if (segmentId) {
        params.append('segment_id', segmentId);
      }

      const search = filters.search ?? searchQuery;
      if (search) {
        params.append('search', search);
      }

      // Add language parameter
      params.append('language', preferredLanguage);

      const response = await fetch(`/api/prompts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const prompts = (await response.json()) as Prompt[];

      set({
        prompts,
      });

      if (!skipLoadingToggle) {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  selectPrompt: (promptId: string | null) => {
    set({ selectedPromptId: promptId });
  },

  setFilters: async (collectionId: string | null, segmentId: string | null, search?: string) => {
    set({
      selectedCollectionId: collectionId,
      selectedSegmentId: segmentId,
      searchQuery: search ?? get().searchQuery,
      isLoading: true,
    });

    // Fetch segments if a collection is selected (skip loading toggle)
    if (collectionId) {
      await get().fetchSegments(collectionId, true);
    } else {
      set({ segments: [] });
    }

    // Fetch prompts with the new filters (skip loading toggle)
    await get().fetchPrompts({}, true);

    set({ isLoading: false });
  },

  setSearchQuery: async (query: string) => {
    set({ searchQuery: query });
    const { isAdminMode } = get();
    if (isAdminMode) {
      await get().fetchAdminPrompts({ search: query });
    } else {
      await get().fetchPrompts({ search: query });
    }
  },

  reset: () => {
    set(initialState);
  },

  // Deep linking
  hydrateFromUrl: async (params: PromptLinkParams) => {
    const errors: string[] = [];
    let success = false;

    try {
      set({ isLoading: true, error: null });

      // Step 1: Resolve organization
      if (!params.org) {
        errors.push('No organization specified in URL');
        set({ isLoading: false });
        return { success: false, errors };
      }

      let targetOrg: OrganizationMembership | null = null;

      // Try to find organization in user's memberships
      const { organizations } = get();
      if (!organizations.length) {
        await get().fetchOrganizationsList();
      }

      const orgs = get().organizations;
      const normalizedOrg = params.org.trim().toLowerCase();

      // Check by slug first, then by ID
      if (isUUID(normalizedOrg)) {
        targetOrg = orgs.find((o) => o.id === normalizedOrg) || null;
      } else {
        targetOrg = orgs.find((o) => o.slug.toLowerCase() === normalizedOrg) || null;
      }

      if (!targetOrg) {
        errors.push(`Organization '${params.org}' not found or you don't have access`);
        set({ isLoading: false });
        return { success: false, errors };
      }

      // Set active organization (without fetching, we'll do it manually below)
      set({
        activeOrganization: targetOrg,
        collections: [],
        segments: [],
        prompts: [],
        selectedCollectionId: null,
        selectedSegmentId: null,
        selectedPromptId: null,
      });

      // Fetch collections first (skip loading toggle, skip prompt fetch - we'll fetch filtered prompts later)
      await get().fetchCollections(targetOrg.id, true, true);

      // Step 2: Resolve collection (if provided)
      let targetCollection: PromptCollection | null = null;
      if (params.collection) {
        targetCollection = await findCollectionBySlugOrId(targetOrg.id, params.collection);
        if (!targetCollection) {
          errors.push(`Collection '${params.collection}' not found`);
        } else {
          await get().fetchSegments(targetCollection.id, true);
        }
      }

      // Step 3: Resolve segment (if provided)
      let targetSegment: PromptSegment | null = null;
      if (params.segment && targetCollection) {
        targetSegment = await findSegmentBySlugOrId(targetCollection.id, params.segment);
        if (!targetSegment) {
          errors.push(`Segment '${params.segment}' not found`);
        }
      }

      // Step 4: Fetch prompts with filters (skip loading toggle)
      await get().fetchPrompts(
        {
          organizationId: targetOrg.id,
          collectionId: targetCollection?.id,
          segmentId: targetSegment?.id,
        },
        true,
      );

      // Batch all filter state updates into a single set() call to avoid re-renders
      set({
        selectedCollectionId: targetCollection?.id || null,
        selectedSegmentId: targetSegment?.id || null,
      });

      // Step 5: Select specific prompt (if provided)
      if (params.prompt) {
        const { prompts } = get();
        const targetPrompt = prompts.find((p) => p.id === params.prompt);

        if (!targetPrompt) {
          errors.push(`Prompt '${params.prompt}' not found`);
        } else {
          get().selectPrompt(params.prompt);
          success = true;
        }
      } else {
        // If no specific prompt requested, consider success if we got to org/collection/segment
        success = true;
      }

      set({ isLoading: false });
      return { success, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to hydrate from URL: ${errorMessage}`);
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, errors };
    }
  },

  // Language actions
  setPreferredLanguage: async (lang: Language) => {
    saveLanguagePreference(lang);
    set({ preferredLanguage: lang });

    // Refetch prompts with new language if there's a search query
    const { searchQuery, isAdminMode } = get();
    if (searchQuery) {
      if (isAdminMode) {
        await get().fetchAdminPrompts({ search: searchQuery });
      } else {
        await get().fetchPrompts({ search: searchQuery });
      }
    }
  },

  // Admin actions
  createPrompt: async (data: CreatePromptInput) => {
    const { activeOrganization } = get();
    if (!activeOrganization) {
      throw new Error('No active organization');
    }

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/prompts/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organization_id: activeOrganization.id }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to create prompt');
      }

      // Refetch admin prompts
      await get().fetchAdminPrompts();

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePrompt: async (id: string, data: UpdatePromptInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/prompts/admin/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to update prompt');
      }

      // Refetch admin prompts
      await get().fetchAdminPrompts();

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },

  deletePrompt: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/prompts/admin/prompts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to delete prompt');
      }

      // Refetch admin prompts
      await get().fetchAdminPrompts();

      set({ isLoading: false, selectedPromptId: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },

  togglePublishStatus: async (id: string) => {
    const { adminPrompts } = get();
    const prompt = adminPrompts.find((p) => p.id === id);
    if (!prompt) return;

    // Optimistic update
    const newStatus = prompt.status === 'published' ? 'draft' : 'published';
    const updatedPrompts = adminPrompts.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    set({ adminPrompts: updatedPrompts });

    try {
      const response = await fetch(`/api/prompts/admin/prompts/${id}/publish`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        // Rollback on error
        set({ adminPrompts });
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to toggle publish status');
      }
    } catch (error) {
      // Rollback on error
      set({
        adminPrompts,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  fetchAdminPrompts: async (filters = {}) => {
    const {
      activeOrganization,
      selectedCollectionId,
      selectedSegmentId,
      searchQuery,
      statusFilter,
      preferredLanguage,
    } = get();

    const orgId = filters.organizationId || activeOrganization?.id;
    if (!orgId) {
      set({ adminPrompts: [] });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const params = new URLSearchParams({ organization_id: orgId });

      const collectionId = filters.collectionId ?? selectedCollectionId;
      if (collectionId) {
        params.append('collection_id', collectionId);
      }

      const segmentId = filters.segmentId ?? selectedSegmentId;
      if (segmentId) {
        params.append('segment_id', segmentId);
      }

      const search = filters.search ?? searchQuery;
      if (search) {
        params.append('search', search);
      }

      const status = filters.status ?? statusFilter;
      if (status && status !== 'all') {
        params.append('status', status);
      }

      // Add language parameter
      params.append('language', preferredLanguage);

      const response = await fetch(`/api/prompts/admin/prompts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch admin prompts');
      }

      const result = (await response.json()) as { data: Prompt[]; error: null };
      const adminPrompts = result.data;

      set({
        adminPrompts,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  setStatusFilter: async (status: 'all' | 'draft' | 'published') => {
    set({ statusFilter: status });
    await get().fetchAdminPrompts({ status });
  },

  setAdminMode: (enabled: boolean) => {
    set({ isAdminMode: enabled });
  },

  createCollection: async (data: { title: string; description?: string; slug?: string }) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/prompts/admin/prompt-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to create collection');
      }

      const result = (await response.json()) as { data: PromptCollection; error: null };
      const newCollection = result.data;

      // Append to collections array
      const { collections } = get();
      set({
        collections: [...collections, newCollection],
        isLoading: false,
      });

      return newCollection;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },

  createSegment: async (collectionId: string, data: { title: string; slug?: string }) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(
        `/api/prompts/admin/prompt-collections/${collectionId}/segments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to create segment');
      }

      const result = (await response.json()) as { data: PromptSegment; error: null };
      const newSegment = result.data;

      // Append to segments array
      const { segments } = get();
      set({
        segments: [...segments, newSegment],
        isLoading: false,
      });

      return newSegment;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },
}));
