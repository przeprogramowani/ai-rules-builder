import { useState, useEffect, useRef } from 'react';

export const useCaptcha = (cfCaptchaSiteKey: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const tokenCallbackRef = useRef<((token: string) => void) | null>(null);

  useEffect(() => {
    // Poll for Turnstile script to load
    const pollInterval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(pollInterval);

        // Initialize widget with interaction-only mode
        try {
          widgetIdRef.current = window.turnstile.render('#cf-captcha-container', {
            theme: 'dark',
            size: 'compact',
            appearance: 'interaction-only', // Only show if interaction needed
            execution: 'execute', // Wait for manual trigger
            sitekey: cfCaptchaSiteKey,
            callback: (token: string) => {
              // Callback delivers token asynchronously
              if (tokenCallbackRef.current) {
                tokenCallbackRef.current(token);
              }
            },
          });
        } catch (error) {
          console.error('Turnstile initialization error:', error);
        }
      }
    }, 100);

    // Cleanup after 10 seconds if script hasn't loaded
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [cfCaptchaSiteKey]);

  const getCaptchaToken = async (): Promise<string | null> => {
    if (!widgetIdRef.current) {
      console.error('Turnstile widget not initialized');
      return null;
    }

    setIsLoading(true);
    try {
      // Create promise that resolves when callback fires
      const tokenPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Captcha timeout'));
        }, 60000);

        tokenCallbackRef.current = (token: string) => {
          clearTimeout(timeout);
          resolve(token);
        };

        // Trigger challenge - token arrives via callback
        try {
          if (!window.turnstile || !widgetIdRef.current) {
            throw new Error('Turnstile not initialized');
          }
          window.turnstile.execute(widgetIdRef.current);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      const token = await tokenPromise;
      return token;
    } catch (error) {
      console.error('Captcha error:', error);
      return null;
    } finally {
      setIsLoading(false);
      tokenCallbackRef.current = null;
    }
  };

  return { getCaptchaToken, isLoading };
};
