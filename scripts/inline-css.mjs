/**
 * Inlines the built stylesheet into dist/index.html.
 *
 * The stylesheet is render-blocking, and on a slow link it is a round trip in front of the
 * first paint: the browser had the HTML at 300 ms and painted at 1.4 s. The whole sheet is
 * under 40 KB raw (8 KB gzip), which is cheaper to carry in the document than to fetch
 * before anything may be shown. This runs after `vite build` so the HTML that ships is the
 * one the host serves; the dev server keeps the normal <link>.
 *
 * Run: `npm run build` (chained), or `node scripts/inline-css.mjs` on an existing dist.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');
const htmlPath = join(DIST, 'index.html');
const html = readFileSync(htmlPath, 'utf8');

const link = html.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/);
if (!link) {
  console.log('inline-css: no stylesheet link in dist/index.html (already inlined?)');
} else {
  const file = join(DIST, link[1].replace('/assets/', 'assets/'));
  const css = readFileSync(file, 'utf8');
  // A literal </style> inside the sheet would close the tag early; none is expected, and
  // failing loudly beats shipping a truncated stylesheet.
  if (css.includes('</style')) {
    throw new Error(`${link[1]} contains a closing style tag and cannot be inlined`);
  }
  writeFileSync(htmlPath, html.replace(link[0], `<style>${css}</style>`));
  console.log(`inline-css: inlined ${link[1]} (${(css.length / 1024).toFixed(1)} KB) into index.html`);
}

// The sheet stays on disk even though the document no longer links it: Vite's dynamic
// import helper lists it as a dependency of the lazy chunks, and a deleted file made every
// such import fail — which silently killed the PDF export, whose libraries load that way.
// The request is one cached file, and the first paint no longer waits for it.
