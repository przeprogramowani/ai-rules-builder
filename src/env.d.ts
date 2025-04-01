/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

declare global {
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
  readonly ENV_NAME: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLIC_KEY: string;
  readonly SUPABASE_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
