import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/auth';
import type { ResendVerificationResponse } from '../../types/auth';
import { transitions } from '../../styles/theme';

interface ResendVerificationButtonProps {
  email: string;
  cfCaptchaSiteKey: string;
  initialCountdown?: number;
  onMessageChange?: (hasMessage: boolean) => void;
}

export const ResendVerificationButton: React.FC<ResendVerificationButtonProps> = ({
  email,
  cfCaptchaSiteKey,
  initialCountdown,
  onMessageChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(initialCountdown || 0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize Turnstile captcha
    const initCaptcha = () => {
      if (window.turnstile && captchaContainerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
          theme: 'dark',
          sitekey: cfCaptchaSiteKey,
          callback: (token: string) => {
            setCaptchaToken(token);
          },
          'expired-callback': () => {
            setCaptchaToken(null);
          },
          'error-callback': () => {
            setCaptchaToken(null);
          },
        });
      }
    };

    // Wait for Turnstile to load
    if (window.turnstile) {
      initCaptcha();
    } else {
      window.onloadTurnstileCallback = initCaptcha;
    }

    return () => {
      // Cleanup captcha widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          console.error('Error removing Turnstile widget:', e);
        }
      }
    };
  }, [cfCaptchaSiteKey]);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    // Notify parent when message changes
    if (onMessageChange) {
      onMessageChange(message !== null);
    }
  }, [message, onMessageChange]);

  const formatCountdown = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      if (minutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours}h ${minutes}m`;
    }
  };

  const handleResend = async () => {
    if (!captchaToken) {
      setMessage({ type: 'error', text: 'Please complete the captcha' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result: ResendVerificationResponse = await authService.resendVerification({
        email,
        captchaToken,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Verification email sent! Please check your inbox.',
        });
        // Set countdown to 60 seconds (matches middleware rate limit)
        setCountdown(60);
        setCaptchaToken(null);

        // Reset captcha
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } else {
        let errorMessage = result.error || 'Failed to send verification email';

        if (result.type === 'rate_limit') {
          // Set countdown to the actual retry time from the database rate limiter
          const retrySeconds = result.retryAfter || 3600;
          setCountdown(retrySeconds);

          const minutes = Math.ceil(retrySeconds / 60);
          errorMessage = `Rate limit exceeded. You can request another email in ${minutes} minute${minutes > 1 ? 's' : ''}.`;

          // Don't reset captcha on rate limit, let them keep it
        } else if (result.type === 'already_confirmed') {
          errorMessage = 'Your email is already verified. Please log in.';
        } else if (result.type === 'not_found') {
          errorMessage = 'No account found with this email. Please sign up first.';
        } else {
          // For other errors, reset captcha
          setCaptchaToken(null);
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        }

        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3 text-sm rounded-md ${
            message.type === 'success'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/20'
              : 'text-red-500 bg-red-100 dark:bg-red-900/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div ref={captchaContainerRef} className="flex justify-center mb-4" />

      <button
        type="button"
        onClick={handleResend}
        disabled={!captchaToken || isLoading || countdown > 0}
        className={`
          w-full flex justify-center py-2 px-4 border border-transparent rounded-md
          text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading
          ? 'Sending...'
          : countdown > 0
            ? `Resend available in ${formatCountdown(countdown)}`
            : 'Resend Verification Email'}
      </button>

      <div className="text-center text-sm">
        <a
          href="/auth/login"
          className={`text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}`}
        >
          Return to login
        </a>
      </div>
    </div>
  );
};

export default ResendVerificationButton;
