/**
 * The content clip path: the character budget must never eat an image payload.
 *
 * Guards the regression that made every uploaded photo disappear on reload: the 20,000
 * character cap was a plain `.slice()` over the whole body, and a base64 photo is
 * hundreds of thousands of characters, so the first save cut the data URL to a fragment
 * and the entry came back with a broken image.
 *
 *   1. Under-budget bodies pass through untouched.
 *   2. A photo payload survives clipping at full length, interleaved with its text.
 *   3. Plain text over the budget is still clipped, so the storage bound still holds.
 *   4. Text over the budget next to a photo keeps the photo and clips only the words.
 *   5. A cut landing mid-token drops that image whole — no mangled half-URL is stored.
 *   6. `stripImageDataUrls` removes payloads and leaves the surrounding text.
 *   7. `createEntry` and `updateEntry` route through the same clip, not a raw slice.
 *
 * Pure Node, no browser: the payloads here are short stand-ins for real base64; what is
 * proven is the boundary arithmetic and the token round-trip, which is where the bug
 * lived. Run: `node scripts/check-content-clip.mjs`
 */
import { entry, loadSrc, reporter } from './check-harness.mjs';

const { clipContent, stripImageDataUrls } = await loadSrc('lib/contentClip.ts');
const { LIMITS } = await loadSrc('constants/limits.ts');
const { createEntry, updateEntry } = await loadSrc('services/entryWrite.ts');

const { check, report } = reporter('content clip');

/** A stand-in photo payload: a well-formed data URL of `size` base64 characters. */
function payload(size) {
  return `data:image/jpeg;base64,${'A'.repeat(size)}`;
}

const TEXT = 'word ';

// --- 1. Under-budget bodies pass through untouched ------------------------------------
{
  const html = `<p>${TEXT.repeat(10)}<img src="${payload(50)}"></p>`;
  check('an under-budget body is returned unchanged', clipContent(html) === html);
  check('a body exactly at the budget is untouched', clipContent('x'.repeat(LIMITS.contentMaxLength)).length === LIMITS.contentMaxLength);
}

// --- 2. A photo payload survives clipping ----------------------------------------------
{
  const image = payload(300_000);
  const html = `<p>before <img src="${image}"> after</p>`;
  const clipped = clipContent(html);
  check('a large photo survives clipping at full length', clipped.includes(image), `kept ${clipped.split(image).length - 1} of 1 payloads`);
  check('the text around the photo survives', clipped.includes('before ') && clipped.includes(' after'));
  check('the img tag stays whole', /<img src="data:image\/jpeg;base64,A+"\s*\/?>/.test(clipped));
}

// --- 3. Plain text is still clipped, so the storage bound holds -------------------------
{
  const html = `<p>${TEXT.repeat(60_000)}</p>`;
  const clipped = clipContent(html);
  check('plain text over the budget is clipped', clipped.length === LIMITS.contentMaxLength, `len=${clipped.length}`);
  check('clipped text keeps its prefix', clipped.startsWith('<p>word word'));
}

// --- 4. Text over budget next to a photo: clip the words, keep the photo -----------------
{
  const image = payload(200_000);
  const html = `<p>${TEXT.repeat(30_000)}<img src="${image}"> ${TEXT.repeat(30_000)}</p>`;
  const clipped = clipContent(html);
  const textLength = stripImageDataUrls(clipped).length;
  check('the photo survives next to over-budget text', clipped.includes(image));
  check('the words are clipped to the budget', textLength <= LIMITS.contentMaxLength, `text=${textLength}`);
  check('clipped words keep their prefix', clipped.startsWith('<p>word word'));
  check('no dangling half-URL is stored', (clipped.match(/data:image\/jpeg;base64,A+/g) ?? []).every((m) => m === image));
}

// --- 5. Multiple payloads and the dangling-token edge ------------------------------------
{
  const first = payload(150_000);
  const second = payload(150_000);
  const html = `<p>${TEXT.repeat(15_000)}<img src="${first}"> mid <img src="${second}"> end</p>`;
  const clipped = clipContent(html);
  const kept = [first, second].filter((p) => clipped.includes(p)).length;
  check('both payloads or a clean drop — never a fragment', [first, second].every((p) => clipped.includes(p) || !clipped.includes(p.slice(0, 100))), `kept ${kept} of 2`);
  check('no truncated payload remains when one is dropped', (clipped.match(/data:image\/jpeg;base64,A+/g) ?? []).every((m) => m === first || m === second));
}

// --- 6. stripImageDataUrls removes payloads, keeps text -----------------------------------
{
  const image = payload(1_000);
  const text = stripImageDataUrls(`<p>hello <img src="${image}"> world</p>`);
  check('payloads are removed', !text.includes('data:image'));
  check('surrounding text is kept', text === '<p>hello <img src=""> world</p>');
  check('payload-free bodies are unchanged', stripImageDataUrls('<p>plain</p>') === '<p>plain</p>');
}

// --- 7. The write services route through the same clip ------------------------------------
{
  const storage = globalThis.localStorage;
  storage.clear();
  const image = payload(300_000);
  const created = createEntry({ title: 't', content: `<p>${TEXT.repeat(5)}<img src="${image}"></p>` });
  check('createEntry stores the full payload', created.content.includes(image));
  const updated = updateEntry(created.id, { content: `<p><img src="${image}"> ${TEXT.repeat(40_000)}</p>` });
  check('updateEntry stores the full payload', updated.content.includes(image));
  check('updateEntry still clips the words', stripImageDataUrls(updated.content).length <= LIMITS.contentMaxLength, `text=${stripImageDataUrls(updated.content).length}`);
  storage.clear();
}

process.exit(report() === 0 ? 0 : 1);
