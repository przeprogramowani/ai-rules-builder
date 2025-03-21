import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type AIEnvironment, AIEnvironmentName } from '../data/ai-environments.ts';

interface ProjectState {
  // Project metadata
  projectName: string;
  projectDescription: string;
  selectedEnvironment: AIEnvironment;
  isMultiFileEnvironment: boolean;

  // Hydration state
  isHydrated: boolean;

  // Actions
  setProjectName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  setSelectedEnvironment: (environment: AIEnvironment) => void;
  setHydrated: () => void;
}

export const multiFileEnvironments: ReadonlySet<AIEnvironment> = new Set<AIEnvironment>([AIEnvironmentName.Cline, AIEnvironmentName.Cursor]);
export const initialEnvironment: Readonly<AIEnvironment> = AIEnvironmentName.Cursor;

// Create a store with persistence
export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      // Initial state
      projectName: '{{project-name}}',
      projectDescription: '{{project-description}}',
      selectedEnvironment: initialEnvironment,
      isMultiFileEnvironment: multiFileEnvironments.has(initialEnvironment),
      isHydrated: false,

      // Actions
      setProjectName: (name: string) => set({ projectName: name }),
      setProjectDescription: (description: string) =>
        set({ projectDescription: description }),
      setSelectedEnvironment: (environment: AIEnvironment) =>
        set({ selectedEnvironment: environment, isMultiFileEnvironment: multiFileEnvironments.has(environment) }),
      setHydrated: () => set({ isHydrated: true })
    }),
    {
      name: 'ai-rules-project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectName: state.projectName,
        projectDescription: state.projectDescription,
        selectedEnvironment: state.selectedEnvironment
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
