import React from 'react';
import { Layer, Stack, getStacksByLayer, getLibrariesByStack } from '../../data/dictionaries';
import { useTechStackStore } from '../../store/techStackStore';

interface StackSelectorProps {
  selectedLayer: Layer;
  onSelectStack: (stack: Stack) => void;
  onBackToLayers: () => void;
}

export const StackSelector: React.FC<StackSelectorProps> = ({
  selectedLayer,
  onSelectStack,
  onBackToLayers,
}) => {
  const { selectStack, selectedLibraries } = useTechStackStore();

  // Get stacks for the selected layer
  const stacks = getStacksByLayer(selectedLayer);

  const handleStackClick = (stack: Stack) => {
    selectStack(stack);
    onSelectStack(stack);
  };

  // Check if any libraries from this stack are selected
  const hasSelectedLibraries = (stack: Stack): boolean => {
    const libraries = getLibrariesByStack(stack);
    return libraries.some((library) => selectedLibraries.includes(library));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <button
          onClick={onBackToLayers}
          className="mr-2 p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-white">Select rule group</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stacks.map((stack) => (
          <button
            key={stack}
            onClick={() => handleStackClick(stack)}
            className={`p-4 rounded-lg transition-colors ${
              hasSelectedLibraries(stack)
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{stack}</span>
              <span className="text-xs bg-gray-900 px-2 py-1 rounded-full">
                {getLibrariesByStack(stack).length} tools
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StackSelector;
