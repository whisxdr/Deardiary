import { Input } from '@/components/ui';

export interface DatePickerProps {
  /** ISO date-time value. */
  value: string;
  onChange: (isoValue: string) => void;
  label?: string;
}

/** Splits an ISO timestamp into the date and time parts a native picker needs. */
function splitIso(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();
    return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5) };
  }
  return { date: parsed.toISOString().slice(0, 10), time: parsed.toTimeString().slice(0, 5) };
}

/** Native date and time inputs that emit a single ISO timestamp. */
export function DatePicker({ value, onChange, label = 'Date & time' }: DatePickerProps) {
  const { date, time } = splitIso(value);

  const emit = (nextDate: string, nextTime: string) => {
    const merged = new Date(`${nextDate}T${nextTime}:00`);
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
