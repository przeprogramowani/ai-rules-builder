import React from 'react';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';
import RulesPreviewCopyDownloadActions from './RulesPreviewCopyDownloadActions.tsx';
import { processRulesContentMarkdown } from '../../utils/markdownStyling.tsx';

// Component for rendering markdown content
export const MarkdownContentRenderer: React.FC<{ markdownContent: RulesContent[] }> = ({ markdownContent }) => {
  return (
    <div>
      {markdownContent.map((rule, index) => (
        <div
          key={'markdownContent-' + index}
          className="overflow-y-auto relative flex-1 p-4 mt-4 h-full min-h-0 bg-gray-900 rounded-lg"
        >
          {markdownContent.length > 1 && (
            <div className="absolute top-4 right-4 flex flex-wrap gap-2">
              <RulesPreviewCopyDownloadActions rulesContent={[rule]} />
            </div>
          )}

          <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
            {processRulesContentMarkdown(rule.markdown)}
          </pre>
        </div>
      ))}
    </div>
  );
};
