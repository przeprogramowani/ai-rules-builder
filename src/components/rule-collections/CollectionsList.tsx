import React from 'react';
import { useCollectionsStore, type Collection } from '../../store/collectionsStore';
import { useTechStackStore } from '../../store/techStackStore';
import CollectionListEntry from './CollectionListEntry';
import { AlertCircle, Loader2 } from 'lucide-react';

export const CollectionsList: React.FC = () => {
  const { collections, isLoading, error, selectCollection } = useCollectionsStore();
  const { resetAll, selectLibrary } = useTechStackStore();

  const handleCollectionSelect = (collection: Collection) => {
    // Reset current selection
    resetAll();

    // Select the collection
    selectCollection(collection);

    // Apply collection rules
    collection.libraries.forEach((library) => {
      selectLibrary(library);
    });
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
    <div className="space-y-4">
      {collections.map((collection) => (
        <CollectionListEntry key={collection.id} collection={collection} onClick={handleCollectionSelect} />
      ))}
    </div>
  );
};

export default CollectionsList;
