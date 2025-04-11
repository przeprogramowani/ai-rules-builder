import type { LoginFormData, SignupFormData, ResetPasswordFormData } from '../types/auth';

class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json();
    throw new AuthError(response.status, error.error || 'Authentication failed');
  }
  return response.json();
}

export const authService = {
  login: async (data: LoginFormData) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  signup: async (formData: SignupFormData) => {
    const { email, password, privacyPolicyConsent } = formData;
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, privacyPolicyConsent }),
    });
    return handleResponse(response);
  },

  resetPassword: async (data: ResetPasswordFormData) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
