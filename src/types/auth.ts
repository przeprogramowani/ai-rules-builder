import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    privacyPolicyConsent: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

// Extended type for password reset flow that includes the token_hash from URL
export type UpdatePasswordWithTokenFormData = UpdatePasswordFormData & {
  token_hash: string;
};

// Resend verification types
export interface ResendVerificationData {
  email: string;
  captchaToken: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  type?: 'rate_limit' | 'not_found' | 'already_confirmed';
  retryAfter?: number;
}

// Signup error types
export type SignupError =
  | { type: 'confirmed_exists'; message: string }
  | { type: 'unconfirmed_exists'; message: string; email: string }
  | { type: 'rate_limit'; message: string; retryAfter: number }
  | { type: 'generic'; message: string };
