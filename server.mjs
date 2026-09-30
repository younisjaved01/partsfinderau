/**
 * PARTS IQ production server (zero-dependency).
 *
 * Serves the built `dist/` (SPA) and the `/api/interpret` endpoint that talks
 * to OpenAI server-side. Run with:  node server.mjs
 * Reads OPENAI_API_KEY / OPENAI_MODEL / LLM_PROVIDER / PORT from process.env.
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleInterpret, statusInfo } from './server/interpretHandler.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const readBody = (req) =>
  new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => resolve(b));
    req.on('error', () => resolve(''));
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // --- API ---
  if (pathname === '/api/interpret') {
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify(statusInfo(process.env)));
      return;
    }
    if (req.method === 'POST') {
      const { status, json } = await handleInterpret(await readBody(req), process.env);
      res.statusCode = status;
      res.end(JSON.stringify(json));
      return;
    }
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // --- Static (base-agnostic: tolerate a /partsfinderau prefix) ---
  const rel = (pathname.replace(/^\/partsfinderau/, '') || '/').replace(/^\/+/, '');
  const target = path.join(DIST, rel || 'index.html');
  try {
    const s = await stat(target);
    if (s.isFile()) {
      const buf = await readFile(target);
      res.statusCode = 200;
      res.setHeader('content-type', MIME[path.extname(target)] || 'application/octet-stream');
      res.end(buf);
      return;
    }
  } catch {
    /* fall through to SPA index */
  }
  try {
    const index = await readFile(path.join(DIST, 'index.html'));
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(index);
  } catch {
    res.statusCode = 404;
    res.end('Not found. Run `npm run build` first.');
  }
});

server.listen(PORT, () => {
  const { provider, model } = statusInfo(process.env);
  console.log(`PARTS IQ server on http://localhost:${PORT}  (LLM: ${provider}${model ? ` · ${model}` : ''})`);
});
