/**
 * Theme configuration for the application
 *
 * This file provides a simplified theme system with layer-specific color mappings
 * using standard Tailwind colors.
 */

// The layer type corresponds to each major section of the application
export type LayerType =
  | 'craftsmanship' // Orange
  | 'frontend' // Blue
  | 'backend' // Green
  | 'database' // Indigo
  | 'devops' // Fuchsia
  | 'testing'; // Yellow

// Direct mapping to Tailwind color names
const layerColors: Record<LayerType, string> = {
  craftsmanship: 'orange',
  frontend: 'blue',
  backend: 'green',
  database: 'indigo',
  devops: 'fuchsia',
  testing: 'yellow',
};

// Theme transition settings for consistent animations
export const transitions = {
  duration: {
    fast: '150ms',
    medium: '200ms',
    slow: '300ms',
  },
  timing: {
    default: 'ease-in-out',
    bounce: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'ease',
  },
  delay: {
    none: '0ms',
    short: '50ms',
    medium: '100ms',
  },
};

// Ultra-simplified layer class generator
export const getLayerClasses = {
  container: (
    layerType: LayerType,
    isSelected: boolean,
    isExpanded: boolean = false
  ): string => {
    return isSelected
      ? `bg-gray-800/70 border-${layerColors[layerType]}-400 border shadow-md ${
          !isExpanded ? 'hover:bg-gray-700/70' : ''
        }`
      : `bg-gray-800/70 ${
          !isExpanded ? 'hover:bg-gray-700/70' : ''
        } border border-transparent hover:shadow-sm`;
  },

  badge: (layerType: LayerType): string => {
    return `bg-${layerColors[layerType]}-400/20 text-white`;
  },

  stackContainer: (
    layerType: LayerType,
    isSelected: boolean,
    isExpanded = false
  ): string => {
    return isSelected
      ? `bg-gray-700/40 border-${layerColors[layerType]}-300 border shadow-md ${
          !isExpanded ? 'hover:bg-gray-600/60' : ''
        }`
      : `bg-gray-700/60 ${
          !isExpanded ? 'hover:bg-gray-600/60' : ''
        } border border-transparent hover:shadow-sm`;
  },

  libraryItem: (layerType: LayerType, isSelected: boolean): string => {
    return isSelected
      ? `bg-${layerColors[layerType]}-400/20 border-${layerColors[layerType]}-300 border shadow-md box-border`
      : `bg-gray-600/50 hover:bg-gray-500/50 border border-transparent hover:shadow-sm box-border`;
  },

  toggleSwitch: (
    layerType: LayerType,
    isSelected: boolean
  ): { borderColor: string; backgroundColor: string } => {
    return {
      borderColor: isSelected
        ? `var(--tw-${layerColors[layerType]}-400)`
        : 'transparent',
      backgroundColor: isSelected
        ? `var(--tw-${layerColors[layerType]}-100)`
        : '#374151',
    };
  },

  toggleHandle: (
    layerType: LayerType,
    isSelected: boolean
  ): { backgroundColor: string; transform: string } => {
    return {
      backgroundColor: isSelected
        ? `var(--tw-${layerColors[layerType]}-400)`
        : '#D1D5DB',
      transform: isSelected ? 'translateX(16px)' : 'translateX(0)',
    };
  },

  text: (layerType: LayerType): string => {
    return `text-${layerColors[layerType]}-500`;
  },

  selectedRuleBadge: (layerType: LayerType): string => {
    return `bg-${layerColors[layerType]}-400/20 text-white`;
  },
  
  focusRing: (layerType: LayerType): string => {
    return `focus:ring-${layerColors[layerType]}-500`;
  },
};

// For backward compatibility with any remaining code
import { Layer } from '../data/dictionaries';

export const layerToType = (layer: Layer): LayerType => {
  switch (layer) {
    case Layer.CRAFTSMANSHIP:
      return 'craftsmanship';
    case Layer.FRONTEND:
      return 'frontend';
    case Layer.BACKEND:
      return 'backend';
    case Layer.DATABASE:
      return 'database';
    case Layer.DEVOPS:
      return 'devops';
    case Layer.TESTING:
      return 'testing';
    default:
      return 'craftsmanship';
  }
};
