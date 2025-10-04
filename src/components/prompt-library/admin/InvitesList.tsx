import React, { useState } from 'react';
import { Copy, Trash2, Clock, Users, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import type { OrganizationInvite } from '../../../types/invites';
import InviteStatsDialog from './InviteStatsDialog';

interface InvitesListProps {
  invites: (OrganizationInvite & { inviteUrl: string })[];
  isLoading: boolean;
  onRevoke: (inviteId: string) => void;
}

const InvitesList: React.FC<InvitesListProps> = ({ invites, isLoading, onRevoke }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, inviteId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(inviteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (invite: OrganizationInvite) => {
    return invite.maxUses !== null && invite.currentUses >= invite.maxUses;
  };

  const handleViewStats = (inviteId: string) => {
    setSelectedInviteId(inviteId);
    setStatsDialogOpen(true);
  };

  const handleCloseStats = () => {
    setStatsDialogOpen(false);
    setSelectedInviteId(null);
  };

  const getStatusBadge = (invite: OrganizationInvite) => {
    if (!invite.isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          <XCircle className="h-3 w-3" />
          Revoked
        </span>
      );
    }
    if (isExpired(invite.expiresAt)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          <Clock className="h-3 w-3" />
          Expired
        </span>
      );
    }
    if (isMaxedOut(invite)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
          <Users className="h-3 w-3" />
          Max Uses
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
        <p className="text-gray-400">Loading invites...</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
        <h3 className="mb-2 text-lg font-semibold text-white">No Invites Yet</h3>
        <p className="text-gray-400">Create your first invite link to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Invite Link
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Usage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Expires
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-800">
          {invites.map((invite) => (
            <tr key={invite.id} className="hover:bg-gray-750">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <code className="max-w-xs truncate rounded bg-gray-900 px-2 py-1 text-xs text-gray-300">
                    {invite.inviteUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(invite.inviteUrl, invite.id)}
                    className="rounded p-1 hover:bg-gray-700"
                    title="Copy to clipboard"
                  >
                    {copiedId === invite.id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-6 py-4">{getStatusBadge(invite)}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    invite.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {invite.role}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {invite.currentUses}
                {invite.maxUses !== null ? ` / ${invite.maxUses}` : ' / ∞'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">{formatDate(invite.expiresAt)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewStats(invite.id)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    title="View statistics"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Stats
                  </button>
                  <button
                    onClick={() => onRevoke(invite.id)}
                    disabled={!invite.isActive}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Revoke invite"
                  >
                    <Trash2 className="h-4 w-4" />
                    Revoke
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stats Dialog */}
      {selectedInviteId && (
        <InviteStatsDialog
          isOpen={statsDialogOpen}
          onClose={handleCloseStats}
          inviteId={selectedInviteId}
          inviteToken={invites.find((i) => i.id === selectedInviteId)?.token || ''}
        />
      )}
    </div>
  );
};

export default InvitesList;
