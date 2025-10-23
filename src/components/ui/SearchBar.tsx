import { Search, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKeyboardActivation } from '../../hooks/useKeyboardActivation';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  matchCount?: number;
  totalCount?: number;
  className?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  matchCount,
  totalCount,
  className = '',
  debounceMs = 300,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const createKeyboardActivationHandler = useKeyboardActivation<HTMLButtonElement>();
  const handleKeyDown = useMemo(
    () => createKeyboardActivationHandler(handleClear),
    [createKeyboardActivationHandler, handleClear],
  );

  return (
    <div
      className={`relative w-full ${className} h-10 bg-gray-800 rounded-lg  ${
        hasFocus ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2">
        <Search className="size-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="px-10 w-full h-full text-white bg-transparent rounded-lg border-none focus-visible:outline-none"
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        tabIndex={0}
      />
      {localValue && (
        <button
          className="absolute right-3 top-1/2 p-1 text-gray-400 rounded-full -translate-y-1/2 hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-gray-200"
          onClick={handleClear}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
      {value && matchCount !== undefined && totalCount !== undefined && (
        <div className="absolute top-3 right-9 text-xs pointer-events-none text-gray-400/40">
          {matchCount} / {totalCount}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBar);
