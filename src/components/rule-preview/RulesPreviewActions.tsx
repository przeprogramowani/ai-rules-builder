import React, { type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import type { RulesContent } from '../../services/rulesBuilderService.ts';
import { envConfig } from '../../data/ai-environments.ts';

interface RulesPreviewActionsProps {
  children: ReactNode;
  rulesContent: RulesContent[];
}

export const RulesPreviewActions: React.FC<RulesPreviewActionsProps> = ({
                                                                          children,
                                                                          rulesContent
                                                                        }) => {
  const { selectedEnvironment } = useProjectStore();

  // Get the documentation URL based on the selected format
  const getDocsUrl = (): string => envConfig[selectedEnvironment].docsUrl;

  // Open the documentation URL in a new tab
  const handleOpenDocs = () => {
    window.open(getDocsUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap gap-2 w-full">
      {children}
      <button
        onClick={handleOpenDocs}
        className="px-3 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-600 flex items-center text-sm"
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        Docs
      </button>
    </div>
  );
};

export default RulesPreviewActions;
