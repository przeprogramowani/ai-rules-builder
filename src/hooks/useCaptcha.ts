import axios from 'axios';
import type { CaptchaResponse } from '../services/captcha';
import { useState, useEffect } from 'react';

export const useCaptcha = (cfCaptchaSiteKey: string) => {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  useEffect(() => {
    window.onloadTurnstileCallback = function () {
      turnstile.render('#cf-captcha-container', {
        theme: 'dark',
        sitekey: cfCaptchaSiteKey,
        callback: async function (captchaToken) {
          try {
            const captchaResult = await axios.post<CaptchaResponse>('/api/captcha/verify', {
              captchaToken,
            });
            setIsCaptchaVerified(captchaResult.data.success);
          } catch (error) {
            console.error('Captcha verification error:', error);
            setIsCaptchaVerified(false);
          }
        },
      });
    };
  }, []);

  return { isCaptchaVerified };
};
