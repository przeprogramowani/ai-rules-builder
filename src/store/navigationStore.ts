import { create } from 'zustand';

export type Panel = 'collections' | 'builder' | 'preview';

interface NavigationState {
  activePanel: Panel;
  isSidebarOpen: boolean;
  setActivePanel: (panel: Panel) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activePanel: 'builder',
  isSidebarOpen: false,
  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
