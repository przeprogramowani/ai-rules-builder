import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  Search,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface InviteUser {
  id: string;
  email: string;
  joinedAt: string;
  wasNewUser: boolean;
}

interface InviteStats {
  totalRedemptions: number;
  newUsers: number;
  existingUsers: number;
  users: InviteUser[];
}

interface InviteStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inviteId: string;
  inviteToken: string;
}

const InviteStatsDialog: React.FC<InviteStatsDialogProps> = ({
  isOpen,
  onClose,
  inviteId,
  inviteToken,
}) => {
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    if (isOpen && inviteId) {
      fetchStats();
    }
  }, [isOpen, inviteId]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts/admin/invites/${inviteId}/stats`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching invite stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!removingUserId) return;

    try {
      const response = await fetch(
        `/api/prompts/admin/invites/${inviteId}/users/${removingUserId}`,
        {
          method: 'DELETE',
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove user');
      }

      // Refresh stats
      await fetchStats();
      setShowRemoveConfirm(false);
      setRemovingUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
      console.error('Error removing user:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!stats?.users) return [];

    if (!searchQuery.trim()) return stats.users;

    const query = searchQuery.toLowerCase();
    return stats.users.filter((user) => user.email.toLowerCase().includes(query));
  }, [stats?.users, searchQuery]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, usersPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!isOpen) return null;

  const removingUser = stats?.users.find((u) => u.id === removingUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-gray-900 border border-gray-700 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-white">Invite Statistics</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Invite Token Display */}
        <div className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-4">
          <p className="mb-2 text-sm font-medium text-gray-300">Invite Token</p>
          <code className="block rounded bg-gray-950 p-2 text-sm text-gray-100 font-mono">
            {inviteToken}
          </code>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading statistics...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-900 bg-red-950 p-4 text-red-200">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Stats Display */}
        {stats && !isLoading && !error && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Total Redemptions */}
              <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-blue-900 to-blue-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-600 p-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-200">Total Redemptions</p>
                    <p className="text-3xl font-bold text-white">{stats.totalRedemptions}</p>
                  </div>
                </div>
              </div>

              {/* New Users */}
              <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-green-900 to-green-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-600 p-3">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-200">New Users</p>
                    <p className="text-3xl font-bold text-white">{stats.newUsers}</p>
                  </div>
                </div>
              </div>

              {/* Existing Users */}
              <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-purple-900 to-purple-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-600 p-3">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-200">Existing Users</p>
                    <p className="text-3xl font-bold text-white">{stats.existingUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Rate */}
            {stats.totalRedemptions > 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">New User Conversion Rate</p>
                    <p className="text-lg font-semibold text-white">
                      {Math.round((stats.newUsers / stats.totalRedemptions) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(stats.newUsers / stats.totalRedemptions) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Users List */}
            {stats.totalRedemptions > 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Users ({filteredUsers.length})
                  </h3>
                </div>

                {/* Search Bar */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-900 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Users Table */}
                <div className="overflow-hidden rounded-lg border border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-950">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-900">
                            <td className="px-4 py-3 text-sm text-gray-200">{user.email}</td>
                            <td className="px-4 py-3 text-sm">
                              {user.wasNewUser ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-900 px-2 py-1 text-xs font-medium text-green-200">
                                  <UserPlus className="h-3 w-3" />
                                  New User
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-900 px-2 py-1 text-xs font-medium text-purple-200">
                                  <UserCheck className="h-3 w-3" />
                                  Existing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {new Date(user.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setRemovingUserId(user.id);
                                  setShowRemoveConfirm(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-red-900 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-800 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            {searchQuery ? 'No users found matching your search' : 'No users yet'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
                    <div className="text-sm text-gray-400">
                      Showing {(currentPage - 1) * usersPerPage + 1}-
                      {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{' '}
                      {filteredUsers.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`rounded-md px-3 py-1.5 text-sm ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Redemptions State */}
            {stats.totalRedemptions === 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-gray-500" />
                <h3 className="mb-2 text-lg font-semibold text-gray-300">No Redemptions Yet</h3>
                <p className="text-gray-400">
                  This invite link hasn't been used yet. Share it to start tracking redemptions.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end border-t border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-700 px-4 py-2 text-gray-200 hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Remove User Confirmation Dialog */}
        {showRemoveConfirm && removingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-md rounded-lg bg-gray-900 border border-gray-700 p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-red-900 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-200" />
                </div>
                <h3 className="text-xl font-bold text-white">Remove User</h3>
              </div>

              <p className="mb-6 text-gray-300">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-white">{removingUser.email}</span> from the
                organization? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setRemovingUserId(null);
                  }}
                  className="rounded-md bg-gray-700 px-4 py-2 text-gray-200 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveUser}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Remove User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteStatsDialog;
