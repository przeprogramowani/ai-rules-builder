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
  isDirty: () => boolean;
  saveChanges: () => Promise<void>;
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
    const techStackStore = useTechStackStore.getState();

    // Reset tech stack state before setting new collection
    techStackStore.resetAll();

    // Set the original libraries for dirty state comparison
    techStackStore.setOriginalLibraries(collection.libraries);

    // Set the selected libraries
    collection.libraries.forEach((library) => {
      techStackStore.selectLibrary(library);
    });

    set({ selectedCollection: collection });
  },
  deleteCollection: async (collectionId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete collection: ${response.statusText}`);
      }

      const { collections, selectedCollection } = get();
      const updatedCollections = collections.filter((c) => c.id !== collectionId);

      const updatedSelection = selectedCollection?.id === collectionId ? null : selectedCollection;

      if (selectedCollection?.id === collectionId) {
        const techStackStore = useTechStackStore.getState();
        techStackStore.resetAll();
        techStackStore.setOriginalLibraries([]);
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
  isDirty: () => {
    const techStackStore = useTechStackStore.getState();
    return techStackStore.isDirty();
  },
  saveChanges: async () => {
    const { selectedCollection } = get();
    const techStackStore = useTechStackStore.getState();

    if (!selectedCollection) return;

    try {
      set({ isLoading: true, error: null });

      const updatedCollection = {
        ...selectedCollection,
        libraries: techStackStore.selectedLibraries,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to save collection changes');
      }

      const savedCollection = await response.json();

      // Update collections list and selected collection
      set((state) => ({
        collections: state.collections.map((c) => (c.id === savedCollection.id ? savedCollection : c)),
        selectedCollection: savedCollection,
        isLoading: false,
      }));

      // Update original libraries in tech stack store to match saved state
      techStackStore.setOriginalLibraries(techStackStore.selectedLibraries);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },
}));
