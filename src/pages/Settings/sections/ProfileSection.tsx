import { Check } from '@phosphor-icons/react';
import { Avatar, Input, Textarea } from '@/components/ui';
import { AVATAR_CHOICES, choiceForSeed, type AvatarChoice } from '@/constants/avatar';
import { useSettingsStore } from '@/store';
import { cn } from '@/utils';

/** One portrait button. */
function PortraitButton({ choice, active, onSelect }: { choice: AvatarChoice; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Use the ${choice.seed} portrait`}
      aria-pressed={active}
      className={cn(
        'relative h-11 w-11 cursor-pointer overflow-hidden rounded-md border transition-colors duration-fast',
        active
          ? 'border-accent-gold ring-1 ring-accent-gold'
          : 'border-primary-200 hover:border-primary-300 dark:border-primary-700 dark:hover:border-primary-500',
      )}
    >
      <Avatar
        name={choice.seed}
        seed={choice.seed}
        gender={choice.gender}
        hair={choice.hair}
        size="md"
        className="h-full w-full rounded-none border-0"
      />
      {active ? (
        <span className="absolute bottom-0 right-0 bg-accent-gold text-primary-900">
          <Check size={14} weight="bold" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}

/** Profile section: display name, bio and portrait seed. */
export function ProfileSection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const active = choiceForSeed(settings.avatarSeed);

  return (
    <section aria-labelledby="profile-heading" className="flex flex-col gap-4">
      <h2 id="profile-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Profile
      </h2>
      <div className="flex items-start gap-4">
        <Avatar
          name={settings.displayName}
          seed={active.seed}
          gender={active.gender}
          hair={active.hair}
          size="lg"
        />
        <div className="grid grid-cols-7 gap-1.5">
          {AVATAR_CHOICES.map((choice) => (
            <PortraitButton
              key={choice.seed}
              choice={choice}
              active={settings.avatarSeed === choice.seed}
              onSelect={() => update({ avatarSeed: choice.seed })}
            />
          ))}
        </div>
      </div>
      <Input
        label="Display name"
        value={settings.displayName}
        onChange={(event) => update({ displayName: event.target.value })}
        maxLength={40}
      />
      <Textarea
        label="About you"
        rows={3}
        value={settings.bio}
        onChange={(event) => update({ bio: event.target.value })}
        maxLength={200}
      />
    </section>
  );
}
