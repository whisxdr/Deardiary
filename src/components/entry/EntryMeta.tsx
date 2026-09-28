import { CalendarBlank, Clock, MapPin } from '@phosphor-icons/react';
import { MoodBadge } from '@/components/mood';
import { formatLongDate, formatTime } from '@/utils';
import type { Entry } from '@/types';

export interface EntryMetaProps {
  entry: Entry;
  compact?: boolean;
  className?: string;
}

/** Date, time, mood and location rows shown in the reader and the editor. */
export function EntryMeta({ entry, compact, className }: EntryMetaProps) {
  const rows = [
    { key: 'date', icon: <CalendarBlank size={14} aria-hidden="true" />, label: 'Date', value: formatLongDate(entry.date) },
    { key: 'time', icon: <Clock size={14} aria-hidden="true" />, label: 'Time', value: formatTime(entry.date) },
    { key: 'mood', icon: null, label: 'Mood', value: null },
  ];

  if (entry.location) {
    rows.push({
      key: 'location',
      icon: <MapPin size={14} aria-hidden="true" />,
      label: 'Location',
      value: entry.location,
    });
  }

  return (
    <dl className={`flex flex-col gap-2 font-body text-sm ${className ?? ''}`}>
      {rows.map((row) => (
        <div key={row.key} className="flex items-start gap-2">
          <span className="mt-0.5 text-muted" aria-hidden="true">
            {row.icon}
          </span>
          {compact ? null : (
            <dt className="w-16 shrink-0 text-xs uppercase tracking-wide text-muted">{row.label}</dt>
          )}
          <dd className="text-primary-700 dark:text-primary-200">
            {row.key === 'mood' ? <MoodBadge mood={entry.mood} size={16} /> : row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
