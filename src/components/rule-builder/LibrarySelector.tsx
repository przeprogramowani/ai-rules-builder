import React from 'react';
import { Stack, Library, getLibrariesByStack } from '../../data/dictionaries';
import { useTechStackStore } from '../../store/techStackStore';

interface LibrarySelectorProps {
  selectedStack: Stack;
  onBackToStacks: () => void;
}

export const LibrarySelector: React.FC<LibrarySelectorProps> = ({
  selectedStack,
  onBackToStacks,
}) => {
  const { selectLibrary, unselectLibrary, isLibrarySelected } = useTechStackStore();

  // Get libraries for the selected stack
  const libraries = getLibrariesByStack(selectedStack);

  const handleLibraryToggle = (library: Library) => {
    if (isLibrarySelected(library)) {
      unselectLibrary(library);
    } else {
      selectLibrary(library);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <button
          onClick={onBackToStacks}
          className="mr-2 p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-white">Select tools</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {libraries.map((library) => (
          <div
            key={library}
            className={`p-4 rounded-lg transition-colors ${
              isLibrarySelected(library) ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{library}</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLibrarySelected(library)}
                  onChange={() => handleLibraryToggle(library)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibrarySelector;
