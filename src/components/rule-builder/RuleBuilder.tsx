import { Trash2 } from 'lucide-react';
import React, { useRef } from 'react';
import { Layer, Library } from '../../data/dictionaries';
import { transitions } from '../../styles/theme';
import { Accordion } from '../ui/Accordion';
import { useRuleBuilder } from './hooks/useRuleBuilder';
import { LayerItem } from './LayerItem';
import { SearchInput } from './SearchInput';
import { SelectedRules } from './SelectedRules';

export const RuleBuilder: React.FC = () => {
  const {
    layers,
    selectedLibraries,
    isLayerOpen,
    isStackOpen,
    toggleLayer,
    toggleStack,
    getSelectedLibrariesCount,
    getSelectedLibrariesCountForLayer,
    hasSelectedLibraries,
    hasStackSelectedLibraries,
    handleLibraryToggle,
    isLibrarySelected,
    unselectLibrary,
    handleClearAll,
    getLayerType,
    getStackLayerType,
    getLibraryLayerType,
    // Search related props
    searchQuery,
    debouncedSearchQuery,
    handleSearchChange,
    layerContainsSearchMatch,
    stackContainsSearchMatch,
    getFilteredLibrariesByStack,
    getLibraryCounts,
    isSearchActive,
    isSearchExpanded,
  } = useRuleBuilder();

  const { totalCount, matchedCount } = getLibraryCounts;
  const accordionRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate if we need to show "no results" message
  const hasNoSearchResults =
    isSearchActive && layers.every((layer) => !layerContainsSearchMatch(layer));

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div
        ref={containerRef}
        className="p-6 space-y-5 rounded-lg shadow-lg bg-gray-900/90 flex flex-col min-h-[400px] h-full"
        data-component-name="RuleBuilder"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Rule Builder</h2>

          <button
            onClick={handleClearAll}
            className={`flex gap-2 items-center px-3 py-1.5 text-sm bg-gray-800/50 rounded-md transition-colors hover:bg-gray-700/50 text-gray-400 cursor-pointer hover:shadow-sm ${
              selectedLibraries.length > 0 ? 'opacity-100' : 'opacity-0'
            }`}
            title="Clear all selections"
          >
            <Trash2 className="size-4" />
            <span>Clear all</span>
          </button>
        </div>

        <div ref={searchContainerRef} className="w-full">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            matchCount={isSearchActive ? matchedCount : undefined}
            totalCount={isSearchActive ? totalCount : undefined}
            className="mb-4 w-full"
          />
        </div>

        <div
          ref={accordionRef}
          className={`w-full transition-all duration-${transitions.duration.slow} ${transitions.timing.default} flex-grow overflow-auto`}
        >
          {hasNoSearchResults ? (
            <div className="flex justify-center items-center py-8 h-full text-center text-gray-400">
              No rules matching "{debouncedSearchQuery}" were found.
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3 w-full">
              {layers.map((layer) => {
                const selectedCount = getSelectedLibrariesCountForLayer(layer);
                const isOpen = isLayerOpen(layer);
                const hasSelected = hasSelectedLibraries(layer);

                // Skip rendering layers with no matching libraries when search is active
                if (isSearchActive && !layerContainsSearchMatch(layer)) {
                  return null;
                }

                return (
                  <div key={layer}>
                    <LayerItem
                      layer={layer}
                      isOpen={isOpen}
                      hasSelected={hasSelected}
                      selectedCount={selectedCount}
                      toggleLayer={toggleLayer}
                      isStackOpen={isStackOpen}
                      toggleStack={toggleStack}
                      getSelectedLibrariesCount={getSelectedLibrariesCount}
                      hasStackSelectedLibraries={hasStackSelectedLibraries}
                      handleLibraryToggle={handleLibraryToggle}
                      isLibrarySelected={isLibrarySelected}
                      getLayerType={getLayerType}
                      getStackLayerType={getStackLayerType}
                      stackContainsSearchMatch={stackContainsSearchMatch}
                      getFilteredLibrariesByStack={getFilteredLibrariesByStack}
                      searchActive={isSearchActive}
                    />
                  </div>
                );
              })}
            </Accordion>
          )}
        </div>
      </div>

      <SelectedRules
        selectedLibraries={selectedLibraries}
        unselectLibrary={unselectLibrary}
        getLibraryLayerType={getLibraryLayerType}
      />
    </div>
  );
};

export default React.memo(RuleBuilder);
