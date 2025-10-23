import { useState } from 'react';
import type {
  LoginFormData,
  SignupFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
} from '../types/auth';
import { authService } from '../services/auth';

interface User {
  id: string;
  email: string | null;
}

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async <T>(action: (data: T) => Promise<{ user: User }>, data: T) => {
    try {
      setIsLoading(true);
      setError(null);
      return await action(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = (data: LoginFormData) => handleAuthAction(authService.login, data);

  const signup = (data: SignupFormData, inviteToken?: string) =>
    handleAuthAction((formData) => authService.signup(formData, inviteToken), data);

  const resetPassword = (data: ResetPasswordFormData) =>
    handleAuthAction(authService.resetPassword, data);

  const updatePassword = (data: UpdatePasswordFormData) =>
    handleAuthAction(authService.updatePassword, data);

  return {
    login,
    signup,
    resetPassword,
    updatePassword,
    error,
    isLoading,
  };
};
