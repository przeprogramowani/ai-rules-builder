// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 3000,
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: [/^d3.*$/, /^@nivo.*$/],
    },
  },

  devToolbar: {
    enabled: false,
  },

  integrations: [react()],
  adapter: cloudflare(),
  // adapter: process.env.CI
  //   ? node({
  //       mode: 'standalone',
  //     })
  //   : cloudflare(),
});
