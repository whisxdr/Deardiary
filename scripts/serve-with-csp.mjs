import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

/**
 * Serves `dist` with the same security headers as vercel.json / netlify.toml, so the
 * Content-Security-Policy can be tested against the real bundle instead of assumed.
 */
const DIST = join(process.cwd(), 'dist');
const PORT = Number(process.argv[2] ?? 5212);

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https:",
  // The Supabase project origin, plus its Realtime websocket, for the optional cloud sync.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, rel);

  const send = async (path, status = 200) => {
    try {
      const body = await readFile(path);
      res.writeHead(status, {
        'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
        'Content-Security-Policy': CSP,
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      });
      res.end(body);
      return true;
    } catch {
      return false;
    }
  };

  // SPA fallback: every unknown path serves index.html, as the host rewrites do.
  if (await send(file)) return;
  if (await send(join(DIST, 'index.html'))) return;
  res.writeHead(404).end('not found');
});

server.listen(PORT, () => {
  console.log(`csp-test server on http://localhost:${PORT}`);
});
