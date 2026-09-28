import { formatLongDate } from '@/utils/date';

export interface CoverDateProps {
  date?: Date;
}

/** Today's date, set in mono type like a stamped bookplate. */
export function CoverDate({ date = new Date() }: CoverDateProps) {
  return (
    <time
      dateTime={date.toISOString()}
      className="font-mono text-xs uppercase tracking-[0.25em] text-primary-100/70"
    >
      {formatLongDate(date)}
    </time>
  );
}
