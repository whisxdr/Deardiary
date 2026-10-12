import { useState } from 'react';
import { avatarUrl, type AvatarGender } from '@/constants/avatar';
import { cn } from '@/utils';
import { initials } from '@/utils/string';

export interface AvatarProps {
  name: string;
  /** DiceBear seed; when omitted the initials fallback is used. */
  seed?: string;
  /** Portrait presentation for the seed; defaults to the man set. */
  gender?: AvatarGender;
  /** Pinned hairstyle; without one DiceBear picks from the whole style. */
  hair?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const;

/**
 * Profile portrait from DiceBear, with an initials fallback.
 *
 * The portrait is fetched from the DiceBear CDN, so it falls back to local initials
 * when the browser is offline or the request is blocked.
 */
export function Avatar({ name, seed, gender = 'man', hair, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPortrait = Boolean(seed) && !failed;

  return (
    <span
      aria-label={`${name} avatar`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent-gold/60 bg-primary-700',
        'font-display text-accent-cream shadow-soft',
        SIZES[size],
        className,
      )}
    >
      {showPortrait ? (
        <img
          src={avatarUrl(seed as string, gender, hair)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
