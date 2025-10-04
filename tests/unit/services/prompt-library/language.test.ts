import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLocalizedTitle,
  getLocalizedBody,
  hasPolishVersion,
  loadLanguagePreference,
  saveLanguagePreference,
  type Language,
} from '@/services/prompt-library/language';
import type { Prompt } from '@/store/promptsStore';

describe('language utilities', () => {
  describe('getLocalizedTitle', () => {
    it('returns Polish title when available and lang is pl', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: 'Polski Tytuł',
      } as Prompt;

      const result = getLocalizedTitle(prompt as Prompt, 'pl');

      expect(result).toBe('Polski Tytuł');
    });

    it('falls back to English title when Polish title is null', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: null,
      } as Prompt;

      const result = getLocalizedTitle(prompt as Prompt, 'pl');

      expect(result).toBe('English Title');
    });

    it('falls back to English title when Polish title is undefined', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: undefined,
      } as Prompt;

      const result = getLocalizedTitle(prompt as Prompt, 'pl');

      expect(result).toBe('English Title');
    });

    it('falls back to English title when Polish title is empty string', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: '',
      } as Prompt;

      const result = getLocalizedTitle(prompt as Prompt, 'pl');

      expect(result).toBe('English Title');
    });

    it('returns English title when lang is en', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: 'Polski Tytuł',
      } as Prompt;

      const result = getLocalizedTitle(prompt as Prompt, 'en');

      expect(result).toBe('English Title');
    });

    it('returns English title when lang is en and Polish is null', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: null,
      } as Prompt;

      const result = getLocalizedTitle(prompt as Prompt, 'en');

      expect(result).toBe('English Title');
    });
  });

  describe('getLocalizedBody', () => {
    it('returns Polish body when available and lang is pl', () => {
      const prompt: Partial<Prompt> = {
        markdown_body_en: '# English Content',
        markdown_body_pl: '# Polski Treść',
      } as Prompt;

      const result = getLocalizedBody(prompt as Prompt, 'pl');

      expect(result).toBe('# Polski Treść');
    });

    it('falls back to English body when Polish body is null', () => {
      const prompt: Partial<Prompt> = {
        markdown_body_en: '# English Content',
        markdown_body_pl: null,
      } as Prompt;

      const result = getLocalizedBody(prompt as Prompt, 'pl');

      expect(result).toBe('# English Content');
    });

    it('falls back to English body when Polish body is undefined', () => {
      const prompt: Partial<Prompt> = {
        markdown_body_en: '# English Content',
        markdown_body_pl: undefined,
      } as Prompt;

      const result = getLocalizedBody(prompt as Prompt, 'pl');

      expect(result).toBe('# English Content');
    });

    it('falls back to English body when Polish body is empty string', () => {
      const prompt: Partial<Prompt> = {
        markdown_body_en: '# English Content',
        markdown_body_pl: '',
      } as Prompt;

      const result = getLocalizedBody(prompt as Prompt, 'pl');

      expect(result).toBe('# English Content');
    });

    it('returns English body when lang is en', () => {
      const prompt: Partial<Prompt> = {
        markdown_body_en: '# English Content',
        markdown_body_pl: '# Polski Treść',
      } as Prompt;

      const result = getLocalizedBody(prompt as Prompt, 'en');

      expect(result).toBe('# English Content');
    });

    it('returns English body when lang is en and Polish is null', () => {
      const prompt: Partial<Prompt> = {
        markdown_body_en: '# English Content',
        markdown_body_pl: null,
      } as Prompt;

      const result = getLocalizedBody(prompt as Prompt, 'en');

      expect(result).toBe('# English Content');
    });
  });

  describe('hasPolishVersion', () => {
    it('returns true when both title_pl and markdown_body_pl are present', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: 'Polski Tytuł',
        markdown_body_en: '# English Content',
        markdown_body_pl: '# Polski Treść',
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(true);
    });

    it('returns false when title_pl is null', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: null,
        markdown_body_en: '# English Content',
        markdown_body_pl: '# Polski Treść',
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });

    it('returns false when markdown_body_pl is null', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: 'Polski Tytuł',
        markdown_body_en: '# English Content',
        markdown_body_pl: null,
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });

    it('returns false when both are null', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: null,
        markdown_body_en: '# English Content',
        markdown_body_pl: null,
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });

    it('returns false when title_pl is empty string', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: '',
        markdown_body_en: '# English Content',
        markdown_body_pl: '# Polski Treść',
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });

    it('returns false when markdown_body_pl is empty string', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: 'Polski Tytuł',
        markdown_body_en: '# English Content',
        markdown_body_pl: '',
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });

    it('returns false when title_pl has only whitespace', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: '   ',
        markdown_body_en: '# English Content',
        markdown_body_pl: '# Polski Treść',
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });

    it('returns false when markdown_body_pl has only whitespace', () => {
      const prompt: Partial<Prompt> = {
        title_en: 'English Title',
        title_pl: 'Polski Tytuł',
        markdown_body_en: '# English Content',
        markdown_body_pl: '   \n\t  ',
      } as Prompt;

      const result = hasPolishVersion(prompt as Prompt);

      expect(result).toBe(false);
    });
  });

  describe('loadLanguagePreference', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
      // Reset navigator.language mock
      vi.unstubAllGlobals();
    });

    it('returns stored preference when it exists (en)', () => {
      localStorage.setItem('prompt-manager:language', 'en');

      const result = loadLanguagePreference();

      expect(result).toBe('en');
    });

    it('returns stored preference when it exists (pl)', () => {
      localStorage.setItem('prompt-manager:language', 'pl');

      const result = loadLanguagePreference();

      expect(result).toBe('pl');
    });

    it('defaults to en when stored value is invalid', () => {
      localStorage.setItem('prompt-manager:language', 'invalid');

      const result = loadLanguagePreference();

      expect(result).toBe('en');
    });

    it('detects Polish from browser locale when no stored preference', () => {
      vi.stubGlobal('navigator', {
        language: 'pl-PL',
      });

      const result = loadLanguagePreference();

      expect(result).toBe('pl');
    });

    it('detects Polish from browser locale with lowercase pl', () => {
      vi.stubGlobal('navigator', {
        language: 'pl',
      });

      const result = loadLanguagePreference();

      expect(result).toBe('pl');
    });

    it('defaults to en for non-Polish browser locale', () => {
      vi.stubGlobal('navigator', {
        language: 'en-US',
      });

      const result = loadLanguagePreference();

      expect(result).toBe('en');
    });

    it('defaults to en for German browser locale', () => {
      vi.stubGlobal('navigator', {
        language: 'de-DE',
      });

      const result = loadLanguagePreference();

      expect(result).toBe('en');
    });

    it('defaults to en when localStorage throws error', () => {
      // Mock localStorage to throw an error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = loadLanguagePreference();

      expect(result).toBe('en');

      // Restore original
      localStorage.getItem = originalGetItem;
    });

    it('defaults to en when navigator.language throws error', () => {
      // Mock navigator to throw an error
      vi.stubGlobal('navigator', {
        get language() {
          throw new Error('navigator.language not available');
        },
      });

      const result = loadLanguagePreference();

      expect(result).toBe('en');
    });
  });

  describe('saveLanguagePreference', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('saves en preference to localStorage', () => {
      saveLanguagePreference('en');

      const stored = localStorage.getItem('prompt-manager:language');
      expect(stored).toBe('en');
    });

    it('saves pl preference to localStorage', () => {
      saveLanguagePreference('pl');

      const stored = localStorage.getItem('prompt-manager:language');
      expect(stored).toBe('pl');
    });

    it('overwrites existing preference', () => {
      localStorage.setItem('prompt-manager:language', 'en');

      saveLanguagePreference('pl');

      const stored = localStorage.getItem('prompt-manager:language');
      expect(stored).toBe('pl');
    });

    it('fails silently when localStorage throws error', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Should not throw
      expect(() => saveLanguagePreference('en')).not.toThrow();

      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('localStorage integration', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loads and saves work together', () => {
      // Initially no preference
      vi.stubGlobal('navigator', { language: 'en-US' });
      expect(loadLanguagePreference()).toBe('en');

      // Save a preference
      saveLanguagePreference('pl');

      // Load should return the saved preference
      expect(loadLanguagePreference()).toBe('pl');
    });

    it('preference persists across multiple loads', () => {
      saveLanguagePreference('pl');

      expect(loadLanguagePreference()).toBe('pl');
      expect(loadLanguagePreference()).toBe('pl');
      expect(loadLanguagePreference()).toBe('pl');
    });
  });
});
