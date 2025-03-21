import { X } from 'lucide-react';
import React from 'react';
import type { KeyboardEvent } from 'react';
import { Library } from '../../data/dictionaries';
import type { LayerType } from '../../styles/theme';
import { getLayerClasses } from '../../styles/theme';

interface SelectedRulesProps {
  selectedLibraries: Library[];
  unselectLibrary: (library: Library) => void;
  getLibraryLayerType: (library: Library) => LayerType;
}

export const SelectedRules: React.FC<SelectedRulesProps> = React.memo(
  ({ selectedLibraries, unselectLibrary, getLibraryLayerType }) => {
    const handleKeyDown = (
      e: KeyboardEvent<HTMLButtonElement>,
      library: Library,
    ) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        unselectLibrary(library);
      }
    };

    if (selectedLibraries.length === 0) {
      return null;
    }

    return (
      <div className="p-4 pl-6 rounded-lg shadow-lg bg-gray-900/90 min-h-[100px] overflow-auto">
        <h2 className="mb-2 text-lg font-semibold text-white">
          Selected Rules ({selectedLibraries.length})
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Selected rules list"
        >
          {selectedLibraries.map((library) => {
            const layerType = getLibraryLayerType(library);
            return (
              <div
                key={library}
                className={`px-3 py-1.5 ${getLayerClasses.selectedRuleBadge(
                  layerType,
                )} text-sm rounded-full flex items-center gap-1 shadow-sm`}
                role="listitem"
              >
                <span>{library}</span>
                <button
                  onClick={() => unselectLibrary(library)}
                  onKeyDown={(e) => handleKeyDown(e, library)}
                  className={`text-white opacity-70 cursor-pointer hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 ${getLayerClasses.focusRing(layerType)}`}
                  aria-label={`Remove ${library} rule`}
                  tabIndex={0}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

SelectedRules.displayName = 'SelectedRules';
