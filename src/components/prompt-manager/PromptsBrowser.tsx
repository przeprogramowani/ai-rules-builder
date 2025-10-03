import React, { useEffect } from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { OrganizationSelector } from './OrganizationSelector';
import { PromptFilters } from './PromptFilters';
import { SearchBar } from '../ui/SearchBar';
import { PromptsList } from './PromptsList';
import { PromptDetail } from './PromptDetail';
import { LanguageSwitcher } from './LanguageSwitcher';
import { loadLanguagePreference } from '../../services/prompt-manager/language';
import { parsePromptParams, hasValidParams } from '../../utils/urlParams';

export const PromptsBrowser: React.FC = () => {
  const {
    fetchOrganizations,
    searchQuery,
    setSearchQuery,
    prompts,
    selectedPromptId,
    setPreferredLanguage,
    hydrateFromUrl,
  } = usePromptsStore();

  // Initialize - check for URL params first, otherwise normal initialization
  useEffect(() => {
    const params = parsePromptParams(new URL(window.location.href));

    if (hasValidParams(params)) {
      // Deep link mode: hydrate from URL parameters
      setPreferredLanguage(loadLanguagePreference());
      hydrateFromUrl(params).then((result) => {
        if (result.errors.length > 0) {
          // Log errors for now - can be enhanced with toast notifications later
          console.warn('[PromptsBrowser] URL hydration errors:', result.errors);
        }
      });
    } else {
      // Normal mode: standard initialization
      setPreferredLanguage(loadLanguagePreference());
      fetchOrganizations();
    }
  }, [fetchOrganizations, setPreferredLanguage, hydrateFromUrl]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Prompts Library</h1>
        <p className="text-gray-400">
          Browse and search through your organization's prompt templates
        </p>
      </div>

      {/* Organization Selector */}
      <div className="mb-6">
        <OrganizationSelector />
      </div>

      {/* Search Bar and Language Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search prompts..."
            matchCount={prompts.length}
            totalCount={prompts.length}
          />
        </div>
        <div className="flex-shrink-0">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Filters */}
      <PromptFilters />

      {/* Prompts List */}
      <PromptsList />

      {/* Prompt Detail Modal */}
      {selectedPromptId && <PromptDetail />}
    </div>
  );
};

export default PromptsBrowser;
