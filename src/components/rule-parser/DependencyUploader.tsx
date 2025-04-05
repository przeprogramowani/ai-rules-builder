import { Upload } from 'lucide-react';
import { useDependencyUpload } from './useDependencyUpload';

export default function DependencyUploader() {
  const { isUploading, uploadStatus, uploadDependencyFile } = useDependencyUpload();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (file) {
      await uploadDependencyFile(file);
      // Reset the form
      form.reset();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Automatically submit the form when a file is selected
      const form = event.target.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="flex items-center justify-center sm:justify-start">
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex items-center">
        <label
          htmlFor="file-upload"
          className={`
            flex items-center justify-center px-3 py-1.5 rounded-md
            bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm
            transition-colors duration-200 cursor-pointer
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label="Upload dependencies file"
        >
          <Upload className="size-4" />
          <span className="hidden md:inline md:ml-2">
            {isUploading ? 'Uploading...' : 'Upload from deps'}
          </span>
          <input
            id="file-upload"
            name="file"
            type="file"
            accept=".json,.txt"
            disabled={isUploading}
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <button type="submit" disabled={isUploading} className="hidden">
          Upload
        </button>
      </form>

      {uploadStatus.message && (
        <div
          className={`text-xs ml-2 ${uploadStatus.success ? 'text-green-400' : 'text-red-400'} hidden md:block`}
        >
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
}
