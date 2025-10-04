import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { InviteValidationResult } from '../../types/invites';

interface InviteLandingProps {
  token: string;
  isAuthenticated: boolean;
}

const InviteLanding: React.FC<InviteLandingProps> = ({ token, isAuthenticated }) => {
  const [validation, setValidation] = useState<InviteValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      setValidation(result);
    } catch {
      setValidation({
        valid: false,
        error: 'Failed to validate invite. Please try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!validation?.valid) return;

    setIsRedeeming(true);
    setRedemptionError(null);

    try {
      const response = await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to join organization');
      }

      // Redirect to prompts page for the organization
      if (result.organization?.slug) {
        window.location.href = `/prompts?organization=${result.organization.slug}`;
      } else {
        window.location.href = '/prompts';
      }
    } catch (err) {
      setRedemptionError(err instanceof Error ? err.message : 'Failed to join organization');
      setIsRedeeming(false);
    }
  };

  const handleSignup = () => {
    // Redirect to signup with invite token
    window.location.href = `/auth/signup?invite=${encodeURIComponent(token)}`;
  };

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-8 text-center shadow-lg">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
          <h2 className="mb-2 text-xl font-semibold text-white">Validating Invite...</h2>
          <p className="text-gray-300">Please wait while we check your invite link.</p>
        </div>
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-red-800 bg-gray-800 p-8 text-center shadow-lg">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-white">Invalid Invite</h2>
          <p className="mb-4 text-red-300">{validation?.error}</p>
          <a
            href="/"
            className="inline-block rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const { organization } = validation;

  if (isAuthenticated) {
    // User is logged in - show join button
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
          <div className="mb-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold text-white">Join Organization</h2>
            <p className="text-gray-300">
              You've been invited to join{' '}
              <strong className="text-white">{organization?.name}</strong>
            </p>
          </div>

          {redemptionError && (
            <div className="mb-4 rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-300">
              {redemptionError}
            </div>
          )}

          <button
            onClick={handleRedeem}
            disabled={isRedeeming}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isRedeeming ? 'Joining...' : `Join ${organization?.name}`}
          </button>

          <p className="mt-4 text-center text-sm text-gray-400">
            You will be granted <strong className="text-white">{validation.invite?.role}</strong>{' '}
            access.
          </p>
        </div>
      </div>
    );
  }

  // User is not logged in - show signup prompt
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
        <div className="mb-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-white">You're Invited!</h2>
          <p className="text-gray-300">
            You've been invited to join <strong className="text-white">{organization?.name}</strong>
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-blue-900/30 p-4 border border-blue-800">
          <h3 className="mb-2 font-semibold text-blue-200">What happens next?</h3>
          <ul className="space-y-2 text-sm text-blue-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Create your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Automatically join {organization?.name}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Start collaborating with the team</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleSignup}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          Sign Up and Join
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a
            href={`/auth/login?invite=${encodeURIComponent(token)}`}
            className="text-blue-400 hover:underline"
          >
            Log in
          </a>
        </p>

        <p className="mt-4 text-center text-xs text-gray-500">
          You will be granted <strong className="text-gray-300">{validation.invite?.role}</strong>{' '}
          access.
        </p>
      </div>
    </div>
  );
};

export default InviteLanding;
