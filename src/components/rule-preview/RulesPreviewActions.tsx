import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';

export const RulesPreviewActions: React.FC<unknown> = () => {
  const { selectedEnvironment } = useProjectStore();

  // Get the documentation URL based on the selected format
  const getDocsUrl = (): string => aiEnvironmentConfig[selectedEnvironment].docsUrl;

  // Open the documentation URL in a new tab
  const handleOpenDocs = () => {
    window.open(getDocsUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleOpenDocs}
      className="px-3 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-600 flex items-center text-sm opacity-40 hover:opacity-100"
    >
      <ExternalLink className="h-4 w-4" />
    </button>
  );
};

export default RulesPreviewActions;
