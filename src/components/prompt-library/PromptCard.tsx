import React from 'react';
import type { Prompt } from '../../store/promptsStore';
import { usePromptsStore } from '../../store/promptsStore';
import {
  getLocalizedTitle,
  getLocalizedBody,
  getLocalizedDescription,
} from '../../services/prompt-library/language';

interface PromptCardProps {
  prompt: Prompt;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const { selectPrompt, collections, segments, preferredLanguage } = usePromptsStore();

  const collection = collections.find((c) => c.id === prompt.collection_id);
  const segment = segments.find((s) => s.id === prompt.segment_id);

  const handleClick = () => {
    selectPrompt(prompt.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectPrompt(prompt.id);
    }
  };

  // Use user's preferred language with fallback to English
  const title = getLocalizedTitle(prompt, preferredLanguage);
  const description = getLocalizedDescription(prompt, preferredLanguage);
  const body = getLocalizedBody(prompt, preferredLanguage);
  const preview = description || body.substring(0, 150) + (body.length > 150 ? '...' : '');

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View prompt: ${title}`}
    >
      <h3 className="text-lg font-semibold text-white mb-2 truncate">{title}</h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {collection && (
          <span className="text-xs bg-indigo-700 text-indigo-100 px-2 py-1 rounded">
            {collection.title}
          </span>
        )}
        {segment && (
          <span className="text-xs bg-purple-700 text-purple-100 px-2 py-1 rounded">
            {segment.title}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400 line-clamp-3">{preview}</p>

      <div className="mt-3 text-xs text-gray-500">
        Updated: {new Date(prompt.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default PromptCard;
