import { create } from 'zustand';
import type { Tables } from '../db/database.types';
import type { OrganizationMembership } from '../services/prompt-manager/organizations';

// Type aliases for database tables
export type Prompt = Tables<'prompts'>;
export type PromptCollection = Tables<'prompt_collections'>;
export type PromptSegment = Tables<'prompt_collection_segments'>;

interface PromptsState {
  // Organization context
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;

  // Collections & Segments
  collections: PromptCollection[];
  segments: PromptSegment[];

  // Prompts (published only for members)
  prompts: Prompt[];

  // Filters
  selectedCollectionId: string | null;
  selectedSegmentId: string | null;
  searchQuery: string;

  // UI State
  selectedPromptId: string | null;
  isLoading: boolean;
  error: string | null;

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
}

const initialState = {
  organizations: [],
  activeOrganization: null,
  collections: [],
  segments: [],
  prompts: [],
  selectedCollectionId: null,
  selectedSegmentId: null,
  searchQuery: '',
  selectedPromptId: null,
  isLoading: false,
  error: null,
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

      const segments = (await response.json()) as PromptSegment[];

      set({
        segments,
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
    await get().fetchPrompts({ search: query });
  },

  reset: () => {
    set(initialState);
  },
}));
