import { useSettingsStore } from '@/store';
import { cn } from '@/utils';
import type { FontSize, ThemeName } from '@/types';

const THEMES: { id: ThemeName; name: string; description: string; swatch: string }[] = [
  { id: 'leather', name: 'Leather', description: 'Warm book cover tones.', swatch: '#7D5A3C' },
  { id: 'paper', name: 'Paper', description: 'Bright cream pages.', swatch: '#F5F0E6' },
  { id: 'night', name: 'Night', description: 'Low light reading.', swatch: '#2A1A14' },
];

const FONT_SIZES: { id: FontSize; name: string }[] = [
  { id: 'sm', name: 'Small' },
  { id: 'md', name: 'Medium' },
  { id: 'lg', name: 'Large' },
];

/** Appearance section: theme and editor font size. */
export function AppearanceSection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  return (
    <section aria-labelledby="appearance-heading" className="flex flex-col gap-4">
      <h2 id="appearance-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Appearance
      </h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-xs uppercase tracking-wide text-muted">Theme</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => update({ theme: theme.id })}
              aria-pressed={settings.theme === theme.id}
              className={cn(
                'flex items-center gap-3 rounded-md border p-3 text-left transition-colors duration-fast',
                settings.theme === theme.id
                  ? 'border-accent-gold bg-accent-gold/20'
                  : 'border-primary-200 hover:border-accent-gold/60 dark:border-primary-700',
              )}
            >
              <span
                aria-hidden="true"
                className="h-8 w-8 rounded-full border border-primary-300"
                style={{ backgroundColor: theme.swatch }}
              />
              <span className="flex flex-col">
                <span className="font-body text-sm text-primary-700 dark:text-primary-100">{theme.name}</span>
                <span className="font-body text-xs text-muted dark:text-primary-300">{theme.description}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-xs uppercase tracking-wide text-muted">Editor text size</legend>
        <div className="flex gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => update({ fontSize: size.id })}
              aria-pressed={settings.fontSize === size.id}
              className={cn(
                'rounded-md border px-4 py-2 font-body text-sm transition-colors duration-fast',
                settings.fontSize === size.id
                  ? 'border-accent-gold bg-accent-gold/20 text-primary-800 dark:text-primary-100'
                  : 'border-primary-200 text-primary-600 hover:border-accent-gold/60 dark:border-primary-700 dark:text-primary-200',
              )}
            >
              {size.name}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
