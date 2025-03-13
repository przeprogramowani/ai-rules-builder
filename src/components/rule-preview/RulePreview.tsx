import React, { useState, useEffect } from 'react';
import { useTechStackStore } from '../../store/techStackStore';
import { useProjectStore } from '../../store/projectStore';
import RulePreviewControls from './RulePreviewControls';
import { RulesBuilderService } from '../../services/rulesBuilderService';

export const RulePreview: React.FC = () => {
  const { selectedLibraries } = useTechStackStore();
  const { projectName, projectDescription } = useProjectStore();
  const [markdownContent, setMarkdownContent] = useState<string>('');

  // Generate markdown content when libraries or project metadata changes
  useEffect(() => {
    const { markdown } = RulesBuilderService.generateRulesContent(
      projectName,
      projectDescription,
      selectedLibraries
    );
    
    setMarkdownContent(markdown);
  }, [selectedLibraries, projectName, projectDescription]);

  return (
    <div className="flex flex-col">
      <RulePreviewControls markdown={markdownContent} />

      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-4 mt-4">
        <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
          {markdownContent}
        </pre>
      </div>
    </div>
  );
};

export default RulePreview;
