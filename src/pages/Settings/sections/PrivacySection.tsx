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
        description="Private entries stay out of the entries list and the stats until you turn this off."
        checked={settings.privacy.hidePrivateEntries}
        onChange={(hidePrivateEntries) => setPrivacy({ hidePrivateEntries })}
      />
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        This hides private entries from the app's own screens. It does not encrypt them: anything in this browser's
        storage can still be read by someone with access to this device.
      </p>
    </section>
  );
}
