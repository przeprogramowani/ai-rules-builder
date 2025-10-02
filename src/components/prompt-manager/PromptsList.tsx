import React from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { PromptCard } from './PromptCard';

export const PromptsList: React.FC = () => {
  const { prompts, isLoading, error } = usePromptsStore();

  if (isLoading) {
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

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-gray-400 text-lg mb-2">No prompts found</div>
        <div className="text-gray-500 text-sm">Try changing your filters or check back later</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
};

export default PromptsList;
