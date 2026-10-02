/**
 * XSS sanitization, run against the real DOMPurify inside the built bundle.
 *
 * `src/lib/sanitize.ts` is a security path: an imported backup or a pulled record can carry
 * arbitrary markup, and the reader injects the stored body with `dangerouslySetInnerHTML`.
 * The pure Node suites alias DOMPurify to a pass-through stub, so they cannot test this, and
 * no DOM implementation is available to plain Node here (`jsdom` is not a dependency, and
 * adding one is out of scope). This suite therefore drives the real browser bundle and lets
 * the app sanitize through its own two paths: `coerceEntry` on read (the repair-on-read path
 * an imported backup takes) and `ReaderContent` on render. Nothing is stubbed.
 *
 * Note on what proves what: the test server sends `script-src 'self'`, so a surviving
 * `onerror=` handler would not execute anyway. The load-bearing assertions are therefore the
 * DOM-shape and storage-content ones — a pass-through stub cannot satisfy them — with the
 * execution probe kept as a secondary signal.
 *
 * Run with the CSP server up: `node scripts/serve-with-csp.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
// This suite clears localStorage. Refuse to run against anything but a local origin, so a
// stray BASE_URL can never wipe a real deployment's storage.
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(BASE)) {
  console.error(`Refusing to run: ${BASE} is not a local origin, and this script clears storage.`);
  process.exit(1);
}

const results = [];
let failed = 0;

function check(name, pass, detail) {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failed += 1;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

/** Executable markup, one vector per family the audit named. */
const DANGEROUS = [
  '<script>window.__xss=1</script>',
  '<img src=x onerror="window.__xss=2">',
  '<a href="javascript:window.__xss=3">js link</a>',
  '<a href="data:text/html,<script>alert(1)</script>">data link</a>',
  '<iframe src="https://example.com"></iframe>',
  '<svg onload="window.__xss=4"></svg>',
  '<p onclick="window.__xss=5">clickable</p>',
  '<form action="https://evil.example"><input name="x"></form>',
  '<object data="x"></object>',
  '<embed src="x">',
  '<style>body{display:none}</style>',
].join('');

/** Markup the editor produces, which must survive unchanged. Only attributes that the
 *  app's own `ALLOWED_URI_REGEXP` accepts are included; see the link checks below. */
const SAFE = [
  '<p>Hello <strong>bold</strong> and <em>em</em></p>',
  '<a href="https://example.com/page" title="tip">outbound</a>',
  '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="dot">',
  '<ul><li>one</li></ul>',
  '<h2>Heading</h2>',
  '<blockquote>quote</blockquote>',
  '<pre><code>code</code></pre>',
  '<hr>',
].join('');

const now = new Date().toISOString();
/** A shape-complete record; `missing` names the field to omit so `needsRepair` fires. */
const record = (id, content, missing) => {
  const base = {
    id,
    title: `title-${id}`,
    content,
    mood: 'calm',
    tags: [],
    date: now,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isPrivate: false,
    wordCount: 1,
    readingTime: 1,
  };
  delete base[missing];
  return base;
};

