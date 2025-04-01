import React, { useState } from 'react';
import { Book, Trash2, Pencil, Save } from 'lucide-react';
import type { Collection } from '../../store/collectionsStore';
import { useCollectionsStore } from '../../store/collectionsStore';
import DeletionDialog from './DeletionDialog';
import SaveCollectionDialog from './SaveCollectionDialog';

interface CollectionListEntryProps {
  collection: Collection;
  onClick?: (collection: Collection) => void;
}

export const CollectionListEntry: React.FC<CollectionListEntryProps> = ({
  collection,
  onClick,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCollection = useCollectionsStore((state) => state.selectedCollection);
  const deleteCollection = useCollectionsStore((state) => state.deleteCollection);
  const isDirty = useCollectionsStore((state) => state.isDirty);
  const saveChanges = useCollectionsStore((state) => state.saveChanges);
  const updateCollection = useCollectionsStore((state) => state.updateCollection);
  const isSelected = selectedCollection?.id === collection.id;

  const handleClick = () => {
    onClick?.(collection);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSaving(true);
      await saveChanges();
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
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
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async (name: string, description: string) => {
    try {
      await updateCollection(collection.id, { ...collection, name, description });
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  };

  return (
    <>
      <button
        data-test-id="collection-entry"
        onClick={handleClick}
        className={`w-full text-left p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group ${
          isSelected ? 'border border-blue-400/50' : 'border border-transparent'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Book className="size-5 text-blue-400" />
            <h3
              data-test-id="collection-entry-name"
              className={`font-medium transition-colors ${isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}
            >
              {collection.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              data-test-id="collection-edit-button"
              onClick={handleEditClick}
              role="button"
              tabIndex={0}
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-colors cursor-pointer"
              aria-label={`Edit ${collection.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEditClick(e as unknown as React.MouseEvent);
                }
              }}
            >
              <Pencil className="size-4" />
            </div>
            <div
              data-test-id="collection-delete-button"
              onClick={handleDeleteClick}
              role="button"
              tabIndex={0}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-colors"
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
        </div>
        <p
          data-test-id="collection-entry-description"
          className="text-sm text-gray-400 line-clamp-2"
        >
          {collection.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
            {collection.libraries.length} rules
          </span>
          {isSelected && isDirty() && (
            <button
              data-test-id="collection-save-changes-button"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="text-xs px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 transition-colors flex items-center"
            >
              <Save className="size-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          )}
        </div>
      </button>

      <DeletionDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={collection.name}
        title="Delete Collection"
      />

      <SaveCollectionDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditSave}
        initialName={collection.name}
        initialDescription={collection.description}
      />
    </>
  );
};

export default CollectionListEntry;
