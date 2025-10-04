import React, { useState, useEffect } from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { PromptCard } from './PromptCard';
import { hasPolishVersion } from '../../services/prompt-library/language';

export const PromptsList: React.FC = () => {
  const { prompts, isLoading, error, preferredLanguage } = usePromptsStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Show skeleton during hydration or loading
  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading prompts...</div>
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

  if (filteredPrompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-gray-400 text-lg mb-2">No prompts found</div>
        <div className="text-gray-500 text-sm">Try changing your filters or check back later</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPrompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
};

export default PromptsList;
