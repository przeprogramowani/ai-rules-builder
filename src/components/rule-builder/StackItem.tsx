import React from 'react';
import { Library, Stack, getLibrariesByStack } from '../../data/dictionaries';
import { getStackTranslation } from '../../i18n/translations';
import type { LayerType } from '../../styles/theme';
import { getLayerClasses } from '../../styles/theme';
import { AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { LibraryItem } from './LibraryItem';

interface StackItemProps {
  stack: Stack;
  isOpen: boolean;
  hasSelected: boolean;
  selectedCount: number;
  toggleStack: (stack: Stack) => void;
  handleLibraryToggle: (library: Library) => void;
  isLibrarySelected: (library: Library) => boolean;
  layerType: LayerType;
  filteredLibraries?: Library[];
  isNested?: boolean;
}

export const StackItem: React.FC<StackItemProps> = React.memo(
  ({
    stack,
    isOpen,
    hasSelected,
    toggleStack,
    handleLibraryToggle,
    isLibrarySelected,
    layerType,
    filteredLibraries,
    isNested = false,
  }) => {
    const containerClasses = getLayerClasses.stackContainer(layerType, hasSelected, isOpen);

    // Use the filtered libraries if provided, otherwise use all libraries for this stack
    const libraries = filteredLibraries || getLibrariesByStack(stack);

    return (
      <AccordionItem key={stack} value={stack} isNested={isNested}>
        <div className={`rounded-lg ${containerClasses}`}>
          <AccordionTrigger
            onClick={() => toggleStack(stack)}
            isOpen={isOpen}
            className={`text-white ${getLayerClasses.focusRing(layerType)}`}
          >
            <div className="flex gap-2 items-center">
              <span className="font-medium text-white">{getStackTranslation(stack)}</span>
            </div>
          </AccordionTrigger>

          <AccordionContent isOpen={isOpen}>
            <div className="grid gap-2" role="group" aria-label={`${stack} libraries`}>
              {libraries.map((library) => (
                <LibraryItem
                  key={library}
                  library={library}
                  isSelected={isLibrarySelected(library)}
                  onToggle={handleLibraryToggle}
                  layerType={layerType}
                />
              ))}
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    );
  },
);

StackItem.displayName = 'StackItem';
