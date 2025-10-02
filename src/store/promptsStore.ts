import { create } from 'zustand';
import type { Tables } from '../db/database.types';
import type { OrganizationMembership } from '../services/prompt-manager/organizations';
import type { Language } from '../services/prompt-manager/language';
import {
  loadLanguagePreference,
  saveLanguagePreference,
} from '../services/prompt-manager/language';

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
  setActiveOrganization: (org: OrganizationMembership | null) => void;
  fetchCollections: (orgId: string) => Promise<void>;
  fetchSegments: (collectionId: string) => Promise<void>;
  fetchPrompts: (filters?: {
    organizationId?: string;
    collectionId?: string;
    segmentId?: string;
    search?: string;
  }) => Promise<void>;
  selectPrompt: (promptId: string | null) => void;
  setFilters: (collectionId: string | null, segmentId: string | null, search?: string) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;

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
  preferredLanguage: loadLanguagePreference(),
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
        isLoading: false,
      });

      // Fetch collections for the active organization
      if (activeOrg) {
        await get().fetchCollections(activeOrg.id);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
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
    });

    if (org) {
      await get().fetchCollections(org.id);
    }
  },

  fetchCollections: async (orgId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/prompts/collections?organization_id=${orgId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const collections = (await response.json()) as PromptCollection[];

      set({
        collections,
        isLoading: false,
      });

      // Fetch segments for all collections so they're available for display
      await Promise.all(collections.map((collection) => get().fetchSegments(collection.id)));

      // Fetch prompts for the organization
      await get().fetchPrompts({ organizationId: orgId });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchSegments: async (collectionId: string) => {
    try {
      set({ isLoading: true, error: null });
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
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchPrompts: async (filters = {}) => {
    const { activeOrganization, selectedCollectionId, selectedSegmentId, searchQuery } = get();

    const orgId = filters.organizationId || activeOrganization?.id;
    if (!orgId) {
      set({ prompts: [] });
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

      const response = await fetch(`/api/prompts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const prompts = (await response.json()) as Prompt[];

      set({
        prompts,
        isLoading: false,
      });
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
    });

    // Fetch segments if a collection is selected
    if (collectionId) {
      await get().fetchSegments(collectionId);
    } else {
      set({ segments: [] });
    }

    // Fetch prompts with the new filters
    await get().fetchPrompts();
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

  // Language actions
  setPreferredLanguage: (lang: Language) => {
    saveLanguagePreference(lang);
    set({ preferredLanguage: lang });
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
