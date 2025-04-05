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
      <ConfirmDialogHeader>Save Collection</ConfirmDialogHeader>
      <ConfirmDialogContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collection name"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collection description"
              rows={3}
            />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>
      </ConfirmDialogContent>
      <ConfirmDialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 text-sm rounded-md bg-blue-500/80 hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </ConfirmDialogActions>
    </ConfirmDialog>
  );
};

export default SaveCollectionDialog;
