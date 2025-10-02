import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { usePromptsStore } from '../../store/promptsStore';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { CopyDownloadActions } from '../ui/CopyDownloadActions';

export const PromptDetail: React.FC = () => {
  const { selectedPromptId, prompts, collections, segments, selectPrompt } = usePromptsStore();

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPromptId) {
        selectPrompt(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedPromptId, selectPrompt]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedPromptId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPromptId]);

  if (!selectedPrompt) {
    return null;
  }

  const collection = collections.find((c) => c.id === selectedPrompt.collection_id);
  const segment = segments.find((s) => s.id === selectedPrompt.segment_id);

  const handleClose = () => {
    selectPrompt(null);
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  // Generate filename for download
  const filename = `${selectedPrompt.title.toLowerCase().replace(/\s+/g, '-')}.md`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{selectedPrompt.title}</h2>

            {/* Breadcrumb */}
            <div className="flex flex-wrap gap-2 text-sm text-gray-400">
              {collection && <span>{collection.title}</span>}
              {collection && segment && <span className="text-gray-600">›</span>}
              {segment && <span>{segment.title}</span>}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="ml-4 text-gray-400 cursor-pointer hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <MarkdownRenderer
            content={selectedPrompt.markdown_body}
            className="mt-0"
            actions={
              <CopyDownloadActions content={selectedPrompt.markdown_body} filename={filename} />
            }
          />
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-850">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(selectedPrompt.updated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDetail;
