import { LIMITS } from '@/constants';

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Largest centered rectangle of `ratio` that fits inside the source, in whole pixels. */
export function cropToAspect(width: number, height: number, ratio: number): CropRect {
  let sw = width;
  let sh = Math.round(width / ratio);
  if (sh > height) {
    sh = height;
    sw = Math.round(height * ratio);
  }
  return { sx: Math.floor((width - sw) / 2), sy: Math.floor((height - sh) / 2), sw, sh };
}

/** Scales down so the longest side fits `maxDimension`. Never upscales. */
export function fitWithin(width: number, height: number, maxDimension: number): Size {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Decodes a file into a bitmap, preferring the off-main-thread path. */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Encodes a bitmap region as a JPEG data URL. */
function encode(source: CanvasImageSource, crop: CropRect, size: Size): string {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  // JPEG has no alpha: without an opaque fill, transparent pixels encode as black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, size.width, size.height);
  return canvas.toDataURL('image/jpeg', LIMITS.imageQuality);
}

/**
 * Crops a user-selected image file to 4:3, downscales it and JPEG-compresses it into a
 * `data:` URL, which is the only shape the local-only storage can persist.
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');
  if (file.size > LIMITS.imageFileMaxBytes) throw new Error('That image is larger than 10 MB.');

  const bitmap = await decode(file);
  const crop = cropToAspect(bitmap.width, bitmap.height, LIMITS.imageAspectRatio);
  // Scaled from the cropped region, not the source: fitting the source first would keep
  // the source's aspect ratio and stretch the 4:3 crop back out to it.
  const size = fitWithin(crop.sw, crop.sh, LIMITS.imageMaxDimension);
  try {
    return encode(bitmap, crop, size);
  } finally {
    if ('close' in bitmap) bitmap.close();
  }
}
