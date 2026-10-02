import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Input } from '@/components/ui';
import { DatePicker } from '@/components/editor';
import { LIMITS } from '@/constants';
import { SAVE_ERROR_TEXT, type SaveError } from './saveError';

export interface SidebarDetailsProps {
  date: string;
  location: string;
  savedLabel: string;
  isSaving: boolean;
  /** Why the last save did not land, or null when it did. */
  saveError: SaveError;
  onDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

/** Date, time, location and the live save indicator. */
export function SidebarDetails({
  date,
  location,
  savedLabel,
  isSaving,
  saveError,
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
        maxLength={LIMITS.locationMaxLength}
      />
      {saveError ? (
        <p role="alert" className="flex items-start gap-1 font-body text-xs text-error">
          <WarningCircle size={14} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
          {SAVE_ERROR_TEXT[saveError]}
        </p>
      ) : (
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
      )}
    </>
  );
}
