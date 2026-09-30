/**
 * Local API for testing cloud sync.
 *
 * Serves the built app from `dist` and answers the `/api` routes the sync adapter calls,
 * so the whole flow can be exercised without choosing a hosting provider. It is a test
 * fixture, not a production backend: it stores accounts and entries in a JSON file, has
 * no rate limiting and no password hashing (there are no passwords — sign-in is a
 * one-time code). Read the notes in `sync/README.md` before pointing a real deployment at
 * anything like it.
 *
 * Run: `node scripts/serve-sync.mjs`
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID, randomInt } from 'node:crypto';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT ?? 5213);
const DIST = join(process.cwd(), 'dist');
const DATA_DIR = join(process.cwd(), '.sync-data');
const DATA_FILE = join(DATA_DIR, 'store.json');
/**
 * Whether the sign-in code is echoed in the response.
 *
 * On by default because this file exists to be run locally, where there is no mail
 * server and the flow would otherwise be untestable. `DEV_ECHO_CODE=0` turns it off, and
 * anything deployed anywhere real must set that: returning the code in the response
 * would let anyone who knows an address sign in as its owner.
 */
const ECHO_CODE = process.env.DEV_ECHO_CODE !== '0';
/** Codes live in memory only: a restart invalidating them is the correct behaviour. */
const CODES = new Map();
const SESSIONS = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/** The production header set, so a CSP regression shows up in these runs too. */
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'";

async function loadStore() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    return { accounts: {} };
  }
}

async function saveStore(store) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      // A diary entry is small; anything larger is not a request this API should accept.
      if (raw.length > 8_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

/** Reads the session cookie and returns the account email it belongs to, if any. */
function accountFor(req) {
  const header = req.headers.cookie ?? '';
  const match = header.match(/(?:^|;\s*)dd_session=([^;]+)/);
  if (!match) return null;
  return SESSIONS.get(decodeURIComponent(match[1])) ?? null;
}

/** Normalizes an email so `A@B.com` and `a@b.com` are the same account. */
function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'POST /api/auth/request-code') {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    if (!looksLikeEmail(email)) return json(res, 422, { error: 'That does not look like an email address.' });

    const code = String(randomInt(100000, 999999));
    CODES.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    // A real backend emails this. Printing it is what makes the local flow testable.
    console.log(`[sync] code for ${email}: ${code}`);
    return json(res, 200, ECHO_CODE ? { ok: true, devCode: code } : { ok: true });
  }

  if (route === 'POST /api/auth/verify') {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const record = CODES.get(email);
    if (!record || record.code !== String(body.code) || record.expiresAt < Date.now()) {
      return json(res, 401, { error: 'That code is wrong or has expired.' });
    }
    CODES.delete(email);

    const store = await loadStore();
    if (!store.accounts[email]) {
      store.accounts[email] = { entries: [] };
      await saveStore(store);
    }

    const token = randomUUID();
    SESSIONS.set(token, email);
    return json(res, 200, { email }, {
      'Set-Cookie': `dd_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`,
    });
  }

  if (route === 'GET /api/auth/session') {
    const email = accountFor(req);
    if (!email) return json(res, 401, { error: 'Not signed in.' });
    return json(res, 200, { email });
  }

  if (route === 'POST /api/auth/signout') {
    const header = req.headers.cookie ?? '';
    const match = header.match(/(?:^|;\s*)dd_session=([^;]+)/);
    if (match) SESSIONS.delete(decodeURIComponent(match[1]));
    return json(res, 200, { ok: true }, { 'Set-Cookie': 'dd_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }

  const email = accountFor(req);
  if (!email) return json(res, 401, { error: 'Not signed in.' });

  const store = await loadStore();
  const account = store.accounts[email] ?? { entries: [] };

  if (route === 'GET /api/entries') {
    return json(res, 200, { entries: account.entries, serverTime: new Date().toISOString() });
  }

  if (route === 'POST /api/entries') {
    const body = await readBody(req);
    const incoming = Array.isArray(body.entries) ? body.entries : [];
    const byId = new Map(account.entries.map((entry) => [entry.id, entry]));

    incoming.forEach((entry) => {
      if (!entry || typeof entry.id !== 'string') return;
      const existing = byId.get(entry.id);
      // Last write wins, compared on the client stamp. A tie keeps what the server has,
      // because the pushing client already had its chance to win during its own merge.
      if (existing && new Date(existing.updatedAt).getTime() >= new Date(entry.updatedAt).getTime()) return;
      byId.set(entry.id, entry);
    });

    account.entries = [...byId.values()];
    store.accounts[email] = account;
    await saveStore(store);
    return json(res, 200, { ok: true, count: account.entries.length });
  }

  return json(res, 404, { error: 'Unknown endpoint.' });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, url);
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : 'Bad request' });
    }
    return;
  }

  // Static files, with an SPA fallback so a deep link like /entry/:id works.
  const requested = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(DIST, requested === '/' ? 'index.html' : requested);
  const target = existsSync(filePath) && extname(filePath) ? filePath : join(DIST, 'index.html');

  try {
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': MIME[extname(target)] ?? 'application/octet-stream',
      'Content-Security-Policy': CSP,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`[sync] server on http://localhost:${PORT}`);
  console.log(`[sync] data file: ${DATA_FILE}`);
});
