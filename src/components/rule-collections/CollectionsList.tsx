import React, { useState } from 'react';
import { useCollectionsStore, type Collection } from '../../store/collectionsStore';
import { useTechStackStore } from '../../store/techStackStore';
import CollectionListEntry from './CollectionListEntry';
import SaveCollectionDialog from './SaveCollectionDialog';
import { AlertCircle, Loader2 } from 'lucide-react';

const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export const CollectionsList: React.FC = () => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { collections, isLoading, error, selectCollection, selectedCollection, isDirty, fetchCollections } =
    useCollectionsStore();
  const { resetAll, selectLibrary, selectedLibraries } = useTechStackStore();

  const handleCollectionSelect = (collection: Collection) => {
    // Reset current selection
    resetAll();

    // Select the collection
    selectCollection(collection);

    // Apply collection rules
    collection.libraries.forEach((library) => {
      selectLibrary(library);
    });

    // If it's the default collection and has changes, show the save dialog
    if (collection.isDefault && isDirty()) {
      setIsSaveDialogOpen(true);
    }
  };

  const handleSaveDefault = async (name: string, description: string) => {
    if (!selectedCollection?.isDefault) return;

    // Create a new collection based on the default one
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      name,
      description,
      libraries: selectedLibraries,
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
        throw new Error('Failed to save collection');
      }

      // Refresh collections list
      await fetchCollections(DEFAULT_USER_ID);
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error('Failed to save collection:', error);
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

  if (collections.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No collections found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {collections.map((collection) => (
          <CollectionListEntry key={collection.id} collection={collection} onClick={handleCollectionSelect} />
        ))}
      </div>

      <SaveCollectionDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveDefault}
      />
    </>
  );
};

export default CollectionsList;
