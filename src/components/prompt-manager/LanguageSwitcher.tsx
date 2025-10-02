import React from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import type { Language } from '../../services/prompt-manager/language';

export const LanguageSwitcher: React.FC = () => {
  const preferredLanguage = usePromptsStore((state) => state.preferredLanguage);
  const setPreferredLanguage = usePromptsStore((state) => state.setPreferredLanguage);

  const handleLanguageChange = (lang: Language) => {
    setPreferredLanguage(lang);
  };

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
