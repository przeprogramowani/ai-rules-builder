import { Package } from 'lucide-react';
import React from 'react';
import {
  Layer,
  Library,
  Stack,
  getLibrariesCountByLayer,
  getStacksByLayer,
} from '../../data/dictionaries';
import { getLayerTranslation } from '../../i18n/translations';
import type { LayerType } from '../../styles/theme';
import { getLayerClasses } from '../../styles/theme';
import { AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { StackItem } from './StackItem';

interface LayerItemProps {
  layer: Layer;
  isOpen: boolean;
  hasSelected: boolean;
  selectedCount: number;
  toggleLayer: (layer: Layer) => void;
  isStackOpen: (stack: Stack) => boolean;
  toggleStack: (stack: Stack) => void;
  getSelectedLibrariesCount: (stack: Stack) => number;
  hasStackSelectedLibraries: (stack: Stack) => boolean;
  handleLibraryToggle: (library: Library) => void;
  isLibrarySelected: (library: Library) => boolean;
  getLayerType: (layer: Layer) => LayerType;
  getStackLayerType: (stack: Stack) => LayerType;
  stackContainsSearchMatch: (stack: Stack) => boolean;
  getFilteredLibrariesByStack: (stack: Stack) => Library[];
  searchActive: boolean;
}

export const LayerItem: React.FC<LayerItemProps> = React.memo(
  ({
    layer,
    isOpen,
    hasSelected,
    selectedCount,
    toggleLayer,
    isStackOpen,
    toggleStack,
    getSelectedLibrariesCount,
    hasStackSelectedLibraries,
    handleLibraryToggle,
    isLibrarySelected,
    getLayerType,
    getStackLayerType,
    stackContainsSearchMatch,
    getFilteredLibrariesByStack,
    searchActive,
  }) => {
    const layerType = getLayerType(layer);
    const containerClasses = getLayerClasses.container(layerType, hasSelected, isOpen);

    return (
      <AccordionItem key={layer} value={layer}>
        <div className={`h-full rounded-lg ${containerClasses}`}>
          <AccordionTrigger
            onClick={() => toggleLayer(layer)}
            isOpen={isOpen}
            className={`font-medium text-white ${getLayerClasses.focusRing(layerType)}`}
          >
            <div className="flex justify-between items-center mr-2">
              <div className="flex gap-2 items-center">
                <span className="font-medium text-white">{getLayerTranslation(layer)}</span>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getLayerClasses.badge(layerType)}`}
                aria-label={`${selectedCount} of ${getLibrariesCountByLayer(layer)} libraries selected`}
              >
                {selectedCount} / {getLibrariesCountByLayer(layer)} <Package className="size-3" />
              </span>
            </div>
          </AccordionTrigger>

          <AccordionContent isOpen={isOpen}>
            <div className="grid gap-2" role="group" aria-label={`${layer} stacks`}>
              {getStacksByLayer(layer)
                .filter((stack) => !searchActive || stackContainsSearchMatch(stack))
                .map((stack) => (
                  <StackItem
                    key={stack}
                    stack={stack}
                    isOpen={isStackOpen(stack)}
                    hasSelected={hasStackSelectedLibraries(stack)}
                    selectedCount={getSelectedLibrariesCount(stack)}
                    toggleStack={toggleStack}
                    handleLibraryToggle={handleLibraryToggle}
                    isLibrarySelected={isLibrarySelected}
                    layerType={getStackLayerType(stack)}
                    isNested={true}
                    filteredLibraries={
                      searchActive
                        ? getFilteredLibrariesByStack(stack).map((lib) => lib as unknown as Library)
                        : undefined
                    }
                  />
                ))}
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    );
  },
);

LayerItem.displayName = 'LayerItem';
