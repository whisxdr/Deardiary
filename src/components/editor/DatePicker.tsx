import { Input } from '@/components/ui';

export interface DatePickerProps {
  /** ISO date-time value. */
  value: string;
  onChange: (isoValue: string) => void;
  label?: string;
}

/** Pads a number to two digits for the native picker formats. */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Splits an ISO timestamp into the date and time parts a native picker needs.
 *
 * Both halves come from the same local clock. Mixing a UTC date with a local time
 * shifts the entry by a day whenever the local time is behind the UTC offset.
 */
function splitIso(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  const at = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return {
    date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
    time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
  };
}

/** Native date and time inputs that emit a single ISO timestamp. */
export function DatePicker({ value, onChange, label = 'Date & time' }: DatePickerProps) {
  const { date, time } = splitIso(value);

  const emit = (nextDate: string, nextTime: string) => {
    const [year, month, day] = nextDate.split('-').map(Number);
    const [hour, minute] = nextTime.split(':').map(Number);
    // Built from local parts so the wall-clock values the user picked are preserved.
    const merged = new Date(year, month - 1, day, hour, minute, 0);
    onChange(Number.isNaN(merged.getTime()) ? value : merged.toISOString());
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label={label}
        type="date"
        value={date}
        onChange={(event) => emit(event.target.value, time)}
      />
      <Input label="Time" type="time" value={time} onChange={(event) => emit(date, event.target.value)} />
    </div>
  );
}
