import { Trash2, Unplug } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { transitions } from '../../styles/theme';
import { Accordion } from '../ui/Accordion';
import { useRuleBuilder } from './hooks/useRuleBuilder';
import { useMCPDialog } from './hooks/useMCPDialog';
import { LayerItem } from './LayerItem';
import { MCPDialog } from './modals/MCPDialog';
import { SearchInput } from './SearchInput';
import { SelectedRules } from './SelectedRules';
import type { LibraryRulesMap } from '../../data/rules/types';

interface RuleBuilderProps {
  className?: string;
  libraryRules: LibraryRulesMap;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ className = '', libraryRules }) => {
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
  } = useRuleBuilder(libraryRules);

  const { totalCount, matchedCount } = getLibraryCounts;
  const accordionRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use the custom hook for MCPDialog state
  const { isMCPDialogOpen, showMCPInstructions, hideMCPInstructions } = useMCPDialog();

  // Calculate if we need to show "no results" message
  const hasNoSearchResults =
    isSearchActive && layers.every((layer) => !layerContainsSearchMatch(layer));

  // Show keyboard help tooltip briefly on first load
  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'flex';

      tooltipTimerRef.current = setTimeout(() => {
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
          setTimeout(() => {
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
          }, 500);
        }
      }, 5000);
    }

    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`flex flex-col space-y-4 h-full pb-16 md:pb-0 ${className}`}
      role="application"
      aria-label="Rule Builder"
    >
      <div
        ref={containerRef}
        className="p-4 space-y-4 rounded-lg shadow-lg bg-gray-900/90 flex flex-col min-h-[400px] h-full"
        data-component-name="RuleBuilder"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Rule Builder</h2>

          <div className="flex flex-row gap-2">
            <button
              onClick={showMCPInstructions}
              className="flex gap-2 items-center px-3 py-1.5 text-sm bg-gray-800/50 rounded-md transition-colors hover:bg-gray-700/50 text-gray-400 cursor-pointer hover:shadow-sm"
              title="Clear all selections"
            >
              <Unplug className="size-4" />
              <span>Use MCP</span>
            </button>
            {selectedLibraries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex gap-2 items-center px-3 py-1.5 text-sm bg-orange-800/50 rounded-md transition-colors hover:bg-orange-700/50 text-orange-400 cursor-pointer hover:shadow-sm"
                title="Clear all selections"
              >
                <Trash2 className="size-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        <div ref={searchContainerRef} className="w-full">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            matchCount={isSearchActive ? matchedCount : undefined}
            totalCount={isSearchActive ? totalCount : undefined}
            className="w-full"
          />
        </div>

        <div
          ref={accordionRef}
          className={`w-full transition-all duration-${transitions.duration.slow} ${transitions.timing.default} flex-grow overflow-auto`}
        >
          {hasNoSearchResults ? (
            <div className="flex flex-col justify-center items-center py-8 h-full text-center text-gray-400 space-y-2">
              <div>No rules matching "{debouncedSearchQuery}" were found.</div>
              <a
                href="https://github.com/przeprogramowani/ai-rules-builder/issues/new?title=%5BRequest+for+new+rule%5D&labels=rule-request"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                Request a new rule
              </a>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3 w-full" isNested={false}>
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

      <MCPDialog isOpen={isMCPDialogOpen} onClose={hideMCPInstructions} />
    </div>
  );
};

export default React.memo(RuleBuilder);
