import React, { useState } from 'react';
import { Book, Trash2 } from 'lucide-react';
import type { Collection } from '../../store/collectionsStore';
import { useCollectionsStore } from '../../store/collectionsStore';
import DeletionDialog from './DeletionDialog';

interface CollectionListEntryProps {
  collection: Collection;
  onClick?: (collection: Collection) => void;
}

export const CollectionListEntry: React.FC<CollectionListEntryProps> = ({ collection, onClick }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const selectedCollection = useCollectionsStore((state) => state.selectedCollection);
  const deleteCollection = useCollectionsStore((state) => state.deleteCollection);
  const isSelected = selectedCollection?.id === collection.id;

  const handleClick = () => {
    onClick?.(collection);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCollection(collection.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting collection:', error);
      // Still close the dialog, since the store already handles the error state
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`w-full text-left p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group ${
          isSelected ? 'border border-blue-400/50' : 'border border-transparent'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Book className="size-5 text-blue-400" />
            <h3
              className={`font-medium transition-colors ${isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}
            >
              {collection.name}
            </h3>
          </div>
          <div
            onClick={handleDeleteClick}
            role="button"
            tabIndex={0}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label={`Delete ${collection.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDeleteClick(e as unknown as React.MouseEvent);
              }
            }}
          >
            <Trash2 className="size-4" />
          </div>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2">{collection.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
            {collection.libraries.length} rules
          </span>
        </div>
      </button>

      <DeletionDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={collection.name}
        title="Delete Collection"
      />
    </>
  );
};

export default CollectionListEntry;
