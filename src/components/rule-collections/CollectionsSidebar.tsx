import React, { useEffect } from 'react';
import { Album, ChevronLeft, LogIn } from 'lucide-react';
import { transitions } from '../../styles/theme';
import { CollectionsList } from './CollectionsList';
import { useCollectionsStore } from '../../store/collectionsStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigationStore } from '../../store/navigationStore';

interface CollectionsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({ isOpen, onToggle }) => {
  const fetchCollections = useCollectionsStore((state) => state.fetchCollections);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { activePanel } = useNavigationStore();
  const isMobileCollectionsActive = activePanel === 'collections';

  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections();
    }
  }, [fetchCollections, isAuthenticated]);

  return (
    <div
      data-test-id="collections-sidebar"
      className={`bg-gray-900/90 border-r border-gray-800 transition-all duration-${transitions.duration.medium} ${transitions.timing.default} relative
                 ${isMobileCollectionsActive ? 'md:relative absolute inset-0 z-10 h-screen' : 'hidden md:block md:h-full'}`}
      style={{
        width: isMobileCollectionsActive ? '100%' : isOpen ? '320px' : '48px',
      }}
    >
      {/* Main content area */}
      <div
        className={`h-full overflow-hidden ${isMobileCollectionsActive || isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${transitions.duration.medium}`}
      >
        <div className="p-4 h-full overflow-y-auto pb-20 md:pb-4">
          <h2 className="text-xl font-semibold text-white mb-6">Collections</h2>
          {isAuthenticated ? (
            <CollectionsList />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 text-gray-400">
              <LogIn className="size-8 mb-4" />
              <p className="mb-2">Please log in to view and manage your collections</p>
              <a href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Go to login page
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button - positioned absolutely at the top-right */}
      <div
        className={`absolute h-12 ${isOpen ? 'top-2 right-2' : 'top-0 right-0'} md:block hidden`}
      >
        <button
          data-test-id="collections-sidebar-toggle"
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
