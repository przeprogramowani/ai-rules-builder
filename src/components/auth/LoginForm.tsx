import React, { useState } from 'react';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          window.location.href = '/';
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Login failed');
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          api: error instanceof Error ? error.message : 'An unexpected error occurred',
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.api && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/20">
          {errors.api}
        </div>
      )}

      <AuthInput
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        error={errors.email}
        autoComplete="email"
        disabled={isLoading}
      />

      <AuthInput
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        error={errors.password}
        autoComplete="current-password"
        disabled={isLoading}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a
            href="/auth/reset-password"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}"
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
          className="text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}"
        >
          Sign up
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
