import { create } from 'zustand';
import {
  Layer,
  Stack,
  Library,
  getLayersByLibrary,
  getStacksByLibrary,
} from '../data/dictionaries';

interface TechStackState {
  // Selected items
  selectedLayers: Layer[];
  selectedStacks: Stack[];
  selectedLibraries: Library[];

  // Actions
  selectLayer: (layer: Layer) => void;
  unselectLayer: (layer: Layer) => void;
  selectStack: (stack: Stack) => void;
  unselectStack: (stack: Stack) => void;
  selectLibrary: (library: Library) => void;
  unselectLibrary: (library: Library) => void;

  // Reset actions
  resetLayers: () => void;
  resetStacks: () => void;
  resetLibraries: () => void;
  resetAll: () => void;

  // Utility functions
  isLayerSelected: (layer: Layer) => boolean;
  isStackSelected: (stack: Stack) => boolean;
  isLibrarySelected: (library: Library) => boolean;

  // Get related items
  getSelectedLayersByLibrary: (library: Library) => Layer[];
  getSelectedStacksByLibrary: (library: Library) => Stack[];
}

export const useTechStackStore = create<TechStackState>((set, get) => ({
  // Initial state
  selectedLayers: [],
  selectedStacks: [],
  selectedLibraries: [],

  // Layer actions
  selectLayer: (layer: Layer) =>
    set((state) => ({
      selectedLayers: state.selectedLayers.includes(layer)
        ? state.selectedLayers
        : [...state.selectedLayers, layer],
    })),

  unselectLayer: (layer: Layer) =>
    set((state) => ({
      selectedLayers: state.selectedLayers.filter((l) => l !== layer),
    })),

  // Stack actions
  selectStack: (stack: Stack) =>
    set((state) => ({
      selectedStacks: state.selectedStacks.includes(stack)
        ? state.selectedStacks
        : [...state.selectedStacks, stack],
    })),

  unselectStack: (stack: Stack) =>
    set((state) => ({
      selectedStacks: state.selectedStacks.filter((s) => s !== stack),
    })),

  // Library actions
  selectLibrary: (library: Library) =>
    set((state) => ({
      selectedLibraries: state.selectedLibraries.includes(library)
        ? state.selectedLibraries
        : [...state.selectedLibraries, library],
    })),

  unselectLibrary: (library: Library) =>
    set((state) => ({
      selectedLibraries: state.selectedLibraries.filter((l) => l !== library),
    })),

  // Reset actions
  resetLayers: () => set({ selectedLayers: [] }),
  resetStacks: () => set({ selectedStacks: [] }),
  resetLibraries: () => set({ selectedLibraries: [] }),
  resetAll: () =>
    set({
      selectedLayers: [],
      selectedStacks: [],
      selectedLibraries: [],
    }),

  // Utility functions
  isLayerSelected: (layer: Layer) => get().selectedLayers.includes(layer),

  isStackSelected: (stack: Stack) => get().selectedStacks.includes(stack),

  isLibrarySelected: (library: Library) =>
    get().selectedLibraries.includes(library),

  // Get related items
  getSelectedLayersByLibrary: (library: Library) => {
    const allLayersForLibrary = getLayersByLibrary(library);
    return allLayersForLibrary.filter((layer) =>
      get().selectedLayers.includes(layer),
    );
  },

  getSelectedStacksByLibrary: (library: Library) => {
    const allStacksForLibrary = getStacksByLibrary(library);
    return allStacksForLibrary.filter((stack) =>
      get().selectedStacks.includes(stack),
    );
  },
}));
