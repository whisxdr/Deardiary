/**
 * Turns cloud sync on for this checkout, or tells you exactly what is missing.
 *
 * Sync is build-time: Vite inlines `VITE_*` into the bundle, so enabling it means writing the
 * two values into `.env.local` and rebuilding. This script does that and then verifies the
 * result, because a wrong value fails silently — the Account section simply does not render
 * and nothing reaches the network.
 *
 * Usage:
 *   node scripts/activate-supabase.mjs <project-url> <anon-key>
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/activate-supabase.mjs
 *   node scripts/activate-supabase.mjs --off     # remove the local override
 *
 * Get both values from Supabase: Project Settings > API.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, '.env.local');

const args = process.argv.slice(2);
const off = args.includes('--off');

if (off) {
  if (existsSync(ENV_FILE)) {
    rmSync(ENV_FILE);
    console.log(`Removed ${ENV_FILE}. Sync is off again; rebuild to apply.`);
  } else {
    console.log(`${ENV_FILE} does not exist; sync is already off.`);
  }
  process.exit(0);
}

const url = (args[0] ?? process.env.SUPABASE_URL ?? '').trim();
const key = (args[1] ?? process.env.SUPABASE_ANON_KEY ?? '').trim();

/** A project URL must be an https origin; the anon key is a JWT. */
function validate(url, key) {
  const problems = [];
  if (!url) problems.push('project URL is missing (first argument or SUPABASE_URL)');
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url)) {
    problems.push(`project URL looks wrong: ${url} (expected https://<ref>.supabase.co)`);
  }
  if (!key) problems.push('anon key is missing (second argument or SUPABASE_ANON_KEY)');
  else if (!key.startsWith('eyJ') && !key.startsWith('sb_publishable_')) {
    problems.push('anon key does not look like a Supabase anon/publishable key');
  }
  return problems;
}

const problems = validate(url, key);
if (problems.length > 0) {
  console.error('Cannot activate sync yet:\n');
  problems.forEach((problem) => console.error(`  - ${problem}`));
  console.error(`
Get both values from your Supabase project: Project Settings > API.
Then run one of:

  node scripts/activate-supabase.mjs https://<ref>.supabase.co <anon-key>
  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<anon-key> node scripts/activate-supabase.mjs

Before that, on the Supabase side:
  1. Run supabase/migrations/20261001000000_entries.sql (SQL editor or \`supabase db push\`).
  2. Add {{ .Token }} to BOTH email templates: Confirm signup and Magic Link.

Or run the whole backend locally instead (needs Docker):
  npx supabase start        # prints an API URL and anon key to paste here
`);
  process.exit(1);
}

// Keep any non-Supabase lines the developer already had, and never duplicate the pair.
const kept = existsSync(ENV_FILE)
  ? readFileSync(ENV_FILE, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !/^\s*VITE_SUPABASE_(URL|ANON_KEY)\s*=/.test(line))
  : [];

const body = [
  ...kept,
  '# Written by scripts/activate-supabase.mjs. Vite inlines these at build time.',
  `VITE_SUPABASE_URL=${url}`,
  `VITE_SUPABASE_ANON_KEY=${key}`,
  '',
].join('\n');

writeFileSync(ENV_FILE, body);
console.log(`Wrote ${ENV_FILE}`);
console.log(`  VITE_SUPABASE_URL=${url}`);
console.log('  VITE_SUPABASE_ANON_KEY=<hidden>');
console.log('\nNext: npm run build  (then reload the app; the Account section appears in Settings)');
