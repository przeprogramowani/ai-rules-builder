import { ExternalLink, Upload } from 'lucide-react';
import React from 'react';
import { aiEnvironmentConfig } from '../../data/ai-environments.ts';
import { useProjectStore } from '../../store/projectStore';
import { useDependencyUpload } from '../rule-parser/useDependencyUpload';
import Tooltip from '../ui/Tooltip.tsx';

export const RulesPreviewActions: React.FC<unknown> = () => {
  const { selectedEnvironment } = useProjectStore();
  const { isUploading, uploadStatus, uploadDependencyFile } = useDependencyUpload();

  const config = aiEnvironmentConfig[selectedEnvironment];
  if (!config) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadDependencyFile(file);
      // Reset the input
      event.target.value = '';
    }
  };

  const getUploadTooltipContent = () => {
    if (uploadStatus.message) {
      return uploadStatus.message;
    }
    return isUploading ? 'Uploading dependencies...' : 'Upload dependencies file';
  };

  return (
    <>
      <Tooltip content={getUploadTooltipContent()} position="bottom">
        <label
          htmlFor="file-upload-preview"
          className={`px-3 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-600 flex items-center text-sm opacity-40 hover:opacity-100 ${
            isUploading ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          aria-label="Upload dependencies file"
        >
          <Upload className="h-4 w-4" />
          <input
            id="file-upload-preview"
            type="file"
            accept=".json,.txt"
            disabled={isUploading}
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </Tooltip>

      <Tooltip content={`Open documentation for ${config.displayName}`} position="bottom">
        <a
          href={config.docsUrl}
          target="_blank"
          className="px-3 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-600 flex items-center text-sm opacity-40 hover:opacity-100 cursor-pointer"
          aria-label={`Open documentation for ${config.displayName}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </Tooltip>
    </>
  );
};

export default RulesPreviewActions;
