import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';

export const RulesPath: React.FC = () => {
  const { selectedEnvironment } = useProjectStore();

  // Get the appropriate file path based on the selected format
  const getFilePath = (): string => aiEnvironmentConfig[selectedEnvironment].filePath;

  return (
    <div className="text-sm text-gray-400 w-full break-all">
      Path: <span className="text-white font-mono">{getFilePath()}</span>
    </div>
  );
};

export default RulesPath;
