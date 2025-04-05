import { Check } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import React from 'react';
import { Library } from '../../data/dictionaries';
import { getLibraryTranslation } from '../../i18n/translations';
import type { LayerType } from '../../styles/theme';
import { getLayerClasses } from '../../styles/theme';
import { useAccordionContentOpen } from '../ui/Accordion';

interface LibraryItemProps {
  library: Library;
  isSelected: boolean;
  onToggle: (library: Library) => void;
  layerType: LayerType;
}

export const LibraryItem: React.FC<LibraryItemProps> = React.memo(
  ({ library, isSelected, onToggle, layerType }) => {
    const isParentAccordionOpen = useAccordionContentOpen();
    const itemClasses = getLayerClasses.libraryItem(layerType, isSelected);

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(library);
      }
    };

    return (
      <button
        className={`flex gap-2 justify-between items-center px-3 py-2 w-full text-sm rounded-md transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500  ${getLayerClasses.focusRing(
          layerType,
        )} ${itemClasses}`}
        onClick={() => onToggle(library)}
        onKeyDown={handleKeyDown}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={isParentAccordionOpen ? 0 : -1}
      >
        <span className="font-medium text-white">{getLibraryTranslation(library)}</span>
        {isSelected && <Check className={`size-4 ${getLayerClasses.text(layerType)}`} />}
      </button>
    );
  },
);

LibraryItem.displayName = 'LibraryItem';
