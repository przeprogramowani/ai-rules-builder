import { FileUp } from 'lucide-react';
import React, { Fragment } from 'react';

import type { UploadStatus } from '../rule-parser/useDependencyUpload.ts';

// Component for the dependency dropzone overlay
export const DependencyUpload: React.FC<{ uploadStatus: UploadStatus; isDragging: boolean }> = ({
  uploadStatus,
  isDragging,
}) => {
  if (!isDragging) return null;

  return (
    <Fragment>
      <div className="flex absolute inset-0 z-10 flex-col justify-center items-center bg-gray-800 bg-opacity-80 rounded-lg border-2 border-blue-400 border-dashed">
        <FileUp className="mb-4 text-blue-400 size-12" />
        <p className="text-lg font-medium text-blue-400">Drop dependency file to identify libraries</p>
        <p className="mt-2 text-sm text-gray-400">Supported: package.json, requirements.txt</p>
      </div>
      {/* Upload status message */}
      {uploadStatus.message && (
        <div className={`text-xs mt-2 ${uploadStatus.success ? 'text-green-400' : 'text-red-400'}`}>
          {uploadStatus.message}
        </div>
      )}
    </Fragment>
  );
};
