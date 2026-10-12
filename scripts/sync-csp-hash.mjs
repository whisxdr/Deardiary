/**
 * Keeps the sha256 of index.html's inline boot script in the three CSP files.
 *
 * The boot script has to run before the first paint, which means inline, which means the
 * policy has to name it by hash: `script-src 'self'` alone would block it and the theme
 * would flash. A hash is easy to get wrong by hand and impossible to notice until the
 * deployed site stops applying the stored theme, so the value is derived from the file.
 *
 * Run: `node scripts/sync-csp-hash.mjs`        (rewrite the policy with the current hash)
 *      `node scripts/sync-csp-hash.mjs --check` (fail if any copy is stale)
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const POLICY_FILES = ['vercel.json', 'netlify.toml', 'scripts/serve-with-csp.mjs'];

/** The inline script body in index.html: the one <script> tag with no attributes. */
export function inlineBootScript() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('index.html has no inline boot script');
  return match[1];
}

/** `sha256-...` source expression for that script, as CSP wants it. */
export function bootScriptHash() {
  return `sha256-${createHash('sha256').update(inlineBootScript(), 'utf8').digest('base64')}`;
}

const hash = bootScriptHash();
const checkOnly = process.argv.includes('--check');
let stale = 0;

POLICY_FILES.forEach((file) => {
  const path = join(ROOT, file);
  const before = readFileSync(path, 'utf8');
  // Anchored on the policy value itself, not on the bare directive: netlify.toml explains
  // the policy in a comment above it, and a loose match rewrote the prose instead.
  const after = before
    .replace(/("default-src 'self'; script-src 'self')( 'sha256-[^']*')?/, `$1 '${hash}'`)
    .replace(/("script-src 'self')( 'sha256-[^']*')?"/, `$1 '${hash}'"`);
  if (after === before) {
    console.log(`ok    ${file}`);
    return;
  }
  if (checkOnly) {
    stale += 1;
    console.log(`stale ${file}`);
    return;
  }
  writeFileSync(path, after);
  console.log(`wrote ${file}`);
});

console.log(`\nboot script hash: '${hash}'`);
if (checkOnly && stale > 0) {
  console.log(`${stale} file(s) stale — run node scripts/sync-csp-hash.mjs`);
  process.exit(1);
}
