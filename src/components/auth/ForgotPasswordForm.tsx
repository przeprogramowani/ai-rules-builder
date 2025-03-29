import { KeyRound } from 'lucide-react';
import React, { useState } from 'react';
import { transitions } from '../../styles/theme';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="text-gray-200">
          If an account exists for {email}, you will receive password reset instructions.
        </div>
        <div className="text-sm text-gray-400">
          <a href="/login" className="font-medium text-blue-400 hover:text-blue-300">
            Return to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Reset your password</h2>
        <p className="text-sm text-gray-400 mb-6">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        <label htmlFor="email" className="block text-sm font-medium text-gray-200">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-${transitions.duration.medium}`}
        >
          <KeyRound className="size-4 mr-2" />
          {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
        </button>
      </div>

      <div className="text-center text-sm text-gray-400">
        Remember your password?{' '}
        <a href="/login" className="font-medium text-blue-400 hover:text-blue-300">
          Sign in
        </a>
      </div>
    </form>
  );
};

export default React.memo(ForgotPasswordForm);
