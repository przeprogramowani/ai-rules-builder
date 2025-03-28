import { create } from 'zustand';
import { Library } from '../data/dictionaries';

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
}

export const useCollectionsStore = create<CollectionsState>((set) => ({
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
}));
