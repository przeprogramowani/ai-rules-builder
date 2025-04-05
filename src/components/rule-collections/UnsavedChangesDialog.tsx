import React, { useState } from 'react';
import {
  ConfirmDialog,
  ConfirmDialogHeader,
  ConfirmDialogContent,
  ConfirmDialogActions,
} from '../ui/ConfirmDialog';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onSkip: () => void;
  collectionName: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onSkip,
  collectionName,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave();
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfirmDialog isOpen={isOpen} onClose={onClose}>
      <ConfirmDialogHeader>Unsaved Changes</ConfirmDialogHeader>
      <ConfirmDialogContent>
        You have unsaved changes in "{collectionName}". Would you like to save them before
        proceeding?
      </ConfirmDialogContent>
      <ConfirmDialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Skip
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

export default UnsavedChangesDialog;
