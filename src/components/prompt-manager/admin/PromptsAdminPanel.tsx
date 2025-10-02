import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { usePromptsStore } from '../../../store/promptsStore';
import type { Prompt, CreatePromptInput, UpdatePromptInput } from '../../../store/promptsStore';
import OrganizationSelector from '../OrganizationSelector';
import AdminPromptsList from './AdminPromptsList';
import PromptEditorDialog from './PromptEditorDialog';
import DeletionDialog from '../../rule-collections/DeletionDialog';
import { Dropdown } from '../../ui/Dropdown';
import { SearchBar } from '../../ui/SearchBar';

export const PromptsAdminPanel: React.FC = () => {
  // Store state - using individual selectors for better type safety
  const adminPrompts = usePromptsStore((state) => state.adminPrompts ?? []);
  const isLoading = usePromptsStore((state) => state.isLoading);
  const error = usePromptsStore((state) => state.error);
  const activeOrganization = usePromptsStore((state) => state.activeOrganization);
  const collections = usePromptsStore((state) => state.collections ?? []);
  const segments = usePromptsStore((state) => state.segments ?? []);
  const statusFilter = usePromptsStore((state) => state.statusFilter);
  const selectedPromptId = usePromptsStore((state) => state.selectedPromptId);
  const searchQuery = usePromptsStore((state) => state.searchQuery);

  // Actions
  const fetchOrganizations = usePromptsStore((state) => state.fetchOrganizations);
  const fetchAdminPrompts = usePromptsStore((state) => state.fetchAdminPrompts);
  const fetchSegments = usePromptsStore((state) => state.fetchSegments);
  const createPrompt = usePromptsStore((state) => state.createPrompt);
  const updatePrompt = usePromptsStore((state) => state.updatePrompt);
  const deletePrompt = usePromptsStore((state) => state.deletePrompt);
  const togglePublishStatus = usePromptsStore((state) => state.togglePublishStatus);
  const setStatusFilter = usePromptsStore((state) => state.setStatusFilter);
  const setAdminMode = usePromptsStore((state) => state.setAdminMode);
  const setSearchQuery = usePromptsStore((state) => state.setSearchQuery);

  // Local state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Initialize admin mode
  useEffect(() => {
    setAdminMode(true);
    fetchOrganizations();

    return () => {
      setAdminMode(false);
    };
  }, [setAdminMode, fetchOrganizations]);

  // Fetch admin prompts when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchAdminPrompts();
    }
  }, [activeOrganization, fetchAdminPrompts]);

  // Fetch all segments for the active organization (in parallel for better performance)
  useEffect(() => {
    const loadAllSegments = async () => {
      await Promise.all(collections.map((collection) => fetchSegments(collection.id)));
    };

    if (collections.length > 0) {
      loadAllSegments();
    }
  }, [collections, fetchSegments]);

  // Create collection options with "All" option
  const collectionOptions = useMemo(
    () => [
      { value: null, label: 'All Collections' },
      ...collections.map((collection) => ({
        value: collection.id,
        label: collection.title,
      })),
    ],
    [collections],
  );

  // Create segment options with "All" option (only show when a collection is selected)
  const segmentOptions = useMemo(
    () => [
      { value: null, label: 'All Segments' },
      ...segments
        .filter((segment) => segment.collection_id === selectedCollectionId)
        .map((segment) => ({
          value: segment.id,
          label: segment.title,
        })),
    ],
    [segments, selectedCollectionId],
  );

  const handleCollectionChange = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
    setSelectedSegmentId(null); // Reset segment when collection changes
  };

  const handleSegmentChange = (segmentId: string | null) => {
    setSelectedSegmentId(segmentId);
  };

  // Filter prompts based on selected collection and segment
  const filteredPrompts = useMemo(() => {
    return adminPrompts.filter((prompt) => {
      // Filter by collection
      if (selectedCollectionId && prompt.collection_id !== selectedCollectionId) {
        return false;
      }
      // Filter by segment
      if (selectedSegmentId && prompt.segment_id !== selectedSegmentId) {
        return false;
      }
      return true;
    });
  }, [adminPrompts, selectedCollectionId, selectedSegmentId]);

  // Handlers
  const handleCreateNew = () => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleDelete = (promptId: string) => {
    setDeletingPromptId(promptId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingPromptId) {
      try {
        await deletePrompt(deletingPromptId);
        setIsDeleteDialogOpen(false);
        setDeletingPromptId(null);
      } catch (error) {
        console.error('Error deleting prompt:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPromptId(null);
  };

  const handleSave = async (data: CreatePromptInput | UpdatePromptInput) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, data);
    } else {
      await createPrompt(data as CreatePromptInput);
    }
    setIsEditorOpen(false);
    setEditingPrompt(null);
  };

  const handleTogglePublish = async (promptId: string) => {
    await togglePublishStatus(promptId);
  };

  // Status filter options
  const statusFilterOptions = [
    { value: 'all', label: 'All Prompts' },
    { value: 'draft', label: 'Drafts Only' },
    { value: 'published', label: 'Published Only' },
  ];

  // Get the prompt being deleted for the dialog
  const deletingPrompt = adminPrompts.find((p) => p.id === deletingPromptId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Prompts Admin Panel</h1>
        <p className="text-gray-400">Manage your organization's prompt templates</p>
      </div>

      {/* Organization Selector and Create Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <OrganizationSelector />
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-4" />
          Create New Prompt
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search prompts..."
          matchCount={adminPrompts.length}
          totalCount={adminPrompts.length}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="min-w-[200px]">
          <Dropdown
            label="Status"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as 'all' | 'draft' | 'published')}
          />
        </div>

        <div className="min-w-[200px]">
          <Dropdown
            label="Collection"
            options={collectionOptions}
            value={selectedCollectionId}
            onChange={handleCollectionChange}
            placeholder="Select collection"
          />
        </div>

        {selectedCollectionId && segments.length > 0 && (
          <div className="min-w-[200px]">
            <Dropdown
              label="Segment"
              options={segmentOptions}
              value={selectedSegmentId}
              onChange={handleSegmentChange}
              placeholder="Select segment"
            />
          </div>
        )}

        <div className="text-sm text-gray-400 ml-auto">
          <span>
            {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      {activeOrganization ? (
        <AdminPromptsList
          prompts={filteredPrompts}
          collections={collections}
          segments={segments}
          isLoading={isLoading}
          error={error}
          selectedPromptId={selectedPromptId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
        />
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">
            {isLoading ? 'Loading organizations...' : 'Please select an organization to continue'}
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      <PromptEditorDialog
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSave}
        initialData={editingPrompt || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DeletionDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={deletingPrompt?.title || 'this prompt'}
        title="Delete Prompt"
      />
    </div>
  );
};

export default PromptsAdminPanel;
