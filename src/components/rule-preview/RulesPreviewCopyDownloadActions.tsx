import { type Zippable, zipSync } from 'fflate';
import { Check, Copy, Download } from 'lucide-react';
import React, { Fragment, useState } from 'react';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';
import { useProjectStore } from '../../store/projectStore';
import { Tooltip } from '../ui/Tooltip.tsx';

interface RulesPreviewCopyDownloadActionsProps {
  rulesContent: RulesContent[];
}

export const RulesPreviewCopyDownloadActions: React.FC<RulesPreviewCopyDownloadActionsProps> = ({
  rulesContent,
}) => {
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
              zippable[ruleContent.fileName] = new Uint8Array([
                ...new TextEncoder().encode(ruleContent.markdown),
              ]);
              return zippable;
            }, {} as Zippable),
          );
      blob = new Blob([content], {
        type: singleRuleContent ? 'text/markdown;charset=utf-8' : 'application/zip',
      });
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
      <Tooltip
        content={
          showCopiedMessage ? 'Copied!' : singleRuleContent ? 'Copy to clipboard' : 'Copy all rules'
        }
        position="bottom"
      >
        <button
          onClick={handleCopy}
          className={`px-3 py-1 ${
            showCopiedMessage
              ? 'bg-green-700 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } rounded-md flex items-center transition-colors duration-200 text-sm opacity-40 hover:opacity-100 cursor-pointer`}
          aria-label="Copy"
        >
          {showCopiedMessage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </Tooltip>
      <Tooltip
        content={singleRuleContent ? 'Download file' : 'Download all rules'}
        position="bottom"
      >
        <button
          onClick={handleDownload}
          className="px-3 py-1 bg-indigo-700 text-white rounded-md hover:bg-indigo-600 flex items-center text-sm opacity-40 hover:opacity-100 cursor-pointer"
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      </Tooltip>
    </Fragment>
  );
};

export default RulesPreviewCopyDownloadActions;
