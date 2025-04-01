import React, { useState } from 'react';
import {
  ConfirmDialog,
  ConfirmDialogHeader,
  ConfirmDialogContent,
  ConfirmDialogActions,
} from '../ui/ConfirmDialog';

interface SaveCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
}

export const SaveCollectionDialog: React.FC<SaveCollectionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save collection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfirmDialog isOpen={isOpen} onClose={onClose}>
      <ConfirmDialogHeader>
        {initialName ? 'Edit Collection' : 'Create New Collection'}
      </ConfirmDialogHeader>
      <ConfirmDialogContent>
        <form
          data-test-id="collection-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
                Name
              </label>
              <input
                data-test-id="collection-name-input"
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter collection name"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
                Description
              </label>
              <textarea
                data-test-id="collection-description-input"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter collection description"
                rows={3}
              />
            </div>
            {error && (
              <div data-test-id="collection-form-error" className="text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </form>
      </ConfirmDialogContent>
      <ConfirmDialogActions>
        <button
          data-test-id="collection-save-button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          data-test-id="collection-cancel-button"
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </ConfirmDialogActions>
    </ConfirmDialog>
  );
};

export default SaveCollectionDialog;
