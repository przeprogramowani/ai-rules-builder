import { ChevronDown } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import React, { createContext, useContext } from 'react';
import { transitions } from '../../styles/theme';

// Create a context to track accordion open state
const AccordionContentContext = createContext<boolean>(false);
// Create a context to track if this is a root accordion (not nested)
const AccordionRootContext = createContext<boolean>(true);

// Export the hook to be used by focusable elements inside the accordion
export const useAccordionContentOpen = () =>
  useContext(AccordionContentContext);
// Hook to determine if the component is inside a nested accordion
export const useIsRootAccordion = () => useContext(AccordionRootContext);

interface AccordionProps {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  isNested?: boolean;
}

export const Accordion: React.FC<AccordionProps> = React.memo(
  ({ children, className = '', isNested = false, ...props }) => {
    return (
      <div className={`space-y-2 ${className}`} role="region">
        <AccordionRootContext.Provider value={!isNested}>
          {children}
        </AccordionRootContext.Provider>
      </div>
    );
  }
);
Accordion.displayName = 'Accordion';

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  isNested?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = React.memo(
  ({ children, isNested, ...props }) => {
    return (
      <AccordionRootContext.Provider value={!isNested}>
        <div className="rounded-lg" role="presentation">
          {children}
        </div>
      </AccordionRootContext.Provider>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = React.memo(
  ({ children, className = '', onClick, isOpen = false, ...props }) => {
    const isParentAccordionOpen = useAccordionContentOpen();
    const isRoot = useIsRootAccordion();

    // Top-level accordion triggers should always be focusable (tabIndex=0)
    // Only nested triggers should check parent state
    const shouldBeFocusable = isRoot || isParentAccordionOpen;

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    };

    return (
      <div
        className={`flex justify-between items-center p-4 rounded-lg transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={shouldBeFocusable ? 0 : -1}
        aria-expanded={isOpen}
      >
        <div className="flex-1">{children}</div>
        <ChevronDown
          className={`size-4 transition-transform duration-${
            transitions.duration.medium
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

export const AccordionContent: React.FC<AccordionContentProps> = React.memo(
  ({ children, className = '', isOpen = false, ...props }) => {
    const isParentAccordionOpen = useAccordionContentOpen();
    const isRoot = useIsRootAccordion();

    // Determine if content is truly focusable by checking both its own state and parent state
    // Root level accordions only depend on their own open state
    const effectiveIsOpen = isRoot ? isOpen : isOpen && isParentAccordionOpen;

    return (
      <div
        className={`grid transition-all duration-${transitions.duration.slow} ${
          transitions.timing.default
        } will-change-[grid-template-rows] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        role="region"
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <div
            className={`px-4 pt-2 pb-4 ${className}`}
            style={{
              opacity: isOpen ? 1 : 0,
              transition: `opacity ${transitions.duration.medium} ${transitions.timing.smooth}`,
              transitionDelay: isOpen
                ? transitions.delay.medium
                : transitions.delay.none,
            }}
          >
            <AccordionContentContext.Provider value={effectiveIsOpen}>
              {children}
            </AccordionContentContext.Provider>
          </div>
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';
