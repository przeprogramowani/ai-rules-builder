import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
}

interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => React.ReactNode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Dropdown<T = string>({
  options,
  value,
  onChange,
  label,
  renderOption,
  className = '',
  placeholder = 'Select option',
  disabled = false,
}: DropdownProps<T>) {
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

  const handleOptionSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  // Create dropdown menu component
  const dropdownMenu = isOpen && !disabled && (
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
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <li key={String(option.value)} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className={`w-full px-3 py-2 text-left cursor-pointer text-sm flex items-center justify-between hover:bg-gray-700 focus:outline-none focus:bg-gray-700 ${
                  isSelected ? 'bg-gray-700 text-white' : 'text-gray-300'
                }`}
              >
                {renderOption ? (
                  renderOption(option, isSelected)
                ) : (
                  <>
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-indigo-400 ml-2 flex-shrink-0" />}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      {/* Dropdown trigger button */}
      <button
        type="button"
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex items-center justify-between w-full sm:w-auto min-w-[180px] px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label || 'Select option'}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Render dropdown menu via portal */}
      {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </div>
  );
}

export default Dropdown;
