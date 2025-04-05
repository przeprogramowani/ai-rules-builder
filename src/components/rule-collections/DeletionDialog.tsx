import React, { useState } from 'react';
import {
  ConfirmDialog,
  ConfirmDialogHeader,
  ConfirmDialogContent,
  ConfirmDialogActions,
} from '../ui/ConfirmDialog';

interface DeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName: string;
  title?: string;
}

export const DeletionDialog: React.FC<DeletionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title = 'Delete Item',
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog isOpen={isOpen} onClose={onClose}>
      <ConfirmDialogHeader>{title}</ConfirmDialogHeader>
      <ConfirmDialogContent>
        Are you sure you want to delete "{itemName}"? This action cannot be undone.
      </ConfirmDialogContent>
      <ConfirmDialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          className={`px-4 py-2 text-sm rounded-md bg-red-500/80 hover:bg-red-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </ConfirmDialogActions>
    </ConfirmDialog>
  );
};

export default DeletionDialog;
