/**
 * Export conversions, run against the app's real `src/lib/parse.ts`.
 *
 * `check-features.mjs` used to re-implement `htmlToText`'s regexes inside the test, so a
 * broken conversion in the app kept the suite green. This suite imports the real functions
 * through the harness loader and asserts their actual output, including the builder the
 * "Export plain text" button calls (`entryAsText`). Pure Node, no browser: it belongs in
 * `npm test` so a regression fails CI rather than a manual sweep.
 *
 * Run: `node scripts/check-parse-export.mjs`
 */
import { entry, loadSrc, reporter } from './check-harness.mjs';

const { htmlToText, htmlToMarkdown } = await loadSrc('lib/parse.ts');
const { entryAsText } = await loadSrc('services/exportService.ts');

const { check, report } = reporter('export conversions');

// --- 1. The reported bug: paragraph breaks survive the plain-text conversion ----------
{
  const html = '<p>First para.</p><p>Second para.</p>';
  check('paragraphs keep their break', htmlToText(html) === 'First para.\nSecond para.', JSON.stringify(htmlToText(html)));
}
check(
  'a hard break becomes a newline',
  htmlToText('line one<br>line two') === 'line one\nline two',
  JSON.stringify(htmlToText('line one<br>line two')),
);
check(
  'list items become their own lines',
  htmlToText('<ul><li>one</li><li>two</li></ul>') === 'one\ntwo',
  JSON.stringify(htmlToText('<ul><li>one</li><li>two</li></ul>')),
);
check(
  'entities decode after tags are stripped',
  htmlToText('<p>&lt;3 &amp; more</p>') === '<3 & more',
  JSON.stringify(htmlToText('<p>&lt;3 &amp; more</p>')),
);

// --- 2. Markdown export shares the block-boundary rule --------------------------------
check(
  'markdown headings and bold survive',
  htmlToMarkdown('<h1>Title</h1><p><strong>bold</strong></p>') === '# Title\n\n**bold**',
  JSON.stringify(htmlToMarkdown('<h1>Title</h1><p><strong>bold</strong></p>')),
);

// --- 3. The whole plain-text builder the export button calls --------------------------
{
  const text = entryAsText(entry('export', { title: 'T', content: '<p>First para.</p><p>Second para.</p>' }));
  check('entryAsText keeps the paragraph break', text.includes('First para.\nSecond para.'), JSON.stringify(text));
  check('entryAsText starts with the title', text.startsWith('T\n'), JSON.stringify(text.slice(0, 20)));
}

process.exit(report() === 0 ? 0 : 1);
