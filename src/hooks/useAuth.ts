import axios from 'axios';
import { useEffect, useState } from 'react';
import type {
  LoginFormData,
  SignupFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
} from '../types/auth';
import { authService } from '../services/auth';
import { type CaptchaResponse } from '../services/captcha';

interface User {
  id: string;
  email: string | null;
}

export const useAuth = (cfCaptchaSiteKey: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  useEffect(() => {
    const verifyCaptcha = async () => {
      try {
        const captchaResult = await axios.post<CaptchaResponse>('/api/captcha/verify', {
          captchaToken: cfCaptchaSiteKey,
        });
        setIsCaptchaVerified(captchaResult.data.success);
      } catch (error) {
        console.error('Captcha verification error:', error);
        setError('Captcha verification failed');
      }
    };

    verifyCaptcha();
  }, []);

  const handleAuthAction = async <T>(action: (data: T) => Promise<{ user: User }>, data: T) => {
    if (!isCaptchaVerified) {
      setError('Captcha verification failed');
      return;
    }
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

  const signup = (data: SignupFormData) => handleAuthAction(authService.signup, data);

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
