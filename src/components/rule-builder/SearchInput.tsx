import { Search, X } from 'lucide-react';
import React, { useCallback } from 'react';

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
  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex relative items-center w-full">
        <div className="absolute left-3 text-gray-400">
          <Search className="size-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder="Search for patterns, frameworks, libraries..."
          aria-label="Search for patterns, frameworks, libraries..."
          className="py-2 pr-10 pl-10 w-full text-white rounded-md bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-gray-700"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-gray-400 cursor-pointer hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {searchQuery && matchCount !== undefined && totalCount !== undefined && (
        <div className="absolute top-3 right-9 text-xs pointer-events-none text-gray-400/40">
          {matchCount} / {totalCount}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchInput);
