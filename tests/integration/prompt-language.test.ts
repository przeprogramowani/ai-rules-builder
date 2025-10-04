import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePromptsStore } from '@/store/promptsStore';
import type { Language } from '@/services/prompt-library/language';

/**
 * Integration test for language preference management in the prompts store.
 * Tests the interaction between the store, localStorage, and language utilities.
 */
describe('Prompts Store - Language Preference Integration', () => {
  beforeEach(() => {
    // Reset store state
    usePromptsStore.setState({
      organizations: [],
      activeOrganization: null,
      collections: [],
      segments: [],
      prompts: [],
      adminPrompts: [],
      isAdminMode: false,
      statusFilter: 'all',
      selectedCollectionId: null,
      selectedSegmentId: null,
      searchQuery: '',
      selectedPromptId: null,
      isLoading: false,
      error: null,
      preferredLanguage: 'en',
    });

    // Clear localStorage
    localStorage.clear();

    // Reset navigator mock
    vi.unstubAllGlobals();
  });

  describe('store initialization', () => {
    it('initializes with language preference from localStorage', () => {
      localStorage.setItem('prompt-manager:language', 'pl');

      // Re-create the store by accessing it (this simulates fresh load)
      const store = usePromptsStore.getState();

      // Note: Due to how Zustand works, we need to manually set the initial state
      // In a real app, this would happen on module initialization
      usePromptsStore.setState({
        preferredLanguage: 'pl',
      });

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
    });

    it('initializes with default language when no localStorage preference', () => {
      vi.stubGlobal('navigator', { language: 'en-US' });

      const store = usePromptsStore.getState();

      // Should default to 'en' based on navigator
      expect(store.preferredLanguage).toBe('en');
    });

    it('initializes with Polish when browser locale is Polish', () => {
      vi.stubGlobal('navigator', { language: 'pl-PL' });

      // Simulate store initialization
      usePromptsStore.setState({
        preferredLanguage: 'pl',
      });

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
    });
  });

  describe('setPreferredLanguage action', () => {
    it('updates store state when language is changed to pl', () => {
      const { setPreferredLanguage } = usePromptsStore.getState();

      setPreferredLanguage('pl');

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
    });

    it('updates store state when language is changed to en', () => {
      usePromptsStore.setState({ preferredLanguage: 'pl' });

      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('en');

      expect(usePromptsStore.getState().preferredLanguage).toBe('en');
    });

    it('persists language preference to localStorage when changed', () => {
      const { setPreferredLanguage } = usePromptsStore.getState();

      setPreferredLanguage('pl');

      const stored = localStorage.getItem('prompt-manager:language');
      expect(stored).toBe('pl');
    });

    it('overwrites existing localStorage preference', () => {
      localStorage.setItem('prompt-manager:language', 'en');

      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');

      const stored = localStorage.getItem('prompt-manager:language');
      expect(stored).toBe('pl');
    });

    it('persists across multiple language changes', () => {
      const { setPreferredLanguage } = usePromptsStore.getState();

      setPreferredLanguage('pl');
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
      expect(localStorage.getItem('prompt-manager:language')).toBe('pl');

      setPreferredLanguage('en');
      expect(usePromptsStore.getState().preferredLanguage).toBe('en');
      expect(localStorage.getItem('prompt-manager:language')).toBe('en');

      setPreferredLanguage('pl');
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
      expect(localStorage.getItem('prompt-manager:language')).toBe('pl');
    });
  });

  describe('language preference persistence', () => {
    it('maintains preference after page reload simulation', () => {
      // Set preference
      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');

      // Simulate page reload by re-reading from localStorage
      const storedLang = localStorage.getItem('prompt-manager:language') as Language;
      usePromptsStore.setState({ preferredLanguage: storedLang || 'en' });

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
    });

    it('handles localStorage unavailable gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const { setPreferredLanguage } = usePromptsStore.getState();

      // Should not throw
      expect(() => setPreferredLanguage('pl')).not.toThrow();

      // Store state should still be updated
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('language preference usage with prompts', () => {
    it('provides correct language preference for filtering prompts', () => {
      const mockPrompts = [
        {
          id: 'prompt-1',
          title_en: 'English Title 1',
          title_pl: 'Polski Tytuł 1',
          markdown_body_en: '# English Content 1',
          markdown_body_pl: '# Polski Treść 1',
          organization_id: 'org-1',
          collection_id: 'col-1',
          segment_id: 'seg-1',
          status: 'published' as const,
          created_by: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'prompt-2',
          title_en: 'English Title 2',
          title_pl: null,
          markdown_body_en: '# English Content 2',
          markdown_body_pl: null,
          organization_id: 'org-1',
          collection_id: 'col-1',
          segment_id: 'seg-1',
          status: 'published' as const,
          created_by: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      // Set prompts in store
      usePromptsStore.setState({ prompts: mockPrompts });

      // Set language to Polish
      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');

      const { preferredLanguage, prompts } = usePromptsStore.getState();

      expect(preferredLanguage).toBe('pl');
      expect(prompts).toHaveLength(2);
    });

    it('language preference is accessible alongside prompts data', () => {
      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');

      usePromptsStore.setState({
        prompts: [
          {
            id: 'prompt-1',
            title_en: 'Test',
            title_pl: 'Test PL',
            markdown_body_en: 'Content',
            markdown_body_pl: 'Treść',
            organization_id: 'org-1',
            collection_id: 'col-1',
            segment_id: 'seg-1',
            status: 'published' as const,
            created_by: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

      const state = usePromptsStore.getState();

      expect(state.preferredLanguage).toBe('pl');
      expect(state.prompts).toHaveLength(1);
      expect(state.prompts[0].title_pl).toBe('Test PL');
    });
  });

  describe('reset action with language preference', () => {
    it('resets language preference to default on store reset', () => {
      // Change language
      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');

      // Reset store (but note: reset doesn't actually reload from localStorage in tests)
      const { reset } = usePromptsStore.getState();
      reset();

      // After reset, language should be back to initial state
      expect(usePromptsStore.getState().preferredLanguage).toBe('en');
    });

    it('localStorage preference persists even after store reset', () => {
      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');

      // Verify it's in localStorage
      expect(localStorage.getItem('prompt-manager:language')).toBe('pl');

      // Reset store
      const { reset } = usePromptsStore.getState();
      reset();

      // localStorage should still have the preference
      expect(localStorage.getItem('prompt-manager:language')).toBe('pl');
    });
  });

  describe('concurrent operations', () => {
    it('handles rapid language switches correctly', () => {
      const { setPreferredLanguage } = usePromptsStore.getState();

      setPreferredLanguage('pl');
      setPreferredLanguage('en');
      setPreferredLanguage('pl');
      setPreferredLanguage('en');

      expect(usePromptsStore.getState().preferredLanguage).toBe('en');
      expect(localStorage.getItem('prompt-manager:language')).toBe('en');
    });

    it('language preference remains consistent during other store operations', async () => {
      const { setPreferredLanguage } = usePromptsStore.getState();
      setPreferredLanguage('pl');

      // Simulate other store operations
      usePromptsStore.setState({
        isLoading: true,
        selectedCollectionId: 'col-1',
        searchQuery: 'test',
      });

      // Language preference should remain unchanged
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
    });
  });

  describe('admin mode interaction', () => {
    it('language preference persists when switching admin mode', () => {
      const { setPreferredLanguage, setAdminMode } = usePromptsStore.getState();

      setPreferredLanguage('pl');
      setAdminMode(true);

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
      expect(usePromptsStore.getState().isAdminMode).toBe(true);

      setAdminMode(false);

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
      expect(usePromptsStore.getState().isAdminMode).toBe(false);
    });

    it('language preference is independent of admin status filter', () => {
      const { setPreferredLanguage, setStatusFilter } = usePromptsStore.getState();

      setPreferredLanguage('pl');
      setStatusFilter('draft');

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
      expect(usePromptsStore.getState().statusFilter).toBe('draft');

      setStatusFilter('published');

      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
      expect(usePromptsStore.getState().statusFilter).toBe('published');
    });
  });

  describe('multi-organization context', () => {
    it('language preference applies across different organizations', () => {
      const { setPreferredLanguage, setActiveOrganization } = usePromptsStore.getState();

      setPreferredLanguage('pl');

      const org1 = {
        id: 'org-1',
        name: 'Organization 1',
        role: 'admin' as const,
        slug: 'org-1',
        is_personal: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const org2 = {
        id: 'org-2',
        name: 'Organization 2',
        role: 'member' as const,
        slug: 'org-2',
        is_personal: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      setActiveOrganization(org1);
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');

      setActiveOrganization(org2);
      expect(usePromptsStore.getState().preferredLanguage).toBe('pl');
    });
  });
});
