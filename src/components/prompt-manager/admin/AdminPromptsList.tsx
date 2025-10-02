import React from 'react';
import { Plus } from 'lucide-react';
import type { Prompt, PromptCollection, PromptSegment } from '../../../store/promptsStore';
import AdminPromptCard from './AdminPromptCard';

interface AdminPromptsListProps {
  prompts: Prompt[];
  collections: PromptCollection[];
  segments: PromptSegment[];
  isLoading: boolean;
  error: string | null;
  selectedPromptId: string | null;
  onCreateNew: () => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onTogglePublish: (promptId: string) => void;
}

export const AdminPromptsList: React.FC<AdminPromptsListProps> = ({
  prompts,
  collections,
  segments,
  isLoading,
  error,
  selectedPromptId,
  onCreateNew,
  onEdit,
  onDelete,
  onTogglePublish,
}) => {
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
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-gray-400">No prompts found</div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-4" />
          Create New Prompt
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New Button */}
      <div className="flex justify-end">
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-4" />
          Create New Prompt
        </button>
      </div>

      {/* Prompts Grid */}
      {prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-gray-400">No prompts match the selected filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <AdminPromptCard
              key={prompt.id}
              prompt={prompt}
              collections={collections}
              segments={segments}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
              isSelected={selectedPromptId === prompt.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromptsList;
