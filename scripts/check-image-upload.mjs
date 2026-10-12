/**
 * The image-upload path: crop geometry, downscale clamping and the input contract.
 *
 * Guards the math that decides which pixels of a user's photo survive the 4:3 center crop
 * and the 1600px downscale. An off-by-one here reads outside the source image and either
 * throws or silently drags in transparent pixels, which is invisible until someone opens
 * the saved entry.
 *
 *   1. `cropToAspect` returns a centered rect that never leaves the source bounds — the
 *      invariant checked exhaustively over small dimensions, not just at spot values.
 *   2. It is exactly 4:3 wherever whole pixels can represent it, and collapses to the
 *      smallest covering rect (never below 1px) where they cannot.
 *   3. `fitWithin` clamps the longest side of either orientation and never upscales.
 *   4. `imageFileToDataUrl` rejects non-images and files past the size limit before any
 *      decoding work.
 *
 * Pure Node, no browser. There is no `document`, no `canvas`, no `createImageBitmap` and
 * no jsdom, so the suite deliberately does NOT cover: the actual decode, the drawImage
 * call, the JPEG encoder, the `image/jpeg` prefix of the returned URL, or the whitespace
 * fill for transparent source pixels. Those need a real encoder and belong in a browser
 * test. What is proven here is the geometry the encoder is fed and the guard contract
 * around it; a case that needs a canvas asserts only that it got past the guards.
 *
 * Run: `node scripts/check-image-upload.mjs`
 */
import { loadSrc, reporter } from './check-harness.mjs';

const { cropToAspect, fitWithin, imageFileToDataUrl } = await loadSrc('lib/imageFile.ts');
const { LIMITS } = await loadSrc('constants/limits.ts');

const { check, report } = reporter('image upload');

check('the module exports the three helpers the editor calls', [cropToAspect, fitWithin, imageFileToDataUrl].every((fn) => typeof fn === 'function'));
check('the geometry constants are the agreed values', LIMITS.imageMaxDimension === 1600 && LIMITS.imageAspectRatio === 4 / 3 && LIMITS.imageQuality === 0.8, `max=${LIMITS.imageMaxDimension} ratio=${LIMITS.imageAspectRatio} q=${LIMITS.imageQuality}`);

// --- 1. A crop rect never reads outside the source -------------------------------------
// A source without enough pixels for a whole 4:3 rect degenerates to 1px; what must hold
// in every case is that the rect stays inside the source.
{
  const outside = [];
  const degenerate = [];
  const offCenter = [];
  for (let w = 1; w <= 120; w += 1) {
    for (let h = 1; h <= 120; h += 1) {
      const { sx, sy, sw, sh } = cropToAspect(w, h, LIMITS.imageAspectRatio);
      if (sx < 0 || sy < 0 || sw < 1 || sh < 1 || sx + sw > w || sy + sh > h) outside.push(`${w}x${h}`);
      if (sw !== w && sh !== h) degenerate.push(`${w}x${h}`);
      // Floor of the ideal center. An off-by-one origin (ceil) still fits inside the
      // source, so bounds alone cannot catch it — the exact origin has to be pinned.
      if (sx !== Math.floor((w - sw) / 2) || sy !== Math.floor((h - sh) / 2)) offCenter.push(`${w}x${h}`);
      if (Math.abs(w - sw - 2 * sx) > 1 || Math.abs(h - sh - 2 * sy) > 1) offCenter.push(`pad ${w}x${h}`);
    }
  }
  check('the crop stays inside the source for every shape up to 120px', outside.length === 0, outside.slice(0, 5).join(','));
  check('the crop touches at least one full edge, so the rect is maximal', degenerate.length === 0, degenerate.slice(0, 5).join(','));
  check('every crop is floored from the exact center', offCenter.length === 0, offCenter.slice(0, 5).join(','));
}

