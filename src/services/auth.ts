import type {
  LoginFormData,
  SignupFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
} from '../types/auth';

// Define User interface (ideally import from a shared location)
interface User {
  id: string;
  email: string | null;
}

interface AuthErrorResponse {
  error?: string;
  // Add other potential error properties if known
}

class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function handleResponse(response: Response): Promise<{ user: User }> {
  if (!response.ok) {
    const errorData = (await response.json()) as AuthErrorResponse;
    throw new AuthError(response.status, errorData.error || 'Authentication failed');
  }
  return response.json() as Promise<{ user: User }>;
}

export const authService = {
  login: async (data: LoginFormData): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  signup: async (
    formData: SignupFormData,
    inviteToken?: string,
  ): Promise<{ user: User; organization?: { id: string; slug: string; name: string } }> => {
    const { email, password, privacyPolicyConsent } = formData;
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, privacyPolicyConsent, inviteToken }),
    });
    return handleResponse(response);
  },

  resetPassword: async (data: ResetPasswordFormData): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updatePassword: async (data: UpdatePasswordFormData): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
