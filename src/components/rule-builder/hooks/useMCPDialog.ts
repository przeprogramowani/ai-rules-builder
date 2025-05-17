import { useState } from 'react';

export const useMCPDialog = () => {
  const [isMCPDialogOpen, setIsMCPDialogOpen] = useState(false);

  const showMCPInstructions = () => {
    setIsMCPDialogOpen(true);
  };

  const hideMCPInstructions = () => {
    setIsMCPDialogOpen(false);
  };

  return {
    isMCPDialogOpen,
    showMCPInstructions,
    hideMCPInstructions,
  };
};
