import { FileUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { RulesBuilderService } from '../../services/rulesBuilderService';
import { useProjectStore } from '../../store/projectStore';
import { useTechStackStore } from '../../store/techStackStore';
import { styleMarkdownContent } from '../../utils/markdownStyling';
import { useDependencyUpload } from '../rule-parser/useDependencyUpload';
import { RulePreviewTopbar } from './RulePreviewTopbar';

export const RulePreview: React.FC = () => {
  const { selectedLibraries } = useTechStackStore();
  const { projectName, projectDescription } = useProjectStore();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const { uploadStatus, uploadDependencyFile } = useDependencyUpload();

  useEffect(() => {
    const { markdown } = RulesBuilderService.generateRulesContent(
      projectName,
      projectDescription,
      selectedLibraries,
    );

    setMarkdownContent(markdown);
  }, [selectedLibraries, projectName, projectDescription]);

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
          console.warn(
            'Invalid file type. Please drop a package.json or requirements.txt file.',
          );
        }
      }
    },
    [uploadDependencyFile],
  );

  return (
    <div
      className="flex overflow-y-auto relative flex-col h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <RulePreviewTopbar markdown={markdownContent} />

      <div className="overflow-y-auto relative flex-1 p-4 mt-4 h-full min-h-0 bg-gray-900 rounded-lg">
        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
          {styleMarkdownContent(markdownContent)}
        </pre>

        {/* Dropzone overlay that appears when dragging */}
        {isDragging && (
          <div className="flex absolute inset-0 z-10 flex-col justify-center items-center bg-gray-800 bg-opacity-80 rounded-lg border-2 border-blue-400 border-dashed">
            <FileUp className="mb-4 text-blue-400 size-12" />
            <p className="text-lg font-medium text-blue-400">
              Drop dependency file to identify libraries
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Supported: package.json, requirements.txt
            </p>
          </div>
        )}
      </div>

      {/* Upload status message */}
      {uploadStatus.message && (
        <div
          className={`text-xs mt-2 ${
            uploadStatus.success ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
};

export default RulePreview;
