// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 3000,
  },
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_PUBLIC_KEY: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  adapter: cloudflare(),
});
