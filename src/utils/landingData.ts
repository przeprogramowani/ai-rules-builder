/**
 * Landing page data utilities
 * Helpers to extract and format data for the landing page
 */

import { Layer, getLibrariesCountByLayer } from '../data/dictionaries';

// Contributor interface based on all-contributors format
export interface Contributor {
  name: string;
  login: string;
  avatar_url: string;
  profile: string;
  contributions: string[];
}

// Tech stack layer statistics
export interface LayerStats {
  name: string;
  icon: string;
  count: number;
  layer: Layer;
}

/**
 * Get library counts by layer with formatted display data
 */
export const getLayerStatistics = (): LayerStats[] => {
  return [
    {
      name: 'Coding Practices',
      icon: '💡',
      count: getLibrariesCountByLayer(Layer.CODING_PRACTICES),
      layer: Layer.CODING_PRACTICES,
    },
    {
      name: 'Frontend',
      icon: '🎨',
      count: getLibrariesCountByLayer(Layer.FRONTEND),
      layer: Layer.FRONTEND,
    },
    {
      name: 'Backend',
      icon: '⚙️',
      count: getLibrariesCountByLayer(Layer.BACKEND),
      layer: Layer.BACKEND,
    },
    {
      name: 'Database',
      icon: '🗄️',
      count: getLibrariesCountByLayer(Layer.DATABASE),
      layer: Layer.DATABASE,
    },
    {
      name: 'DevOps',
      icon: '🚀',
      count: getLibrariesCountByLayer(Layer.DEVOPS),
      layer: Layer.DEVOPS,
    },
    {
      name: 'Testing',
      icon: '✅',
      count: getLibrariesCountByLayer(Layer.TESTING),
      layer: Layer.TESTING,
    },
  ];
};

/**
 * Get total library count across all layers
 */
export const getTotalLibraryCount = (): number => {
  return Object.values(Layer).reduce((total, layer) => {
    return total + getLibrariesCountByLayer(layer);
  }, 0);
};

/**
 * Get contributor data from README.md
 * This is a static list extracted from the README.md all-contributors section
 */
export const getContributors = (): Contributor[] => {
  return [
    {
      name: 'Damian',
      login: 'damianidczak',
      avatar_url: 'https://avatars.githubusercontent.com/u/21343496?v=4',
      profile: 'https://github.com/damianidczak',
      contributions: ['code'],
    },
    {
      name: 'pawel-twardziak',
      login: 'pawel-twardziak',
      avatar_url: 'https://avatars.githubusercontent.com/u/180847852?v=4',
      profile: 'https://github.com/pawel-twardziak',
      contributions: ['code'],
    },
    {
      name: 'Michal Dudziak',
      login: 'dudziakm',
      avatar_url: 'https://avatars.githubusercontent.com/u/10773170?v=4',
      profile: 'https://github.com/dudziakm',
      contributions: ['maintenance'],
    },
    {
      name: 'Artur Laskowski',
      login: 'arturlaskowski',
      avatar_url: 'https://avatars.githubusercontent.com/u/92392161?v=4',
      profile: 'https://www.linkedin.com/in/artur-laskowski94',
      contributions: ['code'],
    },
    {
      name: 'Michaelzag',
      login: 'Michaelzag',
      avatar_url: 'https://avatars.githubusercontent.com/u/4809030?v=4',
      profile: 'https://github.com/Michaelzag',
      contributions: ['code'],
    },
    {
      name: 'Piotr Porzuczek',
      login: 'PeterPorzuczek',
      avatar_url: 'https://avatars.githubusercontent.com/u/24259570?v=4',
      profile: 'https://github.com/PeterPorzuczek',
      contributions: ['code'],
    },
    {
      name: 'Michał Michalczuk',
      login: 'michalczukm',
      avatar_url: 'https://avatars.githubusercontent.com/u/6861120?v=4',
      profile: 'https://michalczukm.xyz',
      contributions: ['code'],
    },
    {
      name: 'Paweł Gnat',
      login: 'Pawel-Gnat',
      avatar_url: 'https://avatars.githubusercontent.com/u/104066590?v=4',
      profile: 'https://www.pawelgnat.com/',
      contributions: ['code'],
    },
    {
      name: 'Kacper Kłosowski',
      login: 'kacperklosowski',
      avatar_url: 'https://avatars.githubusercontent.com/u/77013552?v=4',
      profile: 'https://github.com/kacperklosowski',
      contributions: ['code'],
    },
  ];
};

/**
 * Get contributor count
 */
export const getContributorCount = (): number => {
  return getContributors().length;
};
