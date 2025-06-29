import React from 'react';
import { useProjectStore, adaptableFileEnvironments } from '../../store/projectStore';
import { RulesPath } from './RulesPath';
import { RulesPreviewActions } from './RulesPreviewActions';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';
import { type AIEnvironment, AIEnvironmentName } from '../../data/ai-environments.ts';
import RulesPreviewCopyDownloadActions from './RulesPreviewCopyDownloadActions.tsx';

interface RulePreviewTopbarProps {
  rulesContent: RulesContent[];
}

interface EnvButtonProps {
  environment: AIEnvironment;
  selectedEnvironment: AIEnvironment;
  isMultiFileEnvironment: boolean;
  onSetSelectedEnvironment: (environment: AIEnvironment) => void;
}

const EnvButton: React.FC<EnvButtonProps> = ({
  environment,
  selectedEnvironment,
  onSetSelectedEnvironment,
}) => {
  return (
    <button
      onClick={() => onSetSelectedEnvironment(environment)}
      className={`px-3 py-1 text-xs rounded-md ${
        selectedEnvironment === environment
          ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {`${environment[0].toUpperCase()}${environment.slice(1)}`}
    </button>
  );
};

export const RulePreviewTopbar: React.FC<RulePreviewTopbarProps> = ({ rulesContent }) => {
  const {
    selectedEnvironment,
    setSelectedEnvironment,
    isMultiFileEnvironment,
    isHydrated,
    setMultiFileEnvironment,
  } = useProjectStore();

  // If state hasn't been hydrated from storage yet, don't render the selector
  // This prevents the "blinking" effect when loading persisted state
  if (!isHydrated) {
    return (
      <div className="p-2 bg-gray-800 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 opacity-0">
          {/* Invisible placeholder content with the same structure to prevent layout shift */}
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="px-3 py-1 text-xs rounded-md bg-gray-700"></div>
              <div className="px-3 py-1 text-xs rounded-md bg-gray-700"></div>
              <div className="px-3 py-1 text-xs rounded-md bg-gray-700"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="text-sm flex-1 sm:flex-none"></div>
            <div className="px-3 py-1 rounded-md"></div>
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
        {/* Left side: Environment selector buttons and path */}
        <div className="flex flex-col space-y-2 w-full sm:w-auto">
          {/* Environment selector buttons - make them wrap on small screens */}
          <div className="flex flex-wrap gap-1">
            {Object.values(AIEnvironmentName).map((environment) => (
              <EnvButton
                key={'button-' + environment}
                environment={environment}
                selectedEnvironment={selectedEnvironment}
                isMultiFileEnvironment={isMultiFileEnvironment}
                onSetSelectedEnvironment={setSelectedEnvironment}
              />
            ))}
          </div>

          {/* Path display */}
          <RulesPath />

          {adaptableFileEnvironments.has(selectedEnvironment) && (
            <div
              className="flex items-center space-x-2"
              role="group"
              aria-labelledby="multi-file-label"
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="multiFileToggle"
                  name="multiFileToggle"
                  checked={isMultiFileEnvironment}
                  onChange={(e) => setMultiFileEnvironment(e.target.checked)}
                  aria-describedby="multi-file-description"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-gray-800"
                />
                <label
                  id="multi-file-label"
                  htmlFor="multiFileToggle"
                  className="ml-2 text-sm text-gray-300 select-none cursor-pointer"
                >
                  Split instructions into domain files
                </label>
              </div>
              <span id="multi-file-description" className="sr-only">
                When enabled, instructions will be split into separate domain-specific files
              </span>
            </div>
          )}
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
