import React, { useEffect } from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { OrganizationSelector } from './OrganizationSelector';
import { PromptFilters } from './PromptFilters';
import { SearchBar } from '../ui/SearchBar';
import { PromptsList } from './PromptsList';
import { PromptDetail } from './PromptDetail';

export const PromptsBrowser: React.FC = () => {
  const { fetchOrganizations, searchQuery, setSearchQuery, prompts, selectedPromptId } =
    usePromptsStore();

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

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
      <OrganizationSelector />

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search prompts..."
          matchCount={prompts.length}
          totalCount={prompts.length}
        />
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
