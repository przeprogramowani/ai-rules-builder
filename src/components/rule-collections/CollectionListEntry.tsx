import React from 'react';
import { Book } from 'lucide-react';
import type { Collection } from '../../store/collectionsStore';
import { useCollectionsStore } from '../../store/collectionsStore';

interface CollectionListEntryProps {
  collection: Collection;
  onClick?: (collection: Collection) => void;
}

export const CollectionListEntry: React.FC<CollectionListEntryProps> = ({ collection, onClick }) => {
  const selectedCollection = useCollectionsStore((state) => state.selectedCollection);
  const isSelected = selectedCollection?.id === collection.id;

  const handleClick = () => {
    onClick?.(collection);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group ${
        isSelected ? 'border border-blue-400/50' : 'border border-transparent'
      }`}
    >
      <div className="flex items-center gap-1 mb-2">
        <Book className="size-5 text-blue-400" />
        <h3
          className={`font-medium transition-colors ${isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}
        >
          {collection.name}
        </h3>
      </div>
      <p className="text-sm text-gray-400 line-clamp-2">{collection.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
          {collection.libraries.length} rules
        </span>
      </div>
    </button>
  );
};

export default CollectionListEntry;
