import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';
import { resetPasswordSchema } from '../../types/auth';
import type { ResetPasswordFormData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

interface ResetPasswordFormProps {
  cfCaptchaSiteKey: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ cfCaptchaSiteKey }) => {
  const { resetPassword, error: apiError, isLoading } = useAuth(cfCaptchaSiteKey);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');

    if (errorParam === 'invalid-token') {
      setError('The reset password link is invalid or has expired. Please request a new one.');
    }
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPassword(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-400">
          You will receive an email with instructions to reset your password.
        </div>
        <a
          href="/auth/login"
          className={`
            inline-block text-blue-400 hover:text-blue-300
            transition-colors duration-${transitions.duration.medium}
          `}
        >
          Return to login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {(apiError || error) && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/20">
          {apiError || error}
        </div>
      )}

      <div className="text-sm text-gray-400 mb-4">
        Enter your email address and we'll send you instructions to reset your password.
      </div>

      <AuthInput
        id="email"
        label="Email address"
        type="email"
        error={errors.email?.message}
        autoComplete="email"
        disabled={isLoading}
        {...register('email')}
      />

      <div className="flex flex-row justify-center">
        <div className="cf-turnstile" data-sitekey={cfCaptchaSiteKey} data-size="normal"></div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full flex justify-center py-2 px-4 border border-transparent rounded-md
          text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? 'Sending...' : 'Send reset instructions'}
      </button>

      <div className="text-center text-sm">
        <a
          href="/auth/login"
          className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
        >
          Back to login
        </a>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
