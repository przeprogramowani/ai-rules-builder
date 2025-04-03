import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';
import { loginSchema } from '../../types/auth';
import type { LoginFormData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const { login, error: apiError, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      window.location.href = '/';
    } catch (error) {
      console.error(error);
      // Error is handled by useAuth hook
    }
  };

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
        autoComplete="current-password"
        disabled={isLoading}
        {...register('password')}
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
        disabled={isLoading}
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
