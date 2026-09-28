import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// PARTS IQ prototype — Vite config
//
// `base` controls the public path the built assets are served from.
// - Local dev / preview: served from the root, so base = '/'.
// - GitHub Pages project site (https://<user>.github.io/partsfinderau/):
//   assets live under /partsfinderau/, so the production build uses that.
// Override with VITE_BASE at build time for other hosts (Vercel/Netlify use '/').
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'build' ? '/partsfinderau/' : '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
}));
