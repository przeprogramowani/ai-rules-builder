import React, { useCallback, useMemo } from 'react';
import { Album, Blocks, Eye } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import { isFeatureEnabled } from '../features/featureFlags';

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavigationItem = React.memo<NavigationItemProps>(({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors duration-300
        ${isActive ? 'text-indigo-400' : 'text-gray-400'} hover:text-indigo-300`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="size-6">{icon}</div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
});

NavigationItem.displayName = 'NavigationItem';

export const MobileNavigation: React.FC = () => {
  const { activePanel, setActivePanel } = useNavigationStore();
  const isCollectionsEnabled = isFeatureEnabled('collections');

  // Memoize panel change handlers to prevent unnecessary re-renders
  const handleCollectionsClick = useCallback(() => setActivePanel('collections'), [setActivePanel]);
  const handleBuilderClick = useCallback(() => setActivePanel('builder'), [setActivePanel]);
  const handlePreviewClick = useCallback(() => setActivePanel('preview'), [setActivePanel]);

  // Memoize navigation items configuration
  const navigationItems = useMemo<NavigationItemProps[]>(() => {
    const items: NavigationItemProps[] = [
      {
        icon: <Blocks />,
        label: 'Builder',
        isActive: activePanel === 'builder',
        onClick: handleBuilderClick,
      },
      {
        icon: <Eye />,
        label: 'Preview',
        isActive: activePanel === 'preview',
        onClick: handlePreviewClick,
      },
    ];

    if (isCollectionsEnabled) {
      items.unshift({
        icon: <Album />,
        label: 'Collections',
        isActive: activePanel === 'collections',
        onClick: handleCollectionsClick,
      });
    }

    return items;
  }, [
    isCollectionsEnabled,
    activePanel,
    handleCollectionsClick,
    handleBuilderClick,
    handlePreviewClick,
  ]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 md:hidden z-20"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={`grid grid-cols-${navigationItems.length} h-16`}>
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive}
            onClick={item.onClick}
          />
        ))}
      </div>
    </nav>
  );
};
