import React from 'react';
import type { Prompt, PromptCollection, PromptSegment } from '../../../store/promptsStore';
import AdminPromptCard from './AdminPromptCard';

interface AdminPromptsListProps {
  prompts: Prompt[];
  collections: PromptCollection[];
  segments: PromptSegment[];
  isLoading: boolean;
  error: string | null;
  selectedPromptId: string | null;
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
  onEdit,
  onDelete,
  onTogglePublish,
}) => {
  // Sort collections and segments by their sort_order
  const sortedCollections = [...collections].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const sortedSegments = [...segments].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Sort prompts hierarchically: collection sort_order -> segment sort_order -> prompt created_at
  const sortedPrompts = [...prompts].sort((a, b) => {
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

  if (sortedPrompts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-gray-400">No prompts found</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedPrompts.map((prompt) => (
        <AdminPromptCard
          key={prompt.id}
          prompt={prompt}
          collections={sortedCollections}
          segments={sortedSegments}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublish={onTogglePublish}
          isSelected={selectedPromptId === prompt.id}
        />
      ))}
    </div>
  );
};

export default AdminPromptsList;
