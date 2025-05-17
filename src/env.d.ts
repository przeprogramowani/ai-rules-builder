/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';
import type { Env } from './features/featureFlags';

declare global {
  interface Window {
    onloadTurnstileCallback: () => void;
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
