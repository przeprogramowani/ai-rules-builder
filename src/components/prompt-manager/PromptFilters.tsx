import React from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { Dropdown, type DropdownOption } from '../ui/Dropdown';

export const PromptFilters: React.FC = () => {
  const { collections, segments, selectedCollectionId, selectedSegmentId, setFilters, prompts } =
    usePromptsStore();

  // Create collection options with "All" option
  const collectionOptions: DropdownOption<string | null>[] = [
    { value: null, label: 'All Collections' },
    ...collections.map((collection) => ({
      value: collection.id,
      label: collection.title,
    })),
  ];

  // Create segment options with "All" option (only show when a collection is selected)
  const segmentOptions: DropdownOption<string | null>[] = [
    { value: null, label: 'All Segments' },
    ...segments.map((segment) => ({
      value: segment.id,
      label: segment.title,
    })),
  ];

  const handleCollectionChange = (collectionId: string | null) => {
    setFilters(collectionId, null); // Reset segment when collection changes
  };

  const handleSegmentChange = (segmentId: string | null) => {
    setFilters(selectedCollectionId, segmentId);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6 justify-between items-end">
      <div className="flex gap-4 flex-wrap">
        <div className="min-w-[200px]">
          <Dropdown
            label="Collection"
            options={collectionOptions}
            value={selectedCollectionId}
            onChange={handleCollectionChange}
            placeholder="Select collection"
          />
        </div>

        {selectedCollectionId && segments.length > 0 && (
          <div className="min-w-[200px]">
            <Dropdown
              label="Segment"
              options={segmentOptions}
              value={selectedSegmentId}
              onChange={handleSegmentChange}
              placeholder="Select segment"
            />
          </div>
        )}
      </div>

      <div className="text-sm text-gray-400">
        <span>
          {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
        </span>
      </div>
    </div>
  );
};

export default PromptFilters;
