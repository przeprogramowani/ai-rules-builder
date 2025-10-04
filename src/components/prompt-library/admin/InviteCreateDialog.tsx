import React, { useState } from 'react';
import { X } from 'lucide-react';

interface InviteCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    expiresInDays: number;
    maxUses?: number;
    role: 'member' | 'admin';
  }) => Promise<void>;
}

const InviteCreateDialog: React.FC<InviteCreateDialogProps> = ({ isOpen, onClose, onCreate }) => {
  const [expirationPreset, setExpirationPreset] = useState<'7' | '30' | '90' | 'custom'>('7');
  const [customDays, setCustomDays] = useState('');
  const [maxUsesPreset, setMaxUsesPreset] = useState<'unlimited' | '10' | '50' | '100' | 'custom'>(
    'unlimited',
  );
  const [customMaxUses, setCustomMaxUses] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Calculate expiration days
    let expiresInDays: number;
    if (expirationPreset === 'custom') {
      expiresInDays = parseInt(customDays, 10);
      if (isNaN(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
        setError('Custom expiration must be between 1 and 365 days');
        return;
      }
    } else {
      expiresInDays = parseInt(expirationPreset, 10);
    }

    // Calculate max uses
    let maxUses: number | undefined;
    if (maxUsesPreset === 'unlimited') {
      maxUses = undefined;
    } else if (maxUsesPreset === 'custom') {
      const parsed = parseInt(customMaxUses, 10);
      if (isNaN(parsed) || parsed < 1) {
        setError('Custom max uses must be at least 1');
        return;
      }
      maxUses = parsed;
    } else {
      maxUses = parseInt(maxUsesPreset, 10);
    }

    setIsSubmitting(true);

    try {
      await onCreate({ expiresInDays, maxUses, role });
      // Reset form
      setExpirationPreset('7');
      setCustomDays('');
      setMaxUsesPreset('unlimited');
      setCustomMaxUses('');
      setRole('member');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create Invite Link</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expiration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Expiration</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                {['7', '30', '90'].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExpirationPreset(days as '7' | '30' | '90')}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                      expirationPreset === days
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpirationPreset('custom')}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    expirationPreset === 'custom'
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Custom
                </button>
                {expirationPreset === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Days (1-365)"
                    className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Max Uses */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Maximum Uses</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                {['unlimited', '10', '50', '100'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMaxUsesPreset(preset as 'unlimited' | '10' | '50' | '100')}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                      maxUsesPreset === preset
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset === 'unlimited' ? '∞' : preset}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMaxUsesPreset('custom')}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    maxUsesPreset === 'custom'
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Custom
                </button>
                {maxUsesPreset === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    value={customMaxUses}
                    onChange={(e) => setCustomMaxUses(e.target.value)}
                    placeholder="Max uses"
                    className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Default Role</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex-1 rounded-md border px-4 py-2 ${
                  role === 'member'
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 rounded-md border px-4 py-2 ${
                  role === 'admin'
                    ? 'border-purple-500 bg-purple-600 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Admin
              </button>
            </div>
            {role === 'admin' && (
              <p className="mt-2 text-xs text-orange-400">
                ⚠️ Warning: Admin invites grant full administrative access to the organization.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteCreateDialog;
