import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the AI environment types for easier maintenance
export type AIEnvironment =
  | 'github'
  | 'cursor'
  | 'windsurf'
  | 'aider'
  | 'cline'
  | 'junie';

interface ProjectState {
  // Project metadata
  projectName: string;
  projectDescription: string;
  selectedEnvironment: AIEnvironment;

  // Hydration state
  isHydrated: boolean;

  // Actions
  setProjectName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  setSelectedEnvironment: (environment: AIEnvironment) => void;
  setHydrated: () => void;
}

// Create a store with persistence
export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      // Initial state
      projectName: '{{project-name}}',
      projectDescription: '{{project-description}}',
      selectedEnvironment: 'github' as AIEnvironment,
      isHydrated: false,

      // Actions
      setProjectName: (name: string) => set({ projectName: name }),
      setProjectDescription: (description: string) =>
        set({ projectDescription: description }),
      setSelectedEnvironment: (environment: AIEnvironment) =>
        set({ selectedEnvironment: environment }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'ai-rules-project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectName: state.projectName,
        projectDescription: state.projectDescription,
        selectedEnvironment: state.selectedEnvironment,
      }),
      // Set hydration flag when storage is hydrated
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    },
  ),
);
