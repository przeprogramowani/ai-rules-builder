import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Layer,
  Library,
  Stack,
  getLibrariesByStack,
  getStacksByLayer,
} from '../../../data/dictionaries';
import { useTechStackStore } from '../../../store/techStackStore';
import type { LayerType } from '../../../styles/theme';
import { layerToType } from '../../../styles/theme';

export const useRuleBuilder = () => {
  const {
    selectedLibraries,
    selectLayer,
    selectStack,
    selectLibrary,
    unselectLibrary,
    isLibrarySelected,
    resetAll,
  } = useTechStackStore();

  // State for tracking open accordions
  const [openLayers, setOpenLayers] = useState<Set<string>>(new Set());
  const [openStacks, setOpenStacks] = useState<Set<string>>(new Set());

  // Save the state before search for restoration when search is cleared
  const [preSearchOpenLayers, setPreSearchOpenLayers] = useState<Set<string>>(new Set());
  const [preSearchOpenStacks, setPreSearchOpenStacks] = useState<Set<string>>(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Detect search query change for saving pre-search state
  useEffect(() => {
    // Only save pre-search state when transitioning from no search to search
    if ((!lastSearchQuery || lastSearchQuery.length < 2) && searchQuery.length >= 2) {
      // Clone the sets to ensure we have independent copies
      setPreSearchOpenLayers(new Set([...openLayers]));
      setPreSearchOpenStacks(new Set([...openStacks]));
    }

    setLastSearchQuery(searchQuery);
  }, [searchQuery, openLayers, openStacks, lastSearchQuery]);

  // Get all available layers
  const layers = useMemo(() => Object.values(Layer), []);

  // Function to get layer type for a layer
  const getLayerType = useCallback((layer: Layer): LayerType => {
    return layerToType(layer);
  }, []);

  // Function to get layer type for a stack based on its layer
  const getStackLayerType = useCallback(
    (stack: Stack): LayerType => {
      // Find the layer this stack belongs to
      const layer = layers.find((l) => getStacksByLayer(l).includes(stack));
      return layer ? getLayerType(layer) : 'craftsmanship';
    },
    [layers, getLayerType],
  );

  // Helper functions for accordion state
  const isLayerOpen = useCallback((layer: Layer) => openLayers.has(layer), [openLayers]);

  const isStackOpen = useCallback((stack: Stack) => openStacks.has(stack), [openStacks]);

  // Toggle functions for accordions
  const toggleLayer = useCallback(
    (layer: Layer) => {
      setOpenLayers((prev) => {
        const newOpenLayers = new Set(prev);
        if (newOpenLayers.has(layer)) {
          newOpenLayers.delete(layer);
        } else {
          newOpenLayers.add(layer);
          selectLayer(layer);
        }
        return newOpenLayers;
      });
    },
    [selectLayer],
  );

  const toggleStack = useCallback(
    (stack: Stack) => {
      setOpenStacks((prev) => {
        const newOpenStacks = new Set(prev);
        if (newOpenStacks.has(stack)) {
          newOpenStacks.delete(stack);
        } else {
          newOpenStacks.add(stack);
          selectStack(stack);
        }
        return newOpenStacks;
      });
    },
    [selectStack],
  );

  // Filtering libraries based on search query
  const filterLibraries = useCallback(
    (libraries: Library[]): Library[] => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) return libraries;

      const normalizedQuery = debouncedSearchQuery.toLowerCase();
      return libraries.filter((library) => library.toLowerCase().includes(normalizedQuery));
    },
    [debouncedSearchQuery],
  );

  // Check if any libraries from this layer match the search query
  const layerContainsSearchMatch = useCallback(
    (layer: Layer): boolean => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) return true;

      // Get all stacks for this layer
      const stacks = getStacksByLayer(layer);

      // Check if any libraries from these stacks match the search
      return stacks.some((stack) => {
        const libraries = getLibrariesByStack(stack);
        return filterLibraries(libraries).length > 0;
      });
    },
    [debouncedSearchQuery, filterLibraries],
  );

  // Check if any libraries from this stack match the search query
  const stackContainsSearchMatch = useCallback(
    (stack: Stack): boolean => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) return true;

      const libraries = getLibrariesByStack(stack);
      return filterLibraries(libraries).length > 0;
    },
    [debouncedSearchQuery, filterLibraries],
  );

  // Get filtered libraries for a stack
  const getFilteredLibrariesByStack = useCallback(
    (stack: Stack): Library[] => {
      const libraries = getLibrariesByStack(stack);
      return filterLibraries(libraries);
    },
    [filterLibraries],
  );

  // Calculate total and matched libraries counts
  const getLibraryCounts = useMemo(() => {
    let totalCount = 0;
    let matchedCount = 0;

    layers.forEach((layer) => {
      const stacks = getStacksByLayer(layer);
      stacks.forEach((stack) => {
        const libraries = getLibrariesByStack(stack);
        const filteredLibraries = filterLibraries(libraries);

        totalCount += libraries.length;
        matchedCount += filteredLibraries.length;
      });
    });

    return { totalCount, matchedCount };
  }, [layers, filterLibraries]);

  // Check if any libraries from this layer are selected
  const hasSelectedLibraries = useCallback(
    (layer: Layer): boolean => {
      // Get all stacks for this layer
      const stacks = getStacksByLayer(layer);

      // Check if any libraries from these stacks are selected
      return stacks.some((stack) => {
        const libraries = getLibrariesByStack(stack);
        return libraries.some((library) => selectedLibraries.includes(library));
      });
    },
    [selectedLibraries],
  );

  // Check if any libraries from this stack are selected
  const hasStackSelectedLibraries = useCallback(
    (stack: Stack): boolean => {
      const libraries = getLibrariesByStack(stack);
      return libraries.some((library) => selectedLibraries.includes(library));
    },
    [selectedLibraries],
  );

  // Get count of selected libraries for a stack
  const getSelectedLibrariesCount = useCallback(
    (stack: Stack): number => {
      const libraries = getLibrariesByStack(stack);
      return libraries.filter((library) => selectedLibraries.includes(library)).length;
    },
    [selectedLibraries],
  );

  // Get count of selected libraries for a layer
  const getSelectedLibrariesCountForLayer = useCallback(
    (layer: Layer): number => {
      const stacks = getStacksByLayer(layer);
      let count = 0;
      stacks.forEach((stack) => {
        count += getSelectedLibrariesCount(stack);
      });
      return count;
    },
    [getSelectedLibrariesCount],
  );

  // Handle library toggle
  const handleLibraryToggle = useCallback(
    (library: Library) => {
      if (isLibrarySelected(library)) {
        unselectLibrary(library);
      } else {
        selectLibrary(library);
      }
    },
    [isLibrarySelected, selectLibrary, unselectLibrary],
  );

  // Handle clear all
  const handleClearAll = useCallback(() => {
    resetAll();
    setSearchQuery('');
    setOpenLayers(new Set());
    setOpenStacks(new Set());
  }, [resetAll]);

  // Get layer type for a library based on its related stack
  const getLibraryLayerType = useCallback(
    (library: Library): LayerType => {
      // Find first stack that contains this library
      const stacks = Object.values(Stack);
      for (const stack of stacks) {
        if (getLibrariesByStack(stack).includes(library)) {
          return getStackLayerType(stack);
        }
      }
      return 'craftsmanship';
    },
    [getStackLayerType],
  );

  // Improved auto-expand logic for search matches with better timing
  useEffect(() => {
    // Clear any ongoing timers when searchQuery changes
    let layerTimer: ReturnType<typeof setTimeout>;
    let stackTimer: ReturnType<typeof setTimeout>;
    let completeTimer: ReturnType<typeof setTimeout>;

    // Reset search expansion state when query changes
    setIsSearchExpanded(false);

    // Only proceed if we have a valid search query
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      // Find layers with matching libraries
      const matchingLayers = layers.filter(layerContainsSearchMatch);

      // First update layer state (open matching layers)
      layerTimer = setTimeout(() => {
        setOpenLayers(() => {
          const newOpenLayers = new Set<string>();
          matchingLayers.forEach((layer) => {
            newOpenLayers.add(layer);
          });
          return newOpenLayers;
        });

        // Then find and open matching stacks after layers have been opened
        stackTimer = setTimeout(() => {
          // Find stacks with matching libraries
          const matchingStacks = new Set<string>();
          matchingLayers.forEach((layer) => {
            const stacks = getStacksByLayer(layer);
            stacks.forEach((stack) => {
              if (stackContainsSearchMatch(stack)) {
                matchingStacks.add(stack);
              }
            });
          });

          // Update stack state
          setOpenStacks(() => {
            const newOpenStacks = new Set<string>();
            matchingStacks.forEach((stack) => {
              newOpenStacks.add(stack);
            });
            return newOpenStacks;
          });

          // Mark as complete after everything has been updated
          completeTimer = setTimeout(() => {
            setIsSearchExpanded(true);
          }, 300); // Increased from 200ms to give more time for animations
        }, 200); // Increased from 150ms to ensure layer expansion completes
      }, 80); // Increased from 50ms to give more time for initial processing
    } else if (debouncedSearchQuery.length < 2) {
      // If clearing the search, restore the previous state
      layerTimer = setTimeout(() => {
        setOpenLayers(preSearchOpenLayers);
        setOpenStacks(preSearchOpenStacks);

        // Give time for state changes to process before marking as not expanded
        completeTimer = setTimeout(() => {
          setIsSearchExpanded(false);
        }, 150);
      }, 80); // Increased from 50ms
    }

    // Clean up timers on unmount or when dependencies change
    return () => {
      clearTimeout(layerTimer);
      clearTimeout(stackTimer);
      clearTimeout(completeTimer);
    };
  }, [
    debouncedSearchQuery,
    layers,
    layerContainsSearchMatch,
    stackContainsSearchMatch,
    preSearchOpenLayers,
    preSearchOpenStacks,
  ]);

  // Handle search query change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    // State
    layers,
    selectedLibraries,

    // Accordion state
    openLayers,
    openStacks,
    isLayerOpen,
    isStackOpen,
    toggleLayer,
    toggleStack,

    // Search state and functions
    searchQuery,
    debouncedSearchQuery,
    handleSearchChange,
    layerContainsSearchMatch,
    stackContainsSearchMatch,
    getFilteredLibrariesByStack,
    getLibraryCounts,
    isSearchActive: debouncedSearchQuery.length >= 2,
    isSearchExpanded,

    // Library functions
    getSelectedLibrariesCount,
    getSelectedLibrariesCountForLayer,
    hasSelectedLibraries,
    hasStackSelectedLibraries,
    handleLibraryToggle,
    isLibrarySelected,
    unselectLibrary,

    // Actions
    handleClearAll,

    // Layer types for styling
    getLayerType,
    getStackLayerType,
    getLibraryLayerType,
  };
};
