import type { Prompt } from '../../store/promptsStore';

export type Language = 'en' | 'pl';

/**
 * Get the localized title for a prompt, with fallback to English
 */
export const getLocalizedTitle = (prompt: Prompt, lang: Language): string => {
  return lang === 'pl' && prompt.title_pl ? prompt.title_pl : prompt.title_en;
};

/**
 * Get the localized body/content for a prompt, with fallback to English
 */
export const getLocalizedBody = (prompt: Prompt, lang: Language): string => {
  return lang === 'pl' && prompt.markdown_body_pl
    ? prompt.markdown_body_pl
    : prompt.markdown_body_en;
};

/**
 * Get the localized description for a prompt, with fallback to English
 */
export const getLocalizedDescription = (prompt: Prompt, lang: Language): string => {
  if (lang === 'pl' && prompt.description_pl) {
    return prompt.description_pl;
  }
  return prompt.description_en || '';
};

/**
 * Check if a prompt has a complete Polish translation (both title and body)
 */
export const hasPolishVersion = (prompt: Prompt): boolean => {
  return !!(prompt.title_pl?.trim() && prompt.markdown_body_pl?.trim());
};

// LocalStorage key for language preference
const LANGUAGE_PREFERENCE_KEY = 'prompt-manager:language';

/**
 * Detect browser locale and return appropriate language
 */
const detectBrowserLanguage = (): Language => {
  try {
    const browserLang = navigator.language.toLowerCase();
    // Check if Polish (pl, pl-PL, etc.)
    if (browserLang.startsWith('pl')) {
      return 'pl';
    }
    return 'en';
  } catch {
    return 'en';
  }
};

/**
 * Load language preference from localStorage, defaulting to browser locale
 */
export const loadLanguagePreference = (): Language => {
  // Return 'en' as default for SSR - will be corrected on client hydration
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    if (stored === 'pl' || stored === 'en') {
      return stored;
    }
    // No stored preference - detect from browser
    return detectBrowserLanguage();
  } catch {
    return 'en';
  }
};

/**
 * Save language preference to localStorage
 */
export const saveLanguagePreference = (lang: Language): void => {
  try {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, lang);
  } catch {
    // Fail silently if localStorage is unavailable
  }
};
