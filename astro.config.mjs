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
      CF_CAPTCHA_SITE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        // localhost - always pass
        // default: '1x00000000000000000000AA',
      }),
      CF_CAPTCHA_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        // localhost - always pass
        // default: '1x0000000000000000000000000000000AA',
      }),
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
