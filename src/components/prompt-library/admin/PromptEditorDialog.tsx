import React, { useState, useEffect } from 'react';
import {
  ConfirmDialog,
  ConfirmDialogHeader,
  ConfirmDialogContent,
  ConfirmDialogActions,
} from '../../ui/ConfirmDialog';
import FormInput from '../../ui/FormInput';
import FormTextarea from '../../ui/FormTextarea';
import { Dropdown } from '../../ui/Dropdown';
import InlineEntityForm from '../../ui/InlineEntityForm';
import { usePromptsStore } from '../../../store/promptsStore';
import { Plus } from 'lucide-react';
import type { Prompt, CreatePromptInput, UpdatePromptInput } from '../../../store/promptsStore';

interface PromptEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePromptInput | UpdatePromptInput) => Promise<void>;
  initialData?: Prompt;
}

export const PromptEditorDialog: React.FC<PromptEditorDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  // Get collections and segments directly from store for real-time updates
  const collections = usePromptsStore((state) => state.collections ?? []);
  const segments = usePromptsStore((state) => state.segments ?? []);
  const { createCollection, createSegment, fetchSegments } = usePromptsStore();

  const [titleEn, setTitleEn] = useState('');
  const [markdownBodyEn, setMarkdownBodyEn] = useState('');
  const [titlePl, setTitlePl] = useState('');
  const [markdownBodyPl, setMarkdownBodyPl] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    titleEn?: string;
    collectionId?: string;
    segmentId?: string;
    markdownBodyEn?: string;
  }>({});

  // Inline creation states
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setTitleEn(initialData.title_en);
      setMarkdownBodyEn(initialData.markdown_body_en);
      setTitlePl(initialData.title_pl || '');
      setMarkdownBodyPl(initialData.markdown_body_pl || '');
      setCollectionId(initialData.collection_id);
      setSegmentId(initialData.segment_id || '');

      // Ensure segments are loaded for this collection
      if (initialData.collection_id) {
        fetchSegments(initialData.collection_id);
      }
    } else {
      setTitleEn('');
      setMarkdownBodyEn('');
      setTitlePl('');
      setMarkdownBodyPl('');
      setCollectionId('');
      setSegmentId('');
    }
    setError(null);
    setValidationErrors({});
    setHasAttemptedSave(false);
    setIsCreatingCollection(false);
    setIsCreatingSegment(false);
  }, [initialData, isOpen, fetchSegments]);

  const validate = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!titleEn.trim()) {
      errors.titleEn = 'English title is required';
    }

    if (!collectionId) {
      errors.collectionId = 'Collection is required';
    }

    if (!segmentId) {
      errors.segmentId = 'Segment is required';
    }

    if (!markdownBodyEn.trim()) {
      errors.markdownBodyEn = 'English content is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setHasAttemptedSave(true);

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const data: CreatePromptInput | UpdatePromptInput = {
        title_en: titleEn.trim(),
        markdown_body_en: markdownBodyEn.trim(),
        title_pl: titlePl.trim(),
        markdown_body_pl: markdownBodyPl.trim(),
        collection_id: collectionId,
        segment_id: segmentId,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle collection creation
  const handleCreateCollection = async (data: {
    title: string;
    description?: string;
    slug?: string;
  }) => {
    const newCollection = await createCollection(data);
    setCollectionId(newCollection.id);
    setIsCreatingCollection(false);
    // Fetch segments for the new collection
    await fetchSegments(newCollection.id);
  };

  // Handle segment creation
  const handleCreateSegment = async (data: { title: string; slug?: string }) => {
    if (!collectionId) return;
    const newSegment = await createSegment(collectionId, data);
    setSegmentId(newSegment.id);
    setIsCreatingSegment(false);
  };

  // Filter segments for selected collection
  const filteredSegments = segments.filter((s) => s.collection_id === collectionId);

  // Disable segment dropdown if no collection is selected
  const isSegmentDisabled = !collectionId || collectionId === '__CREATE_NEW__';

  // Create options for dropdowns with special "Create New" option
  const collectionOptions = [
    { value: '__CREATE_NEW__', label: 'Create New Collection' },
    ...collections.map((c) => ({
      value: c.id,
      label: c.title,
    })),
  ];

  const segmentOptions = [
    { value: '__CREATE_NEW__', label: 'Create New Segment' },
    ...filteredSegments.map((s) => ({
      value: s.id,
      label: s.title,
    })),
  ];

  // Handle collection change
  const handleCollectionChange = async (value: string) => {
    if (value === '__CREATE_NEW__') {
      setIsCreatingCollection(true);
      return;
    }
    setCollectionId(value);
    setSegmentId('');
    setIsCreatingCollection(false);
    if (hasAttemptedSave && validationErrors.collectionId) {
      setValidationErrors((prev) => ({ ...prev, collectionId: undefined }));
    }
    // Fetch segments for the selected collection
    await fetchSegments(value);
  };

  // Handle segment change
  const handleSegmentChange = (value: string) => {
    if (value === '__CREATE_NEW__') {
      setIsCreatingSegment(true);
      return;
    }
    setSegmentId(value);
    setIsCreatingSegment(false);
    if (hasAttemptedSave && validationErrors.segmentId) {
      setValidationErrors((prev) => ({ ...prev, segmentId: undefined }));
    }
  };

  // Custom option renderer to add Plus icon for "Create New" options
  const renderCollectionOption = (
    option: { value: string; label: string },
    isSelected: boolean,
  ) => {
    if (option.value === '__CREATE_NEW__') {
      return (
        <span className="flex items-center gap-2 text-blue-400">
          <Plus className="h-4 w-4" />
          {option.label}
        </span>
      );
    }
    return (
      <>
        <span className="truncate">{option.label}</span>
        {isSelected && <span className="ml-2">✓</span>}
      </>
    );
  };

  const renderSegmentOption = (option: { value: string; label: string }, isSelected: boolean) => {
    if (option.value === '__CREATE_NEW__') {
      return (
        <span className="flex items-center gap-2 text-blue-400">
          <Plus className="h-4 w-4" />
          {option.label}
        </span>
      );
    }
    return (
      <>
        <span className="truncate">{option.label}</span>
        {isSelected && <span className="ml-2">✓</span>}
      </>
    );
  };

  return (
    <ConfirmDialog isOpen={isOpen} onClose={onClose}>
      <ConfirmDialogHeader>{initialData ? 'Edit Prompt' : 'Create New Prompt'}</ConfirmDialogHeader>
      <ConfirmDialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <FormInput
            label="Title (English)"
            id="title_en"
            value={titleEn}
            onChange={(e) => {
              setTitleEn(e.target.value);
              if (hasAttemptedSave && validationErrors.titleEn) {
                setValidationErrors((prev) => ({ ...prev, titleEn: undefined }));
              }
            }}
            error={hasAttemptedSave ? validationErrors.titleEn : undefined}
            placeholder="Enter prompt title in English"
          />
          <FormInput
            label="Title (Polish)"
            id="title_pl"
            value={titlePl}
            onChange={(e) => setTitlePl(e.target.value)}
            placeholder="Enter prompt title in Polish"
          />

          <div className="space-y-1">
            <Dropdown
              label="Collection"
              options={collectionOptions}
              value={collectionId}
              onChange={handleCollectionChange}
              placeholder="Select collection"
              renderOption={renderCollectionOption}
            />
            {hasAttemptedSave && validationErrors.collectionId && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.collectionId}</p>
            )}
          </div>

          {isCreatingCollection && (
            <InlineEntityForm
              type="collection"
              onSave={handleCreateCollection}
              onCancel={() => {
                setIsCreatingCollection(false);
                setCollectionId('');
              }}
            />
          )}

          <div className="space-y-1">
            <Dropdown
              label="Segment"
              options={segmentOptions}
              value={segmentId}
              onChange={handleSegmentChange}
              placeholder={collectionId ? 'Select segment' : 'Select collection first'}
              disabled={isSegmentDisabled}
              renderOption={renderSegmentOption}
            />
            {hasAttemptedSave && validationErrors.segmentId && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.segmentId}</p>
            )}
          </div>

          {isCreatingSegment && collectionId && (
            <InlineEntityForm
              type="segment"
              collectionId={collectionId}
              onSave={handleCreateSegment}
              onCancel={() => {
                setIsCreatingSegment(false);
                setSegmentId('');
              }}
            />
          )}

          <FormTextarea
            label="Content (Markdown, English)"
            id="markdown_body_en"
            value={markdownBodyEn}
            onChange={(e) => {
              setMarkdownBodyEn(e.target.value);
              if (hasAttemptedSave && validationErrors.markdownBodyEn) {
                setValidationErrors((prev) => ({ ...prev, markdownBodyEn: undefined }));
              }
            }}
            error={hasAttemptedSave ? validationErrors.markdownBodyEn : undefined}
            placeholder="Enter prompt content in English markdown format..."
            rows={10}
          />

          <FormTextarea
            label="Content (Markdown, Polish)"
            id="markdown_body_pl"
            value={markdownBodyPl}
            onChange={(e) => setMarkdownBodyPl(e.target.value)}
            placeholder="Enter prompt content in Polish markdown format..."
            rows={10}
          />

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-md p-3">
              {error}
            </div>
          )}
        </form>
      </ConfirmDialogContent>
      <ConfirmDialogActions>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
      </ConfirmDialogActions>
    </ConfirmDialog>
  );
};

export default PromptEditorDialog;
