import React, { createContext, useContext, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogContextType {
  isOpen: boolean;
  onClose: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType>({
  isOpen: false,
  onClose: () => {},
});

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Trap focus within dialog when open
      dialogRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-gray-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-4 focus:outline-none animate-fade-in"
        tabIndex={-1}
      >
        <ConfirmDialogContext.Provider value={{ isOpen, onClose }}>
          {children}
        </ConfirmDialogContext.Provider>
      </div>
    </div>
  );
};

interface ConfirmDialogHeaderProps {
  children: React.ReactNode;
}

export const ConfirmDialogHeader: React.FC<ConfirmDialogHeaderProps> = ({ children }) => {
  const { onClose } = useContext(ConfirmDialogContext);

  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-white">{children}</h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
};

interface ConfirmDialogContentProps {
  children: React.ReactNode;
}

export const ConfirmDialogContent: React.FC<ConfirmDialogContentProps> = ({ children }) => {
  return <div className="text-gray-300 mb-6">{children}</div>;
};

interface ConfirmDialogActionsProps {
  children: React.ReactNode;
}

export const ConfirmDialogActions: React.FC<ConfirmDialogActionsProps> = ({ children }) => {
  return <div className="flex justify-end gap-3 mt-2">{children}</div>;
};

export const useConfirmDialog = () => {
  return useContext(ConfirmDialogContext);
};
