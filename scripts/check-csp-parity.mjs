/**
 * The Content-Security-Policy is written in three places — vercel.json, netlify.toml and
 * scripts/serve-with-csp.mjs — and the report claims they are identical. Nothing asserted
 * that, so an edit to one host's copy could ship a weaker policy than the other two while
 * every other suite stayed green. This suite reads all three, extracts the full policy
 * string, and fails on any character that differs.
 *
 * It also pins the three properties the policy is there for: the Supabase origins are
 * allowed (or cloud sync cannot connect), and neither `unsafe-eval` nor an inline
 * `script-src` slipped in.
 *
 * Run: `node scripts/check-csp-parity.mjs`
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const results = [];
let failed = 0;
const check = (name, pass, detail) => {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failed += 1;
};

/** The policy string from vercel.json's headers block. */
function fromVercel() {
  const json = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
  const header = json.headers
    .flatMap((rule) => rule.headers ?? [])
    .find((item) => item.key === 'Content-Security-Policy');
  return header?.value ?? null;
}

/** The policy string from netlify.toml's `Content-Security-Policy = "..."` line. */
function fromNetlify() {
  const toml = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
  const match = toml.match(/^[ \t]*Content-Security-Policy[ \t]*=[ \t]*"(.+)"[ \t]*$/m);
  return match ? match[1] : null;
}

/** The policy string rebuilt from the literal array in serve-with-csp.mjs. */
function fromServe() {
  const source = readFileSync(join(ROOT, 'scripts', 'serve-with-csp.mjs'), 'utf8');
  const block = source.match(/const CSP = \[([\s\S]*?)\]\.join\('; '\)/);
  if (!block) return null;
  const parts = [...block[1].matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  return parts.join('; ');
}

/** One directive's value, e.g. `connect-src` -> `'self' https://...`. */
function directive(policy, name) {
  const found = policy.split('; ').find((part) => part === name || part.startsWith(`${name} `));
  return found ?? '';
}

const vercel = fromVercel();
const netlify = fromNetlify();
const serve = fromServe();

check('vercel.json carries a CSP', typeof vercel === 'string' && vercel.length > 0, vercel?.length);
check('netlify.toml carries a CSP', typeof netlify === 'string' && netlify.length > 0, netlify?.length);
check('serve-with-csp.mjs carries a CSP', typeof serve === 'string' && serve.length > 0, serve?.length);

const allPresent = [vercel, netlify, serve].every((value) => typeof value === 'string' && value.length > 0);

if (allPresent) {
  check('vercel.json and netlify.toml are byte-identical', vercel === netlify, `${vercel.length} vs ${netlify.length}`);
  check('netlify.toml and serve-with-csp.mjs are byte-identical', netlify === serve, `${netlify.length} vs ${serve.length}`);

  const connect = directive(serve, 'connect-src');
  check('connect-src allows https://*.supabase.co', connect.includes('https://*.supabase.co'), connect);
  check('connect-src allows wss://*.supabase.co', connect.includes('wss://*.supabase.co'), connect);

  check('no unsafe-eval anywhere in the policy', !serve.includes('unsafe-eval'), serve.includes('unsafe-eval') ? 'found' : 'absent');

  const script = directive(serve, 'script-src');
  check("script-src does not carry 'unsafe-inline'", !script.includes('unsafe-inline'), script);
}

console.log('\n# csp parity');
console.log(results.join('\n'));
console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
