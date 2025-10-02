import React, { useState } from 'react';
import { slugify } from '@/utils/slugify';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';

interface InlineEntityFormProps {
  type: 'collection' | 'segment';
  onSave: (data: { title: string; description?: string; slug?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function InlineEntityForm({ type, onSave, onCancel }: InlineEntityFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [manuallyEditedSlug, setManuallyEditedSlug] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    slug?: string;
    description?: string;
  }>({});

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setFieldErrors((prev) => ({ ...prev, title: undefined }));

    // Auto-generate slug if user hasn't manually edited it
    if (!manuallyEditedSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setManuallyEditedSlug(true);
    setFieldErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setFieldErrors((prev) => ({ ...prev, description: undefined }));
  };

  const validate = () => {
    const errors: { title?: string; slug?: string; description?: string } = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 255) {
      errors.title = 'Title must be 255 characters or less';
    }

    if (!slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (type === 'collection' && description && description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        description: type === 'collection' && description ? description.trim() : undefined,
        slug: slug.trim(),
      });
      // Parent is responsible for closing the form on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-gray-800/30 border border-gray-700 rounded-md">
      <h3 className="text-sm font-medium text-gray-300 mb-3">
        Create New {type === 'collection' ? 'Collection' : 'Segment'}
      </h3>

      <div className="space-y-3">
        <FormInput
          label="Title *"
          id={`${type}-title`}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={`Enter ${type} title`}
          error={fieldErrors.title}
          disabled={isLoading}
          autoFocus
        />

        {type === 'collection' && (
          <FormTextarea
            label="Description"
            id="collection-description"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Enter collection description (optional)"
            error={fieldErrors.description}
            disabled={isLoading}
            rows={3}
          />
        )}

        <div>
          <FormInput
            label="Slug *"
            id={`${type}-slug`}
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="auto-generated-from-title"
            error={fieldErrors.slug}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">Auto-generated from title</p>
        </div>

        {error && (
          <div className="p-2 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              `Create ${type === 'collection' ? 'Collection' : 'Segment'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