try {
  // --- 1. The render path sanitizes on its own, independent of the repair heuristic -----
  // `looksUnsafe` does not flag `<table>`, so nothing rewrites this record: storage keeps the
  // table while the reader shows it stripped. Seeded alone so a sibling record's repair
  // (which writes back every coerced record) cannot sanitize it as a side effect. That
  // isolates `ReaderContent`'s `sanitizeEntryHtml` call as the thing doing the work.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    (renderOnly) => {
      window.localStorage.clear();
      window.localStorage.setItem('deardiary:entries', JSON.stringify([renderOnly]));
    },
    record('render-only', '<table><tr><td>cell</td></tr></table><p>after</p>', 'nonexistent-field'),
  );
  await page.goto(`${BASE}/entry/render-only`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const renderOnlyStored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('deardiary:entries') ?? '[]'),
  );
  check(
    'a <table> is not a repair trigger, so storage keeps it',
    (renderOnlyStored[0]?.content ?? '').includes('<table>'),
    (renderOnlyStored[0]?.content ?? 'missing').slice(0, 40),
  );
  const renderOnly = await page.evaluate(() => {
    const body = document.querySelector('.entry-body');
    return { hasTable: body ? body.querySelector('table') !== null : null, text: body?.textContent ?? '' };
  });
  check('the reader strips the table even though storage was not repaired', renderOnly.hasTable === false, `hasTable=${renderOnly.hasTable}`);
  check('the table cell text is kept', renderOnly.text.includes('cell') && renderOnly.text.includes('after'), JSON.stringify(renderOnly.text.slice(0, 40)));

  // --- 2. The XSS vectors, through the repair-on-read path ------------------------------
  // The XSS record is deliberately shape-complete: the only repair trigger is `looksUnsafe`
  // seeing the markup. The safe record omits `wordCount` so a rewrite is forced and the
  // sanitizer's exact output for allowed markup can be read back from storage.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([xss, safe]) => {
      window.localStorage.clear();
      window.localStorage.setItem('deardiary:entries', JSON.stringify([xss, safe]));
    },
    [record('xss-all', DANGEROUS + SAFE, 'nonexistent-field'), record('safe-probe', SAFE, 'wordCount')],
  );

  await page.goto(`${BASE}/entry/xss-all`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // --- 3. The render path's DOM is clean, with the allowed markup intact -----------------
  const dom = await page.evaluate(() => {
    const body = document.querySelector('.entry-body');
    if (!body) return null;
    const elements = Array.from(body.querySelectorAll('*'));
    const onAttrs = [];
    const badUri = [];
    for (const el of elements) {
      for (const attr of Array.from(el.attributes)) {
        if (/^on/i.test(attr.name)) onAttrs.push(`${el.tagName.toLowerCase()}[${attr.name}]`);
        if (
          /^(href|src|xlink:href)$/i.test(attr.name) &&
          /^(javascript:|data:text\/html)/i.test(attr.value.trim())
        ) {
          badUri.push(`${el.tagName.toLowerCase()}[${attr.name}]`);
        }
      }
    }
    const link = body.querySelector('a[href="https://example.com/page"]');
    const image = body.querySelector('img[alt="dot"]');
    return {
      exists: true,
      forbidden: Array.from(body.querySelectorAll('script, iframe, object, embed, svg, form, style, table')).map((el) =>
        el.tagName.toLowerCase(),
      ),
      onAttrs,
      badUri,
      text: body.textContent ?? '',
      strong: body.querySelector('strong') !== null,
      em: body.querySelector('em') !== null,
      heading: body.querySelector('h2') !== null,
      list: body.querySelector('ul li') !== null,
      quote: body.querySelector('blockquote') !== null,
      code: body.querySelector('pre code') !== null,
      link: link ? { href: link.getAttribute('href') ?? '', rel: link.getAttribute('rel') ?? '', target: link.getAttribute('target') ?? '' } : null,
      image: image ? image.getAttribute('src') ?? '' : null,
      executed: window.__xss,
    };
  });

  check('the reader rendered the entry body', dom !== null && dom.exists);
  if (dom) {
    check('no script/iframe/object/embed/svg/form/style/table node survives', dom.forbidden.length === 0, dom.forbidden.join(', '));
    check('no on* event attribute survives', dom.onAttrs.length === 0, dom.onAttrs.join(', '));
    check('no javascript: or data:text/html URL survives', dom.badUri.length === 0, dom.badUri.join(', '));
    check('the stripped script body is not left as text', !dom.text.includes('window.__xss'), dom.text.slice(0, 60));
    check('no vector executed (window.__xss unset)', dom.executed === undefined, String(dom.executed));

    check('allowed markup: <strong> survives', dom.strong);
    check('allowed markup: <em> survives', dom.em);
    check('allowed markup: <h2> survives', dom.heading);
    check('allowed markup: <ul><li> survives', dom.list);
    check('allowed markup: <blockquote> survives', dom.quote);
    check('allowed markup: <pre><code> survives', dom.code);
    check(
      'allowed markup: the https link keeps its href',
      dom.link !== null && dom.link.href === 'https://example.com/page',
      JSON.stringify(dom.link),
    );
    // The security invariant, not the current spelling: either the link has no target, or it
    // has one and carries the opener protection. `target` and `rel` are dropped today because
    // the app's ALLOWED_URI_REGEXP accepts only URL-shaped values; this check stays valid if
    // that ever changes.
    check(
      'no link is left with a target but without rel=noopener',
      dom.link === null || dom.link.target === '' || /noopener/.test(dom.link.rel),
      JSON.stringify(dom.link),
    );
    check(
      'allowed markup: the data:image/png image survives',
      (dom.image ?? '').startsWith('data:image/png;base64,'),
      (dom.image ?? 'none').slice(0, 40),
    );
  }

  // --- 4. The repair-on-read path sanitized what it wrote back -------------------------
  // This is the assertion CSP cannot fake: only `sanitizeEntryHtml` can remove the markup
  // from the stored string, and this is exactly what an imported backup goes through.
  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('deardiary:entries') ?? '[]'),
  );
  const xssRecord = stored.find((item) => item.id === 'xss-all');
  const safeRecord = stored.find((item) => item.id === 'safe-probe');

  check('the repaired record is still stored', xssRecord !== undefined);
  if (xssRecord) {
    const content = xssRecord.content;
    const markers = ['<script', 'onerror', 'onclick', 'javascript:', 'data:text/html', '<iframe', '<svg', '<object', '<embed', '<form', '<style'];
    const leaked = markers.filter((marker) => content.toLowerCase().includes(marker));
    check('the stored body carries no executable marker', leaked.length === 0, leaked.join(', ') || 'clean');
    check('the stored body keeps the allowed markup', content.includes('<strong>bold</strong>'), content.slice(0, 60));
    check('the stored body keeps the image', content.includes('data:image/png;base64,'), content.includes('data:image/png;base64,') ? 'kept' : 'missing');
  }

  // --- 5. Allowed markup is left byte-identical by the real sanitizer -------------------
  check('the safe record was written back', safeRecord !== undefined);
  if (safeRecord) {
    check('safe markup passes the sanitizer byte-identical', safeRecord.content === SAFE, JSON.stringify(safeRecord.content.slice(0, 80)));
  }

  // --- 6. A clean, complete record is not rewritten at all ------------------------------
  // `looksUnsafe` must not fire on ordinary markup, or every read rewrites storage.
  const beforeRaw = await page.evaluate(() => window.localStorage.getItem('deardiary:entries'));
  await page.goto(`${BASE}/entry/safe-probe`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const afterRaw = await page.evaluate(() => window.localStorage.getItem('deardiary:entries'));
  check('reading a clean diary does not rewrite storage', beforeRaw === afterRaw, beforeRaw === afterRaw ? 'unchanged' : 'rewritten');
} catch (error) {
  check('script completed', false, error.message);
} finally {
  const realErrors = consoleErrors.filter((text) => !/favicon|Download the React DevTools/i.test(text));
  check('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
