import React, { useState } from 'react';
import { Archive, Loader2, Pencil, Send, Trash2 } from 'lucide-react';
import type { Prompt, PromptCollection, PromptSegment } from '../../../store/promptsStore';
import StatusBadge from '../../ui/StatusBadge';

interface AdminPromptCardProps {
  prompt: Prompt;
  collections: PromptCollection[];
  segments: PromptSegment[];
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onTogglePublish: (promptId: string) => void;
  isSelected?: boolean;
}

export const AdminPromptCard: React.FC<AdminPromptCardProps> = ({
  prompt,
  collections,
  segments,
  onEdit,
  onDelete,
  onTogglePublish,
  isSelected = false,
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const collection = collections.find((c) => c.id === prompt.collection_id);
  const segment = segments.find((s) => s.id === prompt.segment_id);

  const handleTogglePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsToggling(true);
      await onTogglePublish(prompt.id);
    } catch (error) {
      console.error('Error toggling publish status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(prompt);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(prompt.id);
  };

  const handleCardClick = () => {
    onEdit(prompt);
  };

  // Get preview of markdown content (first 150 chars)
  const preview =
    prompt.markdown_body.slice(0, 150) + (prompt.markdown_body.length > 150 ? '...' : '');

  const isPublished = prompt.status === 'published';

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={`bg-gray-800 border ${
        isSelected ? 'border-blue-400' : 'border-gray-700 hover:border-indigo-500'
      } rounded-lg p-4 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3
            className={`font-medium truncate transition-colors ${
              isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-400'
            }`}
          >
            {prompt.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Action buttons */}

          <button
            onClick={handleTogglePublish}
            disabled={isToggling}
            className="p-1.5 rounded-md text-gray-400 hover:text-green-400 hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50 "
            aria-label={isPublished ? `Unpublish ${prompt.title}` : `Publish ${prompt.title}`}
          >
            {isToggling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isPublished ? (
              <Archive className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
          <button
            onClick={handleEditClick}
            className="p-1.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            aria-label={`Edit ${prompt.title}`}
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
            aria-label={`Delete ${prompt.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{preview}</p>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={prompt.status === 'published' ? 'published' : 'draft'} />

        {collection && (
          <span className="text-xs px-2 py-1 rounded bg-indigo-700 text-indigo-100">
            {collection.title}
          </span>
        )}

        {segment && (
          <span className="text-xs px-2 py-1 rounded bg-purple-700 text-purple-100">
            {segment.title}
          </span>
        )}
      </div>

      {/* Updated date */}
      <div className="mt-2 text-xs text-gray-500">
        Updated: {new Date(prompt.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default AdminPromptCard;
