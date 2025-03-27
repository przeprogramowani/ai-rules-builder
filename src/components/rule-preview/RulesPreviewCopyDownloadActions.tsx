import { type Zippable, zipSync } from 'fflate';
import React, { Fragment, useState } from 'react';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';
import { useProjectStore } from '../../store/projectStore';

interface RulesPreviewCopyDownloadActionsProps {
  rulesContent: RulesContent[];
}

export const RulesPreviewCopyDownloadActions: React.FC<RulesPreviewCopyDownloadActionsProps> = ({ rulesContent }) => {
  const { selectedEnvironment, isMultiFileEnvironment } = useProjectStore();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const singleRuleContent = rulesContent.length <= 1;

  // Get the appropriate file path based on the selected format
  const getFilePath = (): string => aiEnvironmentConfig[selectedEnvironment].filePath;

  // Copy the markdown content to clipboard
  const handleCopy = async () => {
    const markdown = rulesContent.map((content) => content.markdown).join('\n\n');
    try {
      await navigator.clipboard.writeText(markdown);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = markdown;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setShowCopiedMessage(true);
          setTimeout(() => setShowCopiedMessage(false), 2000);
        }
      } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
      }

      document.body.removeChild(textArea);
    }
  };

  const invokeDownload = ({ url, download }: { url: string; download: string }) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = download;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download the markdown content as a file
  const handleDownload = () => {
    let content: Uint8Array<ArrayBufferLike> | string;
    let blob: Blob;
    let download: string;

    if (isMultiFileEnvironment) {
      content = singleRuleContent
        ? (rulesContent[0]?.markdown ?? '')
        : zipSync(
            rulesContent.reduce((zippable, ruleContent) => {
              zippable[ruleContent.fileName] = new Uint8Array([...new TextEncoder().encode(ruleContent.markdown)]);
              return zippable;
            }, {} as Zippable),
          );
      blob = new Blob([content], { type: singleRuleContent ? 'text/markdown;charset=utf-8' : 'application/zip' });
      download = singleRuleContent
        ? (rulesContent[0]?.fileName ?? `${selectedEnvironment}-rules.md`)
        : `${selectedEnvironment}-rules.zip`;
    } else {
      content = rulesContent[0].markdown;
      blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      download = getFilePath().split('/').pop() || `${selectedEnvironment}-rules.md`;
    }

    const url = URL.createObjectURL(blob);
    invokeDownload({ url, download });
  };

  return (
    <Fragment>
      <button
        onClick={handleCopy}
        className={`px-3 py-1 ${
          showCopiedMessage ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        } rounded-md flex items-center transition-colors duration-200 text-sm opacity-40 hover:opacity-100 cursor-pointer`}
        aria-label="Copy"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          {showCopiedMessage ? (
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          ) : (
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          )}
          {!showCopiedMessage && (
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          )}
        </svg>
      </button>
      <button
        onClick={handleDownload}
        className="px-3 py-1 bg-indigo-700 text-white rounded-md hover:bg-indigo-600 flex items-center text-sm opacity-40 hover:opacity-100 cursor-pointer"
        aria-label="Download"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </Fragment>
  );
};

export default RulesPreviewCopyDownloadActions;
