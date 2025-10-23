import { useState, useEffect } from 'react';

/**
 * Hook to extract and validate the token_hash from URL parameters.
 * Does NOT perform API verification - that happens on form submit.
 */
export const useTokenHashVerification = () => {
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.search).get('token_hash');
    if (!hash) {
      setError('No reset token found');
    } else {
      setTokenHash(hash);
    }
  }, []);

  return { tokenHash, error };
};
