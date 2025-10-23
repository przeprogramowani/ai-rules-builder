import { useEffect } from 'react';
import { usePromptsStore } from '../store/promptsStore';

/**
 * Custom hook that synchronizes filter state (org, collection, segment) with URL parameters.
 *
 * This hook ensures that changes to dropdowns are reflected in the URL, enabling:
 * - Shareable filter views
 * - Deep linking to specific filter states
 * - Browser history and bookmark support
 *
 * Uses replaceState() to update URL without adding to browser history.
 * Skips during initial hydration to prevent competing URL updates.
 */
export const useUrlSync = () => {
  const {
    activeOrganization,
    collections,
    segments,
    selectedCollectionId,
    selectedSegmentId,
    isHydrating,
  } = usePromptsStore();

  useEffect(() => {
    // Skip during hydration and SSR
    if (isHydrating || typeof window === 'undefined') return;

    // Find current entities
    const collection = collections.find((c) => c.id === selectedCollectionId);
    const segment = segments.find((s) => s.id === selectedSegmentId);

    // Build URL
    const url = new URL(window.location.href);
    url.search = ''; // Clear existing params

    if (activeOrganization) {
      url.searchParams.set('org', activeOrganization.slug);
    }

    if (collection) {
      url.searchParams.set('collection', collection.slug);
    }

    if (segment) {
      url.searchParams.set('segment', segment.slug);
    }

    // Update URL without navigation
    window.history.replaceState({}, '', url.toString());
  }, [
    activeOrganization,
    selectedCollectionId,
    selectedSegmentId,
    collections,
    segments,
    isHydrating,
  ]);
};
