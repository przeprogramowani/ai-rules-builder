import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { RulesPath } from './RulesPath';
import { RulesPreviewActions } from './RulesPreviewActions';
import { EnvironmentDropdown } from './EnvironmentDropdown';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';
import RulesPreviewCopyDownloadActions from './RulesPreviewCopyDownloadActions.tsx';

interface RulePreviewTopbarProps {
  rulesContent: RulesContent[];
}

export const RulePreviewTopbar: React.FC<RulePreviewTopbarProps> = ({ rulesContent }) => {
  const { selectedEnvironment, setSelectedEnvironment, isHydrated } = useProjectStore();

  // If state hasn't been hydrated from storage yet, don't render the selector
  // This prevents the "blinking" effect when loading persisted state
  if (!isHydrated) {
    return (
      <div className="p-2 bg-gray-800 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 opacity-0">
          {/* Invisible placeholder content with the same structure to prevent layout shift */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="min-w-[180px] px-3 py-2 text-sm bg-gray-700 rounded-md"></div>
            <div className="text-sm text-gray-400 w-32 h-5"></div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="px-3 py-1 rounded-md"></div>
            <div className="px-3 py-1 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-800 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start space-y-3 sm:space-y-0">
        {/* Left side: Environment selector dropdown and path */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          {/* Environment selector dropdown */}
          <EnvironmentDropdown
            selectedEnvironment={selectedEnvironment}
            onSetSelectedEnvironment={setSelectedEnvironment}
          />

          {/* Path display */}
          <RulesPath />
        </div>

        {/* Right side: Action buttons */}
        <div className="w-full sm:w-auto">
          <div className="flex flex-wrap gap-2 w-full">
            <RulesPreviewCopyDownloadActions rulesContent={rulesContent} />
            <RulesPreviewActions></RulesPreviewActions>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulePreviewTopbar;
