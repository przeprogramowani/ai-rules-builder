/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';
import type { Env } from './features/featureFlags';
import type { OrganizationMembership } from './services/prompt-library/access';

declare global {
  interface Window {
    onloadTurnstileCallback: () => void;
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    clarity: (event: string, enabled?: boolean) => void;
  }
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        email: string | null;
        id: string;
      };
      promptLibrary?: {
        organizations: OrganizationMembership[];
        activeOrganization: OrganizationMembership | null;
        flagEnabled: boolean;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_ENV_NAME: Env;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLIC_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly CF_CAPTCHA_SITE_KEY: string;
  readonly CF_CAPTCHA_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
