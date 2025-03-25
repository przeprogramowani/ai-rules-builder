import { useState, useEffect } from 'react';
import { useTechStackStore } from '../../store/techStackStore';
import { Library } from '../../data/dictionaries';

export interface UploadStatus {
  success?: boolean;
  message?: string;
}

export function useDependencyUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const { selectLibrary } = useTechStackStore();

  // Effect to clear the message after 5 seconds
  useEffect(() => {
    if (uploadStatus.message) {
      const timer = setTimeout(() => {
        setUploadStatus({});
      }, 5000);

      // Cleanup timer on component unmount or when message changes
      return () => clearTimeout(timer);
    }
  }, [uploadStatus.message]);

  const uploadDependencyFile = async (file: File) => {
    if (!file) {
      setUploadStatus({
        success: false,
        message: 'Please select a file',
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus({});

      console.log('Uploading file:', file.name, file.type, file.size);

      const formData = new FormData();
      formData.set('file', file);

      const response = await fetch('/api/upload-dependencies', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      // Update the tech stack store with identified libraries
      if (data.libraries && Array.isArray(data.libraries)) {
        data.libraries.forEach((lib: Library) => {
          selectLibrary(lib);
        });

        setUploadStatus({
          success: true,
          message: `Found ${data.mappedLibraries} libraries from ${data.identifiedDependencies} dependencies`,
        });
      } else {
        setUploadStatus({
          success: true,
          message: 'No libraries were identified in the file',
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process file',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadStatus,
    uploadDependencyFile,
  };
}
