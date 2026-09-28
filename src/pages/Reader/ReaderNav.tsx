import { ArrowLeft, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { IconButton } from '@/components/common';
import { ROUTES } from '@/constants';

export interface ReaderNavProps {
  position: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** Back link plus previous/next page controls and the "3 of 24" indicator. */
export function ReaderNav({ position, total, hasPrevious, hasNext, onPrevious, onNext }: ReaderNavProps) {
  return (
    <nav aria-label="Entry navigation" className="flex items-center justify-between gap-3">
      <Link to={ROUTES.dashboard}>
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} weight="regular" aria-hidden="true" />
          All entries
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <IconButton
          label="Previous entry"
          onClick={onPrevious}
          disabled={!hasPrevious}
          icon={<CaretLeft size={16} aria-hidden="true" />}
        />
        <span aria-live="polite" className="font-mono text-xs text-primary-500 dark:text-primary-300">
          {`${position} of ${total}`}
        </span>
        <IconButton
          label="Next entry"
          onClick={onNext}
          disabled={!hasNext}
          icon={<CaretRight size={16} aria-hidden="true" />}
        />
      </div>
    </nav>
  );
}
