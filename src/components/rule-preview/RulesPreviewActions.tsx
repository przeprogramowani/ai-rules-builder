import { ExternalLink } from 'lucide-react';
import React from 'react';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';
import { useProjectStore } from '../../store/projectStore';

export const RulesPreviewActions: React.FC<unknown> = () => {
  const { selectedEnvironment } = useProjectStore();

  return (
    <a
      href={aiEnvironmentConfig[selectedEnvironment].docsUrl}
      target="_blank"
      className="px-3 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-600 flex items-center text-sm opacity-40 hover:opacity-100 cursor-pointer"
      aria-label={`Open documentation for ${selectedEnvironment}`}
    >
      <ExternalLink className="h-4 w-4" />
    </a>
  );
};

export default RulesPreviewActions;
