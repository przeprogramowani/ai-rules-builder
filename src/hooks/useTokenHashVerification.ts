import { useState, useEffect } from 'react';

export const useTokenHashVerification = () => {
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
      if (!tokenHash) {
        setVerificationError('No reset token found');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token_hash: tokenHash }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error: string };
          throw new Error(data.error || 'Failed to verify token');
        }

        setIsVerified(true);
      } catch (error) {
        setVerificationError(error instanceof Error ? error.message : 'Failed to verify token');
        console.error('Token verification error:', error);
      }
    };

    verifyToken();
  }, []);

  return { verificationError, isVerified };
};
