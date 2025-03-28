import { create } from 'zustand';
import { Library } from '../data/dictionaries';
import { useTechStackStore } from './techStackStore';

export interface Collection {
  id: string;
  name: string;
  description: string;
  libraries: Library[];
  createdAt: string;
  updatedAt: string;
}

interface CollectionsState {
  collections: Collection[];
  selectedCollection: Collection | null;
  isLoading: boolean;
  error: string | null;
  fetchCollections: (userId: string) => Promise<void>;
  selectCollection: (collection: Collection) => void;
  deleteCollection: (collectionId: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  selectedCollection: null,
  isLoading: false,
  error: null,
  fetchCollections: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/collections?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const data = await response.json();
      set({ collections: data, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },
  selectCollection: (collection: Collection) => {
    set({ selectedCollection: collection });
  },
  deleteCollection: async (collectionId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Attempt to make API call
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      // Handle both successful deletion and 404 (item not found) as "success" cases
      // since the end result is the same: item no longer exists in our system
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete collection: ${response.statusText}`);
      }

      // Update local state by removing the deleted collection
      const { collections, selectedCollection } = get();
      const updatedCollections = collections.filter((c) => c.id !== collectionId);

      // If the deleted collection was selected, unselect it
      const updatedSelection = selectedCollection?.id === collectionId ? null : selectedCollection;

      // If we're deselecting the current collection, reset the tech stack state
      if (selectedCollection?.id === collectionId) {
        const techStackStore = useTechStackStore.getState();
        techStackStore.resetAll();
      }

      set({
        collections: updatedCollections,
        selectedCollection: updatedSelection,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));
