import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import OrganizationSelector from '../OrganizationSelector';
import InvitesList from './InvitesList';
import InviteCreateDialog from './InviteCreateDialog';
import { usePromptsStore } from '../../../store/promptsStore';
import type { OrganizationInvite } from '../../../types/invites';
import AdminTabs from './AdminTabs';

export const InvitesAdminPanel: React.FC = () => {
  const activeOrganization = usePromptsStore((state) => state.activeOrganization);
  const fetchOrganizations = usePromptsStore((state) => state.fetchOrganizations);

  const [invites, setInvites] = useState<(OrganizationInvite & { inviteUrl: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Initialize and fetch organizations
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Fetch invites when organization changes
  useEffect(() => {
    if (activeOrganization?.id) {
      fetchInvites();
    }
  }, [activeOrganization]);

  const fetchInvites = async () => {
    if (!activeOrganization?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/prompts/admin/invites?organizationId=${activeOrganization.id}`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch invites');
      }

      setInvites(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invites');
      console.error('Error fetching invites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async (params: {
    expiresInDays: number;
    maxUses?: number;
    role: 'member' | 'admin';
  }) => {
    const response = await fetch('/api/prompts/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create invite');
    }

    setIsCreateDialogOpen(false);
    await fetchInvites(); // Refresh list
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/admin/invites/${inviteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke invite');
      }

      await fetchInvites(); // Refresh list
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to revoke invite'}`);
      console.error('Error revoking invite:', err);
    }
  };

  if (!activeOrganization) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">
            {isLoading ? 'Loading organizations...' : 'Please select an organization to continue'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-gray-400">Manage your organization's prompts and invites</p>
      </div>

      {/* Admin Tabs */}
      <AdminTabs activeTab="invites" />

      {/* Organization Selector */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Invite Management</h2>
        <OrganizationSelector />
      </div>
      <p className="text-gray-400 mb-6">
        Create and manage organization invite links for {activeOrganization.name}
      </p>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-5 w-5" />
          Create Invite Link
        </button>

        <button
          onClick={fetchInvites}
          disabled={isLoading}
          className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Invites List */}
      <InvitesList invites={invites} isLoading={isLoading} onRevoke={handleRevokeInvite} />

      {/* Create Invite Dialog */}
      <InviteCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={handleCreateInvite}
      />
    </div>
  );
};

export default InvitesAdminPanel;
