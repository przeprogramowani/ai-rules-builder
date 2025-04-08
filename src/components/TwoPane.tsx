import React, { useEffect } from 'react';
import { RuleBuilder } from './rule-builder';
import { RulePreview } from './rule-preview';
import CollectionsSidebar from './rule-collections/CollectionsSidebar';
import { MobileNavigation } from './MobileNavigation';
import { useNavigationStore } from '../store/navigationStore';
import { isFeatureEnabled } from '../features/featureFlags';

export default function TwoPane() {
  const { activePanel, isSidebarOpen, toggleSidebar, setSidebarOpen } = useNavigationStore();
  const isCollectionsEnabled = isFeatureEnabled('collections');

  // Sync the local state with the store on component mount
  useEffect(() => {
    // If on desktop, default sidebar to closed
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  return (
    <div className="flex relative flex-col h-full max-h-screen md:flex-row bg-gray-950">
      {isCollectionsEnabled && (
        <CollectionsSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${activePanel === 'builder' ? 'block' : 'hidden md:block'}
            w-full md:w-1/3 lg:w-2/5 md:p-4 border-b md:border-b-0 md:border-r border-gray-800 min-h-full overflow-y-auto
          `}
        >
          <RuleBuilder />
        </div>

        <div
          className={`
            transition-all duration-300 ease-in-out
            ${activePanel === 'preview' ? 'block' : 'hidden md:block'}
            w-full md:w-2/3 lg:w-3/5 p-4 min-h-full overflow-y-auto
          `}
        >
          <RulePreview />
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
