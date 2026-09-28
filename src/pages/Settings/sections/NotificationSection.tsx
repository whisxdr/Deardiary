import { Input, Toggle } from '@/components/ui';
import { useSettingsStore } from '@/store';

/** Notification section: reminder time and email-style alerts. */
export function NotificationSection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const setNotification = (patch: Partial<typeof settings.notifications>) =>
    update({ notifications: { ...settings.notifications, ...patch } });

  return (
    <section aria-labelledby="notification-heading" className="flex flex-col gap-3">
      <h2 id="notification-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Notifications
      </h2>
      <Input
        label="Daily reminder time"
        type="time"
        value={settings.reminderTime ?? ''}
        onChange={(event) => update({ reminderTime: event.target.value })}
        hint="A gentle nudge to write, shown in the app."
      />
      <Toggle
        label="Daily reminder"
        description="Remind me to write once a day."
        checked={settings.notifications.dailyReminder}
        onChange={(dailyReminder) => setNotification({ dailyReminder })}
      />
      <Toggle
        label="Streak alerts"
        description="Warn me before a writing streak ends."
        checked={settings.notifications.streakAlerts}
        onChange={(streakAlerts) => setNotification({ streakAlerts })}
      />
      <Toggle
        label="Weekly digest"
        description="A summary of the week's entries."
        checked={settings.notifications.weeklyDigest}
        onChange={(weeklyDigest) => setNotification({ weeklyDigest })}
      />
    </section>
  );
}
