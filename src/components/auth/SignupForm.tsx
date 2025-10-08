import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';
import { signupSchema } from '../../types/auth';
import type { SignupFormData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { useCaptcha } from '../../hooks/useCaptcha';
import { ResendVerificationButton } from './ResendVerificationButton';

interface SignupFormProps {
  cfCaptchaSiteKey: string;
  inviteToken?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ cfCaptchaSiteKey, inviteToken }) => {
  const { signup, error: apiError, isLoading } = useAuth();
  const { isCaptchaVerified } = useCaptcha(cfCaptchaSiteKey);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [showApiError, setShowApiError] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      if (!isCaptchaVerified) {
        throw new Error('Captcha verification failed');
      }

      setErrorType(null);
      setUnverifiedEmail(null);
      setShowApiError(true);

      const result = await signup(data, inviteToken);

      // Store email for resend verification option
      setSuccessEmail(data.email);

      // If invite token was used and we got organization info, redirect to prompts
      if (result?.organization?.slug) {
        window.location.href = `/prompts?organization=${result.organization.slug}`;
      }
    } catch (error) {
      console.error(error);

      // Check if error has type information (AuthError)
      if (error && typeof error === 'object' && 'type' in error) {
        const authError = error as { type: string; email?: string };
        setErrorType(authError.type);
        if (authError.type === 'unconfirmed_exists' && authError.email) {
          setUnverifiedEmail(authError.email);
          setShowApiError(true);
        }
      }
    }
  };

  // Show success message for new signups
  if (isSubmitSuccessful && successEmail) {
    return (
      <div className="space-y-4">
        {showApiError && (
          <>
            <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md dark:bg-green-900/20 dark:text-green-400">
              Please check your email for a verification link to complete your registration.
            </div>
            <div className="text-sm text-gray-400 text-center">Didn't receive the email?</div>
          </>
        )}
        <ResendVerificationButton
          email={successEmail}
          cfCaptchaSiteKey={cfCaptchaSiteKey}
          onMessageChange={(hasMessage) => setShowApiError(!hasMessage)}
        />
      </div>
    );
  }

  // Show login link for confirmed existing accounts
  if (errorType === 'confirmed_exists') {
    return (
      <div className="text-center space-y-4">
        <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/20">
          {apiError}
        </div>
        <a
          href="/auth/login"
          className={`
            inline-block w-full py-2 px-4 border border-transparent rounded-md
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

  // Show resend verification for unconfirmed accounts
  if (errorType === 'unconfirmed_exists' && unverifiedEmail) {
    return (
      <div className="space-y-4">
        {showApiError && (
          <div className="p-3 text-sm text-yellow-600 bg-yellow-100 rounded-md dark:bg-yellow-900/20 dark:text-yellow-400">
            {apiError}
          </div>
        )}
        <ResendVerificationButton
          email={unverifiedEmail}
          cfCaptchaSiteKey={cfCaptchaSiteKey}
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
        autoComplete="new-password"
        disabled={isLoading}
        {...register('password')}
        onAutofill={(value) => setValue('password', value, { shouldValidate: true })}
      />

      <AuthInput
        id="confirm-password"
        label="Confirm password"
        type="password"
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
        disabled={isLoading}
        {...register('confirmPassword')}
        onAutofill={(value) => setValue('confirmPassword', value, { shouldValidate: true })}
      />

      <div className="space-y-2">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="privacy-policy"
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
              {...register('privacyPolicyConsent')}
              disabled={isLoading}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="privacy-policy" className="font-medium text-gray-300">
              I agree to the{' '}
              <a
                href="/privacy/en"
                className="text-blue-400 hover:text-blue-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </label>
            {errors.privacyPolicyConsent && (
              <p className="mt-1 text-sm text-red-500">{errors.privacyPolicyConsent.message}</p>
            )}
          </div>
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
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-400">Already have an account? </span>
        <a
          href="/auth/login"
          className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
        >
          Sign in
        </a>
      </div>
    </form>
  );
};

export default SignupForm;
