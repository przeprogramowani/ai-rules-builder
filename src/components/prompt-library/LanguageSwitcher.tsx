import React, { useState, useEffect } from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import type { Language } from '../../services/prompt-library/language';

export const LanguageSwitcher: React.FC = () => {
  const preferredLanguage = usePromptsStore((state) => state.preferredLanguage);
  const setPreferredLanguage = usePromptsStore((state) => state.setPreferredLanguage);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setPreferredLanguage(lang);
  };

  // Show skeleton during hydration
  if (!hasHydrated) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-4 w-16 bg-gray-700 rounded" />
        <div className="h-[34px] w-12 bg-gray-700 rounded-md" />
        <div className="h-[34px] w-12 bg-gray-700 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Language selector">
      <span className="text-sm text-gray-400">Language:</span>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 cursor-pointer text-base rounded-md transition-colors ${
          preferredLanguage === 'en'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        aria-pressed={preferredLanguage === 'en'}
        aria-label="English"
        title="English"
      >
        🇬🇧
      </button>
      <button
        onClick={() => handleLanguageChange('pl')}
        className={`px-3 py-1.5 cursor-pointer text-base rounded-md transition-colors ${
          preferredLanguage === 'pl'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        aria-pressed={preferredLanguage === 'pl'}
        aria-label="Polski"
        title="Polski"
      >
        🇵🇱
      </button>
    </div>
  );
};

export default LanguageSwitcher;
