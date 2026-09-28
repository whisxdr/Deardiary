import { useCallback, useEffect } from 'react';
import { useSettingsStore } from '@/store';
import type { ThemeName } from '@/types';

const THEME_CYCLE: ThemeName[] = ['leather', 'paper', 'night'];

/** Theme state plus helpers for the header toggle and settings page. */
export function useTheme() {
  const theme = useSettingsStore((state) => state.settings.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const hydrate = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const toggleTheme = useCallback(() => {
    const index = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme, isDark: theme === 'night' } as const;
}
