import { ExternalLink } from 'lucide-react';
import React from 'react';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';
import { useProjectStore } from '../../store/projectStore';
import Tooltip from '../ui/Tooltip.tsx';

export const RulesPreviewActions: React.FC<unknown> = () => {
  const { selectedEnvironment } = useProjectStore();

  const config = aiEnvironmentConfig[selectedEnvironment];
  if (!config) {
    return null;
  }

  return (
    <Tooltip content={`Open documentation for ${config.displayName}`} position="bottom">
      <a
        href={config.docsUrl}
        target="_blank"
        className="px-3 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-600 flex items-center text-sm opacity-40 hover:opacity-100 cursor-pointer"
        aria-label={`Open documentation for ${config.displayName}`}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </Tooltip>
  );
};

export default RulesPreviewActions;
