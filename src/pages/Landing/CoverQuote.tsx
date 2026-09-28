import { BookOpen } from '@phosphor-icons/react';
import { quoteForDate } from '@/constants';

export interface CoverQuoteProps {
  quote?: string;
}

/** Daily quote shown near the bottom of the leather cover. */
export function CoverQuote({ quote }: CoverQuoteProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-hand text-2xl text-accent-gold sm:text-3xl">{quote ?? quoteForDate(new Date())}</p>
      <BookOpen size={20} weight="duotone" aria-hidden="true" className="text-accent-gold/70" />
    </div>
  );
}
