import React from 'react';
import { Layer, getStacksByLayer, getLibrariesByStack } from '../../data/dictionaries';
import { useTechStackStore } from '../../store/techStackStore';

interface LayerSelectorProps {
  onSelectLayer: (layer: Layer) => void;
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({ onSelectLayer }) => {
  const { selectedLibraries, selectLayer } = useTechStackStore();

  // Get all available layers
  const layers = Object.values(Layer);

  const handleLayerClick = (layer: Layer) => {
    selectLayer(layer);
    onSelectLayer(layer);
  };

  // Check if any libraries from this layer are selected
  const hasSelectedLibraries = (layer: Layer): boolean => {
    // Get all stacks for this layer
    const stacks = getStacksByLayer(layer);

    // Check if any libraries from these stacks are selected
    return stacks.some((stack) => {
      const libraries = getLibrariesByStack(stack);
      return libraries.some((library) => selectedLibraries.includes(library));
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Select category</h2>
      <div className="grid grid-cols-1 gap-3">
        {layers.map((layer) => (
          <button
            key={layer}
            onClick={() => handleLayerClick(layer)}
            className={`p-4 rounded-lg transition-colors ${
              hasSelectedLibraries(layer)
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{layer}</span>
              <span className="text-xs bg-gray-900 px-2 py-1 rounded-full">
                {getStacksByLayer(layer).length} groups
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerSelector;
