import React from 'react';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';
import RulesPreviewCopyDownloadActions from '../rule-preview/RulesPreviewCopyDownloadActions.tsx';

// Helper function to format JSON with proper indentation and syntax highlighting
const formatJsonWithSyntaxHighlighting = (jsonContent: string): JSX.Element => {
  try {
    // Parse and re-stringify for proper formatting
    const parsed = JSON.parse(jsonContent);
    const formatted = JSON.stringify(parsed, null, 2);

    // Basic syntax highlighting
    return (
      <code className="font-mono text-sm whitespace-pre-wrap">
        {formatted.split('\n').map((line, i) => {
          // Highlight keys in quotes
          const highlightedLine = line.replace(
            /"([^"]+)":/g,
            '<span class="text-yellow-500">"$1"</span>:',
          );

          return <div key={i} dangerouslySetInnerHTML={{ __html: highlightedLine }} />;
        })}
      </code>
    );
  } catch (e) {
    // Return error message if JSON parsing fails
    return <span className="text-red-500">Invalid JSON: {String(e)}</span>;
  }
};

// Component for rendering JSON content
export const JsonContentRenderer: React.FC<{ jsonContent: RulesContent[] }> = ({ jsonContent }) => {
  return (
    <div>
      {jsonContent.map((rule, index) => (
        <div
          key={'jsonContent-' + index}
          className="overflow-y-auto relative flex-1 p-4 mt-4 h-full min-h-0 bg-gray-900 rounded-lg"
        >
          <div className="absolute top-4 right-4 flex flex-wrap gap-2">
            <RulesPreviewCopyDownloadActions
              rulesContent={[rule]}
              filePath=".vscode/settings.json"
            />
          </div>

          <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
            {formatJsonWithSyntaxHighlighting(rule.markdown)}
          </pre>
        </div>
      ))}
    </div>
  );
};

export default JsonContentRenderer;
