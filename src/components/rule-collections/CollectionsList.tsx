import React, { useState } from 'react';
import { useCollectionsStore, type Collection } from '../../store/collectionsStore';
import { useTechStackStore } from '../../store/techStackStore';
import CollectionListEntry from './CollectionListEntry';
import SaveCollectionDialog from './SaveCollectionDialog';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { Library } from '../../data/dictionaries';

export const CollectionsList: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const {
    collections,
    isLoading,
    error,
    handlePendingCollectionSelect,
    isUnsavedChangesDialogOpen,
    saveChanges,
    confirmPendingCollection,
    closeUnsavedChangesDialog,
    selectedCollection,
    fetchCollections,
  } = useCollectionsStore();
  const { selectedLibraries } = useTechStackStore();

  const handleCollectionSelect = (collection: Collection) => {
    handlePendingCollectionSelect(collection);
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveChanges();
      confirmPendingCollection();
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const handleSkipSave = () => {
    confirmPendingCollection();
  };

  const handleCreateCollection = async (name: string, description: string) => {
    // Create a new collection with currently selected libraries
    // Ensure libraries are valid Library enum values
    const newCollection = {
      name,
      description,
      libraries: selectedLibraries.map((lib) => lib as Library), // This ensures type safety
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      const savedCollection = await response.json();

      // Refresh collections list
      await fetchCollections();
      setIsCreateDialogOpen(false);

      // Select the newly created collection
      handleCollectionSelect(savedCollection);
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-red-900/20 text-red-400">
        <AlertCircle className="size-5" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div data-test-id="collections-list" className="space-y-4">
        {collections.map((collection) => (
          <CollectionListEntry
            key={collection.id}
            collection={collection}
            onClick={handleCollectionSelect}
          />
        ))}
        <button
          data-test-id="create-collection-button"
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full p-4 rounded-lg border border-dashed border-gray-700 hover:border-blue-400/50 hover:bg-gray-800/50 transition-colors group"
        >
          <div className="flex items-center justify-center gap-2 text-gray-400 group-hover:text-blue-400">
            <Plus className="size-5" />
            <span>Create new collection</span>
          </div>
        </button>
      </div>

      <SaveCollectionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreateCollection}
      />

      <UnsavedChangesDialog
        isOpen={isUnsavedChangesDialogOpen}
        onClose={closeUnsavedChangesDialog}
        onSave={handleSaveAndContinue}
        onSkip={handleSkipSave}
        collectionName={selectedCollection?.name || ''}
      />
    </>
  );
};

export default CollectionsList;
