import { Search, X } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import React, { useCallback, useRef, useState } from 'react';

interface SearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchCount?: number;
  totalCount?: number;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  searchQuery,
  setSearchQuery,
  matchCount,
  totalCount,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  const handleClear = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, [setSearchQuery]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClear();
      }
    },
    [handleClear],
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
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search for patterns, frameworks, libraries..."
        aria-label="Search for patterns, frameworks, libraries..."
        className="px-10 w-full h-full text-white bg-transparent rounded-lg border-none focus-visible:outline-none"
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        tabIndex={0}
      />
      {searchQuery && (
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
      {searchQuery && matchCount !== undefined && totalCount !== undefined && (
        <div className="absolute top-3 right-9 text-xs pointer-events-none text-gray-400/40">
          {matchCount} / {totalCount}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchInput);
