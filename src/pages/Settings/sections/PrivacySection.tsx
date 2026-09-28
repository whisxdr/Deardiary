import { Toggle } from '@/components/ui';
import { useSettingsStore } from '@/store';

/** Privacy section: local-only flags for private entries. */
export function PrivacySection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const setPrivacy = (patch: Partial<typeof settings.privacy>) =>
    update({ privacy: { ...settings.privacy, ...patch } });

  return (
    <section aria-labelledby="privacy-heading" className="flex flex-col gap-3">
      <h2 id="privacy-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Privacy
      </h2>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        Entries never leave this browser unless you export them yourself.
      </p>
      <Toggle
        label="Hide private entries by default"
        description="Private entries stay out of the dashboard until you ask for them."
        checked={settings.privacy.hidePrivateEntries}
        onChange={(hidePrivateEntries) => setPrivacy({ hidePrivateEntries })}
      />
      <Toggle
        label="Ask for a password"
        description="Show a local unlock screen before opening the diary."
        checked={settings.privacy.requirePassword}
        onChange={(requirePassword) => setPrivacy({ requirePassword })}
      />
    </section>
  );
}
