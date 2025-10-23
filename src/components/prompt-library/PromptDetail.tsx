import React, { useEffect, useState, useRef } from 'react';
import { X, Share2, Check } from 'lucide-react';
import { usePromptsStore } from '../../store/promptsStore';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { CopyDownloadActions } from '../ui/CopyDownloadActions';
import { buildPromptUrl } from '../../utils/urlParams';

export const PromptDetail: React.FC = () => {
  const {
    selectedPromptId,
    prompts,
    collections,
    segments,
    selectPrompt,
    preferredLanguage,
    activeOrganization,
  } = usePromptsStore();
  const [language, setLanguage] = useState<'en' | 'pl'>(preferredLanguage);
  const [linkCopied, setLinkCopied] = useState(false);
  const urlPushedRef = useRef(false);

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
      // Reset to user's preferred language when a new prompt is opened
      setLanguage(preferredLanguage);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPromptId, preferredLanguage]);

  // Handle browser back/forward navigation (always active)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.promptId) {
        // User navigated forward to a prompt - open it
        selectPrompt(event.state.promptId);
        urlPushedRef.current = true;
      } else {
        // User navigated back away from prompt - close modal
        selectPrompt(null);
        urlPushedRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectPrompt]);

  // Synchronize URL when modal opens
  useEffect(() => {
    if (!selectedPrompt || !activeOrganization) return;

    const collection = collections.find((c) => c.id === selectedPrompt.collection_id);
    const segment = segments.find((s) => s.id === selectedPrompt.segment_id);

    // Build the prompt URL
    const url = buildPromptUrl({
      org: activeOrganization.slug,
      collection: collection?.slug,
      segment: segment?.slug,
      prompt: selectedPrompt.id,
    });

    // Only push state if we're not coming from a popstate event
    if (!urlPushedRef.current) {
      window.history.pushState({ promptId: selectedPrompt.id }, '', url);
      urlPushedRef.current = true;
      console.log('[PromptDetail] URL updated:', url);
    }
  }, [selectedPrompt, activeOrganization, collections, segments]);

  if (!selectedPrompt) {
    return null;
  }

  const collection = collections.find((c) => c.id === selectedPrompt.collection_id);
  const segment = segments.find((s) => s.id === selectedPrompt.segment_id);

  const handleClose = () => {
    // If we pushed a URL state, go back in history to restore previous URL
    if (urlPushedRef.current) {
      window.history.back();
      urlPushedRef.current = false;
    }
    selectPrompt(null);
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleShare = async () => {
    if (!activeOrganization) return;

    const url = buildPromptUrl({
      org: activeOrganization.slug,
      collection: collection?.slug,
      segment: segment?.slug,
      prompt: selectedPrompt.id,
    });

    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      console.log('[PromptDetail] Link copied to clipboard:', url);

      // Reset the "copied" state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error('[PromptDetail] Failed to copy link:', error);
    }
  };

  const hasPolishVersion = selectedPrompt.title_pl && selectedPrompt.markdown_body_pl;
  const title =
    language === 'pl' && selectedPrompt.title_pl
      ? selectedPrompt.title_pl
      : selectedPrompt.title_en;
  const description =
    language === 'pl' && selectedPrompt.description_pl
      ? selectedPrompt.description_pl
      : selectedPrompt.description_en;
  const markdownBody =
    language === 'pl' && selectedPrompt.markdown_body_pl
      ? selectedPrompt.markdown_body_pl
      : selectedPrompt.markdown_body_en;

  // Generate filename for download
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              {collection && <span>{collection.title}</span>}
              {collection && segment && <span className="text-gray-600">›</span>}
              {segment && <span>{segment.title}</span>}

              {/* Language Switcher */}
              {hasPolishVersion && (
                <div className="flex items-center gap-2 ml-4 border-l border-gray-600 pl-4">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 text-sm rounded-md ${
                      language === 'en'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label="English"
                    title="English"
                  >
                    🇬🇧
                  </button>
                  <button
                    onClick={() => setLanguage('pl')}
                    className={`px-2 py-1 text-sm rounded-md ${
                      language === 'pl'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label="Polski"
                    title="Polski"
                  >
                    🇵🇱
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            {description && <p className="text-sm text-gray-400 mt-2 italic">{description}</p>}
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
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <MarkdownRenderer
            content={markdownBody}
            className="mt-0"
            actions={<CopyDownloadActions content={markdownBody} filename={filename} />}
          />
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-850">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(selectedPrompt.updated_at).toLocaleString()}
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Share prompt link"
          >
            {linkCopied ? (
              <>
                <Check className="h-4 w-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptDetail;
