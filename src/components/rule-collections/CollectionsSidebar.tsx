import React, { useEffect } from 'react';
import { Album, ChevronLeft } from 'lucide-react';
import { transitions } from '../../styles/theme';
import { CollectionsList } from './CollectionsList';
import { useCollectionsStore } from '../../store/collectionsStore';

const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

interface CollectionsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({ isOpen, onToggle }) => {
  const fetchCollections = useCollectionsStore((state) => state.fetchCollections);

  useEffect(() => {
    fetchCollections(DEFAULT_USER_ID);
  }, [fetchCollections]);

  return (
    <div
      className={`h-full bg-gray-900/90 border-r border-gray-800 transition-all duration-${transitions.duration.medium} ${transitions.timing.default} relative`}
      style={{ width: isOpen ? '320px' : '48px' }}
    >
      {/* Main content area */}
      <div
        className={`h-full overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${transitions.duration.medium}`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-xl font-semibold text-white mb-6">Collections</h2>
          <CollectionsList />
        </div>
      </div>

      {/* Toggle button - positioned absolutely at the top-right */}
      <div className={`absolute h-12 ${isOpen ? 'top-2 right-2' : 'top-0 right-0'}`}>
        <button
          onClick={onToggle}
          className="p-3 text-gray-200 hover:bg-gray-800/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-lg"
          aria-label={isOpen ? 'Close collections' : 'Open collections'}
        >
          {isOpen ? <ChevronLeft className="size-5" /> : <Album className="size-5" />}
        </button>
      </div>
    </div>
  );
};

export default CollectionsSidebar;
