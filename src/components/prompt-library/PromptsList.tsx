import React, { useState, useEffect } from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { PromptCard } from './PromptCard';
import { hasPolishVersion } from '../../services/prompt-library/language';

export const PromptsList: React.FC = () => {
  const { prompts, isLoading, error, preferredLanguage, collections, segments } = usePromptsStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Show skeleton during hydration or loading
  if (!hasHydrated || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse"
          >
            {/* Title skeleton */}
            <div className="h-7 bg-gray-700 rounded mb-2 w-3/4" />

            {/* Badges skeleton */}
            <div className="flex gap-2 mb-3">
              <div className="h-6 w-24 bg-gray-700 rounded" />
              <div className="h-6 w-20 bg-gray-700 rounded" />
            </div>

            {/* Preview text skeleton (3 lines) */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-2/3" />
            </div>

            {/* Date skeleton */}
            <div className="h-4 bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error loading prompts: {error}</div>
      </div>
    );
  }

  // Filter prompts based on language availability
  const filteredPrompts = prompts.filter((prompt) => {
    if (preferredLanguage === 'en') {
      return true; // English is always available
    }
    return hasPolishVersion(prompt); // For Polish, check if translation exists
  });

  // Sort prompts hierarchically: collection sort_order -> segment sort_order -> prompt id
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    // Find collections for both prompts
    const collectionA = collections.find((c) => c.id === a.collection_id);
    const collectionB = collections.find((c) => c.id === b.collection_id);

    const collectionOrderA = collectionA?.sort_order ?? 0;
    const collectionOrderB = collectionB?.sort_order ?? 0;

    // First, sort by collection order
    if (collectionOrderA !== collectionOrderB) {
      return collectionOrderA - collectionOrderB;
    }

    // If same collection, sort by segment order
    const segmentA = segments.find((s) => s.id === a.segment_id);
    const segmentB = segments.find((s) => s.id === b.segment_id);

    const segmentOrderA = segmentA?.sort_order ?? 0;
    const segmentOrderB = segmentB?.sort_order ?? 0;

    if (segmentOrderA !== segmentOrderB) {
      return segmentOrderA - segmentOrderB;
    }

    // If same segment, sort by prompt sort_order
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  if (sortedPrompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-gray-400 text-lg mb-2">No prompts found</div>
        <div className="text-gray-500 text-sm">Try changing your filters or check back later</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedPrompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
};

export default PromptsList;
