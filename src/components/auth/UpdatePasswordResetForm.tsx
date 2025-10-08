import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';
import { updatePasswordSchema } from '../../types/auth';
import type { UpdatePasswordFormData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { useTokenHashVerification } from '../../hooks/useTokenHashVerification';
import { useCaptcha } from '../../hooks/useCaptcha';

interface UpdatePasswordResetFormProps {
  cfCaptchaSiteKey: string;
}

export const UpdatePasswordResetForm: React.FC<UpdatePasswordResetFormProps> = ({
  cfCaptchaSiteKey,
}) => {
  const { updatePassword, error: apiError, isLoading } = useAuth();
  const { tokenHash, error: tokenError } = useTokenHashVerification();
  const { isCaptchaVerified } = useCaptcha(cfCaptchaSiteKey);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setValue,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  // Verify token when component mounts to establish session
  useEffect(() => {
    const verifyToken = async () => {
      if (!tokenHash) {
        setIsVerifyingToken(false);
        return;
      }

      try {
        console.log('[UpdatePasswordResetForm] Verifying token...');
        console.log('[UpdatePasswordResetForm] Token hash:', tokenHash?.substring(0, 30) + '...');

        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token_hash: tokenHash }),
          credentials: 'same-origin',
        });

        console.log(
          '[UpdatePasswordResetForm] Response status:',
          response.status,
          response.statusText,
        );

        let data;
        try {
          data = await response.json();
          console.log('[UpdatePasswordResetForm] Response data:', data);
        } catch (jsonError) {
          console.error('[UpdatePasswordResetForm] Failed to parse JSON response:', jsonError);
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        if (!response.ok) {
          throw new Error(
            data.error || `Token verification failed: ${response.status} ${response.statusText}`,
          );
        }

        console.log('[UpdatePasswordResetForm] Token verified successfully');
        setTokenVerified(true);
      } catch (error) {
        console.error('[UpdatePasswordResetForm] Token verification error:', error);
        setVerificationError(
          error instanceof Error ? error.message : 'Failed to verify reset token',
        );
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [tokenHash]);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    try {
      if (!isCaptchaVerified) {
        throw new Error('Captcha verification failed');
      }
      if (!tokenVerified) {
        throw new Error('Reset token not verified');
      }
      // Call updatePassword without token_hash (session already established)
      await updatePassword(data);
      window.location.href = '/auth/login?message=password-updated';
    } catch (error) {
      console.error(error);
    }
  };

  if (tokenError) {
    return (
      <div className="text-center space-y-4">
        <div className="text-red-500">{tokenError}</div>
        <a
          href="/auth/reset-password"
          className={`
            inline-block text-blue-400 hover:text-blue-300
            transition-colors duration-${transitions.duration.medium}
          `}
        >
          Request new password reset
        </a>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="text-center space-y-4">
        <div className="text-red-500">{verificationError}</div>
        <a
          href="/auth/reset-password"
          className={`
            inline-block text-blue-400 hover:text-blue-300
            transition-colors duration-${transitions.duration.medium}
          `}
        >
          Request new password reset
        </a>
      </div>
    );
  }

  if (isVerifyingToken) {
    return (
      <div className="text-center space-y-4">
        <div className="text-gray-400">Verifying reset token...</div>
      </div>
    );
  }

  if (isSubmitSuccessful) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-400">Your password has been updated successfully.</div>
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
        id="password"
        label="New Password"
        type="password"
        error={errors.password?.message}
        autoComplete="new-password"
        disabled={isLoading}
        {...register('password')}
        onAutofill={(value) => setValue('password', value, { shouldValidate: true })}
      />

      <AuthInput
        id="confirm-password"
        label="Confirm New Password"
        type="password"
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
        disabled={isLoading}
        {...register('confirmPassword')}
        onAutofill={(value) => setValue('confirmPassword', value, { shouldValidate: true })}
      />

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
        {isLoading ? 'Updating Password...' : 'Update Password'}
      </button>
    </form>
  );
};

export default UpdatePasswordResetForm;
