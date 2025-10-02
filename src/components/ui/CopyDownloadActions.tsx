import { Check, Copy, Download } from 'lucide-react';
import React, { Fragment, useState } from 'react';
import { Tooltip } from './Tooltip.tsx';

interface CopyDownloadActionsProps {
  content: string;
  filename: string;
  onCopy?: () => void;
  onDownload?: () => void;
  showCopied?: boolean;
  className?: string;
}

export const CopyDownloadActions: React.FC<CopyDownloadActionsProps> = ({
  content,
  filename,
  onCopy,
  onDownload,
  showCopied: externalShowCopied,
  className = '',
}) => {
  const [internalShowCopied, setInternalShowCopied] = useState(false);
  const showCopied = externalShowCopied ?? internalShowCopied;

  // Copy the content to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setInternalShowCopied(true);
      setTimeout(() => setInternalShowCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setInternalShowCopied(true);
          setTimeout(() => setInternalShowCopied(false), 2000);
          onCopy?.();
        }
      } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
      }

      document.body.removeChild(textArea);
    }
  };

  // Download the content as a file
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  return (
    <Fragment>
      <div className={`flex gap-2 ${className}`}>
        <Tooltip content={showCopied ? 'Copied!' : 'Copy to clipboard'} position="bottom">
          <button
            onClick={handleCopy}
            className={`px-3 py-1 ${
              showCopied ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } rounded-md flex items-center transition-colors duration-200 text-sm opacity-40 hover:opacity-100 cursor-pointer`}
            aria-label="Copy"
          >
            {showCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </Tooltip>
        <Tooltip content="Download file" position="bottom">
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-indigo-700 text-white rounded-md hover:bg-indigo-600 flex items-center text-sm opacity-40 hover:opacity-100 cursor-pointer"
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </Fragment>
  );
};

export default CopyDownloadActions;
