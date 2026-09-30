import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
// @ts-ignore - plain ESM server module (JS), intentionally untyped
import { handleInterpret, statusInfo } from './server/interpretHandler.mjs';

/**
 * Dev-only API middleware: serves /api/interpret inside the Vite dev server so
 * `npm run dev` is a single command. The OpenAI key comes from `env` (loaded
 * from .env via Vite's loadEnv) and stays in the Node process — it is NEVER
 * exposed to the client bundle. Production uses server.mjs instead.
 */
function apiPlugin(env: Record<string, string>): PluginOption {
  return {
    name: 'partsiq-api',
    configureServer(server) {
      server.middlewares.use('/api/interpret', (req, res) => {
        res.setHeader('content-type', 'application/json');
        if (req.method === 'GET') {
          res.statusCode = 200;
          res.end(JSON.stringify(statusInfo(env)));
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          try {
            const { status, json } = await handleInterpret(body, env);
            res.statusCode = status;
            res.end(JSON.stringify(json));
          } catch {
            res.statusCode = 200;
            res.end(JSON.stringify({ provider: 'mock', notice: 'AI reasoning unavailable.' }));
          }
        });
      });
    },
  };
}

// PARTS IQ prototype — Vite config.
// `base`: local dev/preview served from root; GitHub Pages project site uses
// /partsfinderau/. Override with VITE_BASE for other hosts.
export default defineConfig(({ command, mode }) => {
  // Load ALL env vars (including non-VITE server secrets) for the dev middleware.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: process.env.VITE_BASE ?? (command === 'build' ? '/partsfinderau/' : '/'),
    plugins: [react(), apiPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
  };
});
