import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';
import { signupSchema } from '../../types/auth';
import type { SignupFormData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

export const SignupForm: React.FC = () => {
  const { signup, error: apiError, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data);
    } catch (error) {
      console.error(error);
      // Error is handled by useAuth hook
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-400">
          Please check your email for a verification link to complete your registration.
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
      />

      <AuthInput
        id="password"
        label="Password"
        type="password"
        error={errors.password?.message}
        autoComplete="new-password"
        disabled={isLoading}
        {...register('password')}
      />

      <AuthInput
        id="confirm-password"
        label="Confirm password"
        type="password"
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
        disabled={isLoading}
        {...register('confirmPassword')}
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
        disabled={isLoading}
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
