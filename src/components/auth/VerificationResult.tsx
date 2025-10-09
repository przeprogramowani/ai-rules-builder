import React, { useState } from 'react';
import { transitions } from '../../styles/theme';
import { ResendVerificationButton } from './ResendVerificationButton';

interface VerificationResultProps {
  status: 'success' | 'error' | 'already_confirmed';
  message: string;
  userEmail?: string;
  errorCode?: string | null;
  cfCaptchaSiteKey: string;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  status,
  message,
  userEmail,
  errorCode,
  cfCaptchaSiteKey,
}) => {
  const [showResendForm, setShowResendForm] = useState(false);
  const [email, setEmail] = useState(userEmail || '');

  // Success case - show login button
  if (status === 'success') {
    return (
      <div className="space-y-6">
        <div className="p-4 text-sm text-green-600 bg-green-100 rounded-md dark:bg-green-900/20 dark:text-green-400 flex items-start">
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">{message}</p>
            <p className="mt-1 text-sm">
              You can now sign in to your account and start using 10xRules.ai.
            </p>
          </div>
        </div>

        <a
          href="/auth/login"
          className={`
            w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md
            text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            transition-colors duration-${transitions.duration.medium}
          `}
        >
          Continue to Login
        </a>

        <div className="text-center text-sm text-gray-400">
          <a
            href="/"
            className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
          >
            Return to home page
          </a>
        </div>
      </div>
    );
  }

  // Already confirmed case
  if (status === 'already_confirmed') {
    return (
      <div className="space-y-6">
        <div className="p-4 text-sm text-blue-600 bg-blue-100 rounded-md dark:bg-blue-900/20 dark:text-blue-400 flex items-start">
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">{message}</p>
          </div>
        </div>

        <a
          href="/auth/login"
          className={`
            w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md
            text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            transition-colors duration-${transitions.duration.medium}
          `}
        >
          Go to Login
        </a>
      </div>
    );
  }

  // Error case - show explanation and resend option
  return (
    <div className="space-y-6">
      <div className="p-4 text-sm text-red-600 bg-red-100 rounded-md dark:bg-red-900/20 dark:text-red-400">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="font-medium mb-2">{message}</p>
            {errorCode && <p className="text-xs opacity-75">Error code: {errorCode}</p>}
          </div>
        </div>
      </div>

      {/* Explanation of common causes */}
      <div className="bg-gray-800 border border-gray-700 rounded-md p-4 text-sm text-gray-300">
        <p className="font-medium mb-2">Why does this happen?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Corporate email security systems may scan links before you see them</li>
          <li>The verification link may have been used already</li>
          <li>The link may have expired (links are valid for 2 hours)</li>
        </ul>
      </div>

      {/* Resend verification section */}
      {showResendForm ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-300">
            <label htmlFor="email" className="block mb-2 font-medium">
              Enter your email to receive a new verification link:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
            />
          </div>

          {email && <ResendVerificationButton email={email} cfCaptchaSiteKey={cfCaptchaSiteKey} />}

          <button
            type="button"
            onClick={() => setShowResendForm(false)}
            className="text-sm text-gray-400 hover:text-gray-300 underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowResendForm(true)}
            className={`
              w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md
              text-sm font-medium text-white bg-gray-700 hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
              transition-colors duration-${transitions.duration.medium}
            `}
          >
            Request New Verification Email
          </button>

          <div className="text-center text-sm space-y-2">
            <div>
              <a
                href="/auth/login"
                className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
              >
                Try logging in
              </a>
            </div>
            <div className="text-gray-500">
              Need help?{' '}
              <a
                href="mailto:support@10xrules.ai"
                className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
              >
                Contact support
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VerificationResult;
