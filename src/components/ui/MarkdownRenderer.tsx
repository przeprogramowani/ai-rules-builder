import React from 'react';
import { processRulesContentMarkdown } from '../../utils/markdownStyling.tsx';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  actions?: React.ReactNode;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  actions,
}) => {
  return (
    <div className={` relative  p-4 mt-4  bg-gray-900 rounded-lg ${className}`}>
      {actions && <div className="absolute top-4 right-4 flex flex-wrap gap-2">{actions}</div>}
      <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
        {processRulesContentMarkdown(content)}
      </pre>
    </div>
  );
};

export default MarkdownRenderer;
