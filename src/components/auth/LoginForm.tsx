import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';
import { loginSchema } from '../../types/auth';
import type { LoginFormData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { useCaptcha } from '../../hooks/useCaptcha';
import { ResendVerificationButton } from './ResendVerificationButton';

interface LoginFormProps {
  cfCaptchaSiteKey: string;
  inviteToken?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ cfCaptchaSiteKey, inviteToken }) => {
  const { login, error: apiError, isLoading } = useAuth();
  const { isCaptchaVerified } = useCaptcha(cfCaptchaSiteKey);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [showApiError, setShowApiError] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (!isCaptchaVerified) {
        throw new Error('Captcha verification failed');
      }

      setErrorType(null);
      setUnverifiedEmail(null);
      setRetryAfter(null);
      setShowApiError(true);

      await login(data);

      // Redirect to invite page if invite token is present
      if (inviteToken) {
        window.location.href = `/invites/${inviteToken}`;
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error(error);

      // Check if error has type information (AuthError)
      if (error && typeof error === 'object' && 'type' in error) {
        const authError = error as { type: string; email?: string; retryAfter?: number };
        setErrorType(authError.type);
        if (
          (authError.type === 'email_not_confirmed' ||
            authError.type === 'email_not_confirmed_rate_limited') &&
          authError.email
        ) {
          setUnverifiedEmail(authError.email);
          setRetryAfter(authError.retryAfter || null);
          setShowApiError(true);
        }
      }
    }
  };

  // Show resend verification for unconfirmed email (both normal and rate limited)
  if (
    (errorType === 'email_not_confirmed' || errorType === 'email_not_confirmed_rate_limited') &&
    unverifiedEmail
  ) {
    return (
      <div className="space-y-4">
        {showApiError && (
          <div
            className={`p-3 text-sm rounded-md ${
              errorType === 'email_not_confirmed_rate_limited'
                ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
                : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}
          >
            {apiError}
          </div>
        )}
        <ResendVerificationButton
          email={unverifiedEmail}
          cfCaptchaSiteKey={cfCaptchaSiteKey}
          initialCountdown={retryAfter || undefined}
          onMessageChange={(hasMessage) => setShowApiError(!hasMessage)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/20">
          {apiError}
        </div>
      )}

      <AuthInput
        id="email"
        label="Email address"
        type="email"
        error={errors.email?.message}
        autoComplete="email"
        disabled={isLoading}
        {...register('email')}
        onAutofill={(value) => setValue('email', value, { shouldValidate: true })}
      />

      <AuthInput
        id="password"
        label="Password"
        type="password"
        error={errors.password?.message}
        autoComplete="current-password"
        disabled={isLoading}
        {...register('password')}
        onAutofill={(value) => setValue('password', value, { shouldValidate: true })}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a
            href="/auth/reset-password"
            className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
          >
            Forgot your password?
          </a>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isCaptchaVerified || isLoading}
        className={`
          w-full flex justify-center py-2 px-4 border border-transparent rounded-md
          text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-400">Don't have an account? </span>
        <a
          href="/auth/signup"
          className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
        >
          Sign up
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
