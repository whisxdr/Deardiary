/**
 * Structural invariants gate.
 *
 * The project rules (line ceilings per folder, no `any`, no `@ts-ignore`, no Unicode
 * emoji, no stray `console`) used to live only in prose: README, audit prompts, PR
 * notes. Prose decays. This script turns each rule into an exit code so a violation
 * fails CI instead of relying on someone remembering to look.
 *
 * Legacy debt is frozen in `scripts/.invariants-baseline.json`:
 *   - a file already over its ceiling may not grow past its recorded size
 *   - a violation not in the baseline fails immediately
 *   - a baseline entry that no longer violates is reported so the file can shrink
 *
 * The baseline is a ratchet, not an amnesty. Run `--update` only after a fix lands,
 * never to silence a regression.
 *
 * Usage:
 *   node scripts/check-invariants.mjs           # verify (CI + pre-commit)
 *   node scripts/check-invariants.mjs --update  # rewrite baseline from current state
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'src');
const BASELINE_PATH = join(ROOT, 'scripts', '.invariants-baseline.json');
const UPDATE = process.argv.includes('--update');

/** Line ceilings. The most specific matching folder wins; ABS applies to every file. */
const LINE_LIMITS = [
  { folder: 'pages', max: 100 },
  { folder: 'hooks', max: 80 },
  { folder: 'services', max: 120 },
  { folder: 'utils', max: 50 },
  { folder: 'components', max: 150 },
];
const ABSOLUTE_MAX = 200;

/** Files allowed to log on purpose. Everything else must surface state through the UI. */
const CONSOLE_ALLOW = new Set(['src/components/common/ErrorBoundary.tsx']);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
const RULES = [
  {
    id: 'any',
    test: (line) => /:\s*any\b|\bas\s+any\b|<any>/.test(line),
    message: 'explicit `any` — use `unknown` and narrow, or a real type',
  },
  {
    id: 'ts-suppress',
    test: (line) => /@ts-ignore|@ts-expect-error/.test(line),
    message: 'compiler suppression — fix the type instead',
  },
  {
    id: 'emoji',
    test: (line) => EMOJI.test(line),
    message: 'Unicode emoji — use a Phosphor icon or a custom SVG mood icon',
  },
];

/** Recursively collect .ts/.tsx files under src. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

/** Project-relative path with forward slashes, so the baseline is stable on Windows. */
const toKey = (abs) => relative(ROOT, abs).split(sep).join('/');

function limitFor(key) {
  for (const { folder, max } of LINE_LIMITS) {
    if (key.startsWith(`src/${folder}/`)) return { max, folder };
  }
  return null;
}

const findings = [];

for (const file of walk(SRC)) {
  const key = toKey(file);
  const text = readFileSync(file, 'utf8');
  // Count the way an editor numbers lines: a trailing newline closes the last line
  // rather than opening an empty one. Without this, a 100-line file reads as 101 and
  // every ceiling is off by one.
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const count = lines.length;

  // Line ceilings, including the absolute one every file shares.
  const scoped = limitFor(key);
  const cap = Math.min(scoped ? scoped.max : Infinity, ABSOLUTE_MAX);
  if (count > cap) {
    const rule = count > ABSOLUTE_MAX ? `absolute ${ABSOLUTE_MAX}` : `${scoped.folder} ${scoped.max}`;
    findings.push({ key, rule: 'line-limit', detail: `${count} lines over ${rule}`, count });
  }

  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.test(line)) {
        findings.push({ key, rule: rule.id, detail: `${rule.message} (line ${i + 1})`, count: 0 });
      }
    }
    if (/\bconsole\.(log|warn|info|debug|error)\(/.test(line) && !CONSOLE_ALLOW.has(key)) {
      findings.push({ key, rule: 'console', detail: `stray logging (line ${i + 1})`, count: 0 });
    }
  });
}

// A file may hold several non-size findings; key them by rule so the baseline is precise.
const fingerprint = (f) => `${f.key}::${f.rule}`;

if (UPDATE) {
  const next = { version: 1, note: 'Frozen legacy debt. May shrink, never grow. Regenerate only after a fix.', grandfathered: {} };
  for (const f of findings) next.grandfathered[fingerprint(f)] = f.count;
  writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + '\n');
  console.log(`baseline written: ${findings.length} entries -> ${toKey(BASELINE_PATH)}`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).grandfathered ?? {}
  : {};

const blocking = [];
const frozen = [];
const shrinkable = [];
const seen = new Set();

for (const f of findings) {
  const id = fingerprint(f);
  seen.add(id);
  const allowed = baseline[id];

  if (allowed === undefined) {
    blocking.push({ ...f, why: 'new violation' });
  } else if (f.rule === 'line-limit' && f.count > allowed) {
    blocking.push({ ...f, why: `grew from ${allowed} to ${f.count}` });
  } else {
    frozen.push({ ...f, why: f.rule === 'line-limit' ? `${f.count}/${allowed}` : 'grandfathered' });
  }
}

for (const id of Object.keys(baseline)) {
  if (!seen.has(id)) shrinkable.push(id);
}

const group = (list) => {
  const byRule = new Map();
  for (const f of list) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }
  for (const [rule, items] of byRule) {
    console.log(`\n  ${rule} (${items.length})`);
    for (const f of items.sort((a, b) => b.count - a.count)) {
      console.log(`    ${f.key}  —  ${f.detail}  [${f.why}]`);
    }
  }
};

console.log(`invariants: ${findings.length} finding(s), ${blocking.length} blocking, ${frozen.length} frozen`);

if (frozen.length) {
  console.log('\n  FROZEN (in baseline — must shrink, may not grow)');
  group(frozen);
}

if (shrinkable.length) {
  console.log(`\n  SHRINKABLE (${shrinkable.length}) — these now pass; run --update to lock the gain`);
  for (const id of shrinkable) console.log(`    ${id}`);
}

if (blocking.length) {
  console.log('\n  BLOCKING');
  group(blocking);
  console.log(`\nFAIL: ${blocking.length} blocking violation(s). Fix them; do not add to the baseline.`);
  process.exit(1);
}

console.log('\nPASS: no new structural violations');
