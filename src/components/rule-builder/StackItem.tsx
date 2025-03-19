import React from 'react';
import { Library, Stack, getLibrariesByStack } from '../../data/dictionaries';
import type { LayerType } from '../../styles/theme';
import { getLayerClasses } from '../../styles/theme';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/Accordion';
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
}

export const StackItem: React.FC<StackItemProps> = React.memo(
  ({
    stack,
    isOpen,
    hasSelected,
    selectedCount,
    toggleStack,
    handleLibraryToggle,
    isLibrarySelected,
    layerType,
    filteredLibraries,
  }) => {
    const containerClasses = getLayerClasses.stackContainer(
      layerType,
      hasSelected,
      isOpen
    );

    // Use the filtered libraries if provided, otherwise use all libraries for this stack
    const libraries = filteredLibraries || getLibrariesByStack(stack);

    return (
      <AccordionItem key={stack} value={stack}>
        <div className={`rounded-lg ${containerClasses}`}>
          <AccordionTrigger
            onClick={() => toggleStack(stack)}
            isOpen={isOpen}
            className="text-white"
          >
            <div className="flex gap-2 items-center">
              <span className="font-medium text-white">{stack}</span>
            </div>
          </AccordionTrigger>

          <AccordionContent isOpen={isOpen}>
            <div className="grid gap-2">
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
  }
);

StackItem.displayName = 'StackItem';
