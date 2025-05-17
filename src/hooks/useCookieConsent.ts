import { useState, useEffect, useCallback } from 'react';

const COOKIE_CONSENT_KEY = '10xrules-consent';

interface ConsentState {
  isGiven: boolean | null;
  value: boolean | null;
}

function activateFrozenScripts(): void {
  const gtmContainer = document.querySelector('.gtm-container');
  const frozenScripts = document.querySelectorAll<HTMLScriptElement>(
    'script[type="text/plain"][data-required-consent="true"]',
  );
  frozenScripts.forEach((script: HTMLScriptElement) => {
    const newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.textContent;
    }
    gtmContainer?.removeChild(script);
    gtmContainer?.appendChild(newScript);
  });
}

function enableGTagConsent(): void {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
    window.gtag('event', 'custom_consent_initialized');
  }
  if (typeof window.clarity === 'function') {
    window.clarity('consent');
  }
}

function onConsentEnabled(): void {
  activateFrozenScripts();
  setTimeout(() => {
    enableGTagConsent();
  }, 2000);
}

export function useCookieConsent() {
  const [consentState, setConsentState] = useState<ConsentState>({
    isGiven: null,
    value: null,
  });

  useEffect(() => {
    const storedValue = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    const initialIsGiven = storedValue !== null;
    const initialValue = storedValue === 'true';

    setConsentState({
      isGiven: initialIsGiven,
      value: initialValue,
    });

    if (initialValue) {
      onConsentEnabled();
    }
  }, []);

  const setConsent = useCallback((consent: boolean) => {
    setConsentState({ isGiven: true, value: consent });
    window.localStorage.setItem(COOKIE_CONSENT_KEY, consent.toString());

    if (consent) {
      onConsentEnabled();
    } else {
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
        });
      }
    }
  }, []);

  return {
    isConsentGiven: consentState.isGiven,
    consentValue: consentState.value,
    setConsent,
  };
}
