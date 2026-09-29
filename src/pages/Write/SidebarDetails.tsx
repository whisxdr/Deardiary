import { CheckCircle } from '@phosphor-icons/react';
import { Input } from '@/components/ui';
import { DatePicker } from '@/components/editor';

export interface SidebarDetailsProps {
  date: string;
  location: string;
  savedLabel: string;
  isSaving: boolean;
  onDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

/** Date, time, location and the live save indicator. */
export function SidebarDetails({
  date,
  location,
  savedLabel,
  isSaving,
  onDateChange,
  onLocationChange,
}: SidebarDetailsProps) {
  return (
    <>
      <DatePicker value={date} onChange={onDateChange} />
      <Input
        label="Location"
        value={location}
        onChange={(event) => onLocationChange(event.target.value)}
        placeholder="Where were you?"
      />
      <p aria-live="polite" className="flex items-center gap-1 font-body text-xs text-muted">
        {isSaving ? (
          'Saving…'
        ) : (
          <>
            <CheckCircle size={14} weight="fill" aria-hidden="true" className="text-success" />
            {savedLabel}
          </>
        )}
      </p>
    </>
  );
}
