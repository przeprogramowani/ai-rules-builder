import React, { useCallback, useEffect, useState } from 'react';
import { RulesBuilderService } from '../../services/rules-builder/RulesBuilderService.ts';
import { useProjectStore } from '../../store/projectStore';
import { useTechStackStore } from '../../store/techStackStore';
import { useDependencyUpload } from '../rule-parser/useDependencyUpload';
import { RulePreviewTopbar } from './RulePreviewTopbar';
import { DependencyUpload } from './DependencyUpload.tsx';
import { MarkdownContentRenderer } from './MarkdownContentRenderer.tsx';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes.ts';

export const RulePreview: React.FC = () => {
  const { selectedLibraries } = useTechStackStore();
  const { projectName, projectDescription, isMultiFileEnvironment } = useProjectStore();
  const [markdownContent, setMarkdownContent] = useState<RulesContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadStatus, uploadDependencyFile } = useDependencyUpload();

  useEffect(() => {
    const markdowns = RulesBuilderService.generateRulesContent(
      projectName,
      projectDescription,
      selectedLibraries,
      isMultiFileEnvironment,
    );
    setMarkdownContent(markdowns);
  }, [selectedLibraries, projectName, projectDescription, isMultiFileEnvironment]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        // Check if it's a valid dependency file (json or txt)
        if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
          await uploadDependencyFile(file);
        } else {
          console.warn('Invalid file type. Please drop a package.json or requirements.txt file.');
        }
      }
    },
    [uploadDependencyFile],
  );

  return (
    <div
      className="flex overflow-y-auto relative flex-col h-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <RulePreviewTopbar rulesContent={markdownContent} />
      {/* Dropzone overlay */}
      <DependencyUpload isDragging={isDragging} uploadStatus={uploadStatus} />
      {/* Markdown content */}
      <MarkdownContentRenderer markdownContent={markdownContent} />
    </div>
  );
};

export default RulePreview;
