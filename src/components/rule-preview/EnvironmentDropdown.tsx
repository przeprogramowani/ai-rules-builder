import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import {
  type AIEnvironment,
  AIEnvironmentName,
  aiEnvironmentConfig,
} from '../../data/ai-environments.ts';

interface EnvironmentDropdownProps {
  selectedEnvironment: AIEnvironment;
  onSetSelectedEnvironment: (environment: AIEnvironment) => void;
}

export const EnvironmentDropdown: React.FC<EnvironmentDropdownProps> = ({
  selectedEnvironment,
  onSetSelectedEnvironment,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 256), // Min width of 256px (sm:w-64)
      });
    }
  };

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen]);

  // Update position on window resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updateDropdownPosition();
    const handleScroll = () => updateDropdownPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleOptionSelect = (environment: AIEnvironment) => {
    onSetSelectedEnvironment(environment);
    setIsOpen(false);
  };

  const selectedConfig = aiEnvironmentConfig[selectedEnvironment];

  // Create dropdown menu component
  const dropdownMenu = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg z-[9999] max-h-64 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      <ul role="listbox" className="py-1">
        {Object.values(AIEnvironmentName).map((environment) => {
          const config = aiEnvironmentConfig[environment];
          if (!config) return null;

          const isSelected = selectedEnvironment === environment;

          return (
            <li key={environment} role="option" aria-selected={isSelected}>
              <button
                onClick={() => handleOptionSelect(environment)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-700 focus:outline-none focus:bg-gray-700 ${
                  isSelected ? 'bg-gray-700 text-white' : 'text-gray-300'
                }`}
              >
                <span className="truncate">{config.displayName}</span>
                {isSelected && <Check className="h-4 w-4 text-indigo-400 ml-2 flex-shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="relative">
      {/* Dropdown trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-between w-full sm:w-auto min-w-[180px] px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select AI environment"
      >
        <span className="truncate">{selectedConfig?.displayName || 'Select Environment'}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Render dropdown menu via portal */}
      {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default EnvironmentDropdown;
