import { Check } from '@phosphor-icons/react';
import { Avatar, Input, Textarea } from '@/components/ui';
import { AVATAR_CHOICES, choiceForSeed, type AvatarChoice, type AvatarGender } from '@/constants/avatar';
import { useSettingsStore } from '@/store';
import { cn } from '@/utils';

const GROUPS: { gender: AvatarGender; label: string }[] = [
  { gender: 'woman', label: 'Woman portraits' },
  { gender: 'man', label: 'Man portraits' },
];

/** One portrait button. */
function PortraitButton({ choice, active, onSelect }: { choice: AvatarChoice; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Use the ${choice.seed} portrait`}
      aria-pressed={active}
      className={cn(
        'relative h-11 w-11 overflow-hidden rounded-md border transition-colors duration-fast',
        active ? 'border-accent-gold ring-1 ring-accent-gold' : 'border-primary-200 dark:border-primary-700',
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
        <div className="flex flex-col gap-3">
          {GROUPS.map((group) => (
            <fieldset key={group.gender} className="flex flex-col gap-1.5">
              <legend className="font-body text-xs text-primary-500 dark:text-primary-300">{group.label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_CHOICES.filter((choice) => choice.gender === group.gender).map((choice) => (
                  <PortraitButton
                    key={choice.seed}
                    choice={choice}
                    active={settings.avatarSeed === choice.seed}
                    onSelect={() => update({ avatarSeed: choice.seed })}
                  />
                ))}
              </div>
            </fieldset>
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
