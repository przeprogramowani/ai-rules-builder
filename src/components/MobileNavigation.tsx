import React from 'react';
import { Album, Blocks, Eye } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import type { Panel } from '../store/navigationStore';

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ icon, label, isActive, onClick }) => {
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
};

export const MobileNavigation: React.FC = () => {
  const { activePanel, setActivePanel } = useNavigationStore();

  const handlePanelChange = (panel: Panel) => {
    setActivePanel(panel);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 md:hidden z-20"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-between items-center h-16">
        <NavigationItem
          icon={<Album />}
          label="Collections"
          isActive={activePanel === 'collections'}
          onClick={() => handlePanelChange('collections')}
        />
        <NavigationItem
          icon={<Blocks />}
          label="Builder"
          isActive={activePanel === 'builder'}
          onClick={() => handlePanelChange('builder')}
        />
        <NavigationItem
          icon={<Eye />}
          label="Preview"
          isActive={activePanel === 'preview'}
          onClick={() => handlePanelChange('preview')}
        />
      </div>
    </nav>
  );
};
