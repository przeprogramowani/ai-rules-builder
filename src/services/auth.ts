import type {
  LoginFormData,
  SignupFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
  ResendVerificationData,
  ResendVerificationResponse,
} from '../types/auth';

// Define User interface (ideally import from a shared location)
interface User {
  id: string;
  email: string | null;
}

interface AuthErrorResponse {
  error?: string;
  type?: string;
  email?: string;
  retryAfter?: number;
}

class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
    public type?: string,
    public email?: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function handleResponse(response: Response): Promise<{ user: User }> {
  if (!response.ok) {
    const errorData = (await response.json()) as AuthErrorResponse;
    throw new AuthError(
      response.status,
      errorData.error || 'Authentication failed',
      errorData.type,
      errorData.email,
      errorData.retryAfter,
    );
  }
  return response.json() as Promise<{ user: User }>;
}

export const authService = {
  login: async (data: LoginFormData & { captchaToken: string }): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  signup: async (
    formData: SignupFormData & { captchaToken: string },
    inviteToken?: string,
  ): Promise<{ user: User; organization?: { id: string; slug: string; name: string } }> => {
    const { email, password, privacyPolicyConsent, captchaToken } = formData;
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, privacyPolicyConsent, inviteToken, captchaToken }),
    });
    return handleResponse(response);
  },

  resetPassword: async (
    data: ResetPasswordFormData & { captchaToken: string },
  ): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updatePassword: async (
    data: UpdatePasswordFormData & { captchaToken: string },
  ): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  resendVerification: async (data: ResendVerificationData): Promise<ResendVerificationResponse> => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = (await response.json()) as ResendVerificationResponse;

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to resend verification email',
        type: result.type,
        retryAfter: result.retryAfter,
      };
    }

    return result;
  },
};
