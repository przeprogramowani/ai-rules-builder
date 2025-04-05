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
  pendingCollection: Collection | null;
  isUnsavedChangesDialogOpen: boolean;
  isLoading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  selectCollection: (collection: Collection) => void;
  deleteCollection: (collectionId: string) => Promise<void>;
  isDirty: () => boolean;
  saveChanges: () => Promise<void>;
  updateCollection: (collectionId: string, updatedCollection: Collection) => Promise<void>;
  handlePendingCollectionSelect: (collection: Collection) => void;
  confirmPendingCollection: () => void;
  closeUnsavedChangesDialog: () => void;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  selectedCollection: null,
  pendingCollection: null,
  isUnsavedChangesDialogOpen: false,
  isLoading: false,
  error: null,
  fetchCollections: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/collections`);

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

    set({
      selectedCollection: collection,
      pendingCollection: null,
      isUnsavedChangesDialogOpen: false,
    });
  },
  handlePendingCollectionSelect: (collection: Collection) => {
    const { selectedCollection, isDirty } = get();

    if (selectedCollection?.id === collection.id) {
      return;
    }

    if (selectedCollection && isDirty()) {
      set({
        pendingCollection: collection,
        isUnsavedChangesDialogOpen: true,
      });
    } else {
      get().selectCollection(collection);
    }
  },
  confirmPendingCollection: () => {
    const { pendingCollection } = get();
    if (pendingCollection) {
      get().selectCollection(pendingCollection);
    }
  },
  closeUnsavedChangesDialog: () => {
    set({
      pendingCollection: null,
      isUnsavedChangesDialogOpen: false,
    });
  },
  deleteCollection: async (collectionId: string) => {
    try {
      const { collections } = get();
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete collection: ${response.statusText}`);
      }

      const updatedCollections = collections.filter((c) => c.id !== collectionId);
      const { selectedCollection } = get();
      let updatedSelection = selectedCollection;

      if (selectedCollection?.id === collectionId) {
        const techStackStore = useTechStackStore.getState();
        techStackStore.resetAll();

        // If we deleted the selected collection, select the first available collection
        updatedSelection = updatedCollections[0] || null;
        if (updatedSelection) {
          techStackStore.setOriginalLibraries(updatedSelection.libraries);
          updatedCollections[0].libraries.forEach((library) => {
            techStackStore.selectLibrary(library);
          });
        }
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
      throw error;
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
        collections: state.collections.map((c) =>
          c.id === savedCollection.id ? savedCollection : c,
        ),
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
  updateCollection: async (collectionId: string, updatedCollection: Collection) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to update collection');
      }

      const savedCollection = await response.json();

      // Update collections list and selected collection
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === savedCollection.id ? savedCollection : c,
        ),
        selectedCollection:
          state.selectedCollection?.id === savedCollection.id
            ? savedCollection
            : state.selectedCollection,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      throw error;
    }
  },
}));
