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

  // Original collection libraries (for dirty state comparison)
  originalLibraries: Library[];

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
  setOriginalLibraries: (libraries: Library[]) => void;

  // Utility functions
  isLayerSelected: (layer: Layer) => boolean;
  isStackSelected: (stack: Stack) => boolean;
  isLibrarySelected: (library: Library) => boolean;
  isDirty: () => boolean;

  // Get related items
  getSelectedLayersByLibrary: (library: Library) => Layer[];
  getSelectedStacksByLibrary: (library: Library) => Stack[];
}

export const useTechStackStore = create<TechStackState>((set, get) => ({
  // Initial state
  selectedLayers: [],
  selectedStacks: [],
  selectedLibraries: [],
  originalLibraries: [],

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

  setOriginalLibraries: (libraries: Library[]) =>
    set({
      originalLibraries: libraries,
    }),

  // Utility functions
  isLayerSelected: (layer: Layer) => get().selectedLayers.includes(layer),
  isStackSelected: (stack: Stack) => get().selectedStacks.includes(stack),
  isLibrarySelected: (library: Library) => get().selectedLibraries.includes(library),
  isDirty: () => {
    const { selectedLibraries, originalLibraries } = get();

    // If lengths are different, state is definitely dirty
    if (selectedLibraries.length !== originalLibraries.length) return true;

    // Check if all original libraries are still selected
    const hasAllOriginal = originalLibraries.every((lib) => selectedLibraries.includes(lib));

    // Check if all selected libraries were in original
    const allSelectedWereOriginal = selectedLibraries.every((lib) =>
      originalLibraries.includes(lib),
    );

    return !hasAllOriginal || !allSelectedWereOriginal;
  },

  // Get related items
  getSelectedLayersByLibrary: (library: Library) => {
    const allLayersForLibrary = getLayersByLibrary(library);
    return allLayersForLibrary.filter((layer) => get().selectedLayers.includes(layer));
  },

  getSelectedStacksByLibrary: (library: Library) => {
    const allStacksForLibrary = getStacksByLibrary(library);
    return allStacksForLibrary.filter((stack) => get().selectedStacks.includes(stack));
  },
}));