// --- 2. The crop is centered and exactly 4:3 where pixels allow ------------------------
{
  const landscape = cropToAspect(1600, 1200, LIMITS.imageAspectRatio);
  check('an already-4:3 source is cropped not at all', landscape.sx === 0 && landscape.sy === 0 && landscape.sw === 1600 && landscape.sh === 1200, JSON.stringify(landscape));

  const square = cropToAspect(100, 100, LIMITS.imageAspectRatio);
  check('a square source is cropped to its full width', square.sw === 100 && square.sx === 0, JSON.stringify(square));
  // 100 - 75 is an odd remainder, so the two trims cannot be equal: floor leaves 12 above
  // and 13 below. Centering here means within one pixel, which is the best whole pixels allow.
  check('a square source is trimmed evenly top and bottom to within one pixel', Math.abs(100 - square.sh - 2 * square.sy) <= 1, `sy=${square.sy} sh=${square.sh}`);

  const wide = cropToAspect(6000, 500, LIMITS.imageAspectRatio);
  check('a panorama is cropped to its full height', wide.sh === 500 && wide.sy === 0, JSON.stringify(wide));
  check('a panorama is centered horizontally', wide.sx === Math.floor((6000 - wide.sw) / 2), `sx=${wide.sx} sw=${wide.sw}`);

  const tall = cropToAspect(500, 6000, LIMITS.imageAspectRatio);
  check('a very tall image is cropped to its full width', tall.sw === 500 && tall.sx === 0, JSON.stringify(tall));
  check('a very tall image is centered vertically', tall.sy === Math.floor((6000 - tall.sh) / 2), `sy=${tall.sy} sh=${tall.sh}`);

  // Rounding is where the bugs live: a 101x100 source yields sh=76, whose bottom edge must
  // still land inside 100 even though 76 is not 101/(4/3) exactly.
  const odd = cropToAspect(101, 100, LIMITS.imageAspectRatio);
  check('an odd width rounds the crop height, not the source', odd.sw === 101 && odd.sh === Math.round(101 / (4 / 3)), JSON.stringify(odd));
  check('the rounded crop still ends inside the source', odd.sy + odd.sh <= 100, `sy+sh=${odd.sy + odd.sh}`);

  const divisible = [];
  for (let w = 4; w <= 120; w += 1) {
    for (let h = 3; h <= 120; h += 1) {
      const { sw, sh } = cropToAspect(w, h, LIMITS.imageAspectRatio);
      if (sw < w && sh < h) divisible.push(`${w}x${h}`);
      if (Math.abs(sw / sh - LIMITS.imageAspectRatio) > 1 / sh) divisible.push(`${w}x${h}=${sw}/${sh}`);
    }
  }
  check('the crop is 4:3 to within one pixel wherever it can represent it', divisible.length === 0, divisible.slice(0, 5).join(','));

  const tiny = cropToAspect(1, 1, LIMITS.imageAspectRatio);
  check('a 1x1 source still yields a usable 1px region', tiny.sw === 1 && tiny.sh === 1 && tiny.sx === 0 && tiny.sy === 0, JSON.stringify(tiny));
}

// --- 3. fitWithin clamps the longest side and never upscales ---------------------------
{
  const big = fitWithin(3200, 2400, LIMITS.imageMaxDimension);
  check('a large landscape is clamped to the longest side', big.width === 1600 && big.height === 1200, JSON.stringify(big));

  const tall = fitWithin(100, 3200, LIMITS.imageMaxDimension);
  check('a tall image is clamped on its height instead', tall.height === 1600 && tall.width === 50, JSON.stringify(tall));

  const small = fitWithin(800, 600, LIMITS.imageMaxDimension);
  check('a source under the limit is not upscaled', small.width === 800 && small.height === 600, JSON.stringify(small));

  const exact = fitWithin(1600, 1600, LIMITS.imageMaxDimension);
  check('a source exactly at the limit is left alone', exact.width === 1600 && exact.height === 1600, JSON.stringify(exact));

  const drift = [];
  for (let w = 1; w <= 400; w += 1) {
    for (let h = 1; h <= 400; h += 1) {
      const fit = fitWithin(w, h, LIMITS.imageMaxDimension);
      if (fit.width < 1 || fit.height < 1) drift.push(`collapsed ${w}x${h}`);
      if (w <= 1600 && h <= 1600 && (fit.width !== w || fit.height !== h)) drift.push(`upscaled ${w}x${h}`);
      if (Math.abs(fit.width / fit.height - w / h) > 0.02) drift.push(`distorted ${w}x${h}`);
    }
  }
  check('downscaling keeps the aspect ratio and never collapses a side', drift.length === 0, drift.slice(0, 5).join(','));
}

// --- 4. The upload contract rejects bad input before touching a decoder -----------------
// These paths are real assertions: the guard runs before `decode`, so no DOM is needed.
{
  const rejects = async (file) => {
    try {
      await imageFileToDataUrl(file);
      return false;
    } catch {
      return true;
    }
  };

  check('a non-image file is rejected', await rejects({ type: 'text/plain', size: 128 }));
  check('a PDF is rejected', await rejects({ type: 'application/pdf', size: 128 }));
  check('an image over the size limit is rejected', await rejects({ type: 'image/png', size: LIMITS.imageFileMaxBytes + 1 }));
  check('the size limit is a boundary, not a guideline', LIMITS.imageFileMaxBytes === 10 * 1024 * 1024, `${LIMITS.imageFileMaxBytes} bytes`);
  // One byte either side of the limit: the oversize message must fire before decoding, so
  // the two cases differ by whether the refusal reached the decoder rather than by type.
  const overMessage = await imageFileToDataUrl({ type: 'image/png', size: LIMITS.imageFileMaxBytes + 1 }).catch((e) => e.message);
  const atLimit = await imageFileToDataUrl({ type: 'image/png', size: LIMITS.imageFileMaxBytes }).catch((e) => e.message);
  check('the oversize refusal is the size guard, not the decoder', /larger than/i.test(overMessage), overMessage);
  check('a file exactly at the limit clears the guard into decoding', !/larger than/i.test(atLimit), atLimit);
}

process.exit(report() === 0 ? 0 : 1);
