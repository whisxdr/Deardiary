import { useState, type KeyboardEvent } from 'react';
import { LIMITS } from '@/constants';
import { isValidTag, normalizeTag, parseTagInput, sanitizeTags } from '@/lib/validate';
import { Input } from '@/components/ui';
import { Chip } from '@/components/ui';

export interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  hint?: string;
}

/** Chip-style tag editor accepting Enter, comma and semicolon as separators. */
export function TagInput({ tags, onChange, label = 'Tags', hint }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const atLimit = tags.length >= LIMITS.maxTags;

  const commit = (raw: string) => {
    const next = sanitizeTags([...tags, ...parseTagInput(raw)]);
    onChange(next);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      if (draft.trim()) commit(draft);
      return;
    }
    if (event.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(tags.filter((item) => item !== tag));

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
        disabled={atLimit}
        placeholder={atLimit ? 'Tag limit reached' : 'Add a tag and press Enter'}
        hint={hint ?? `${tags.length}/${LIMITS.maxTags} tags`}
        maxLength={LIMITS.tagMaxLength}
      />
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected tags">
          {tags.map((tag) => (
            <li key={tag}>
              <Chip onRemove={() => remove(tag)}>#{normalizeTag(tag)}</Chip>
            </li>
          ))}
        </ul>
      ) : null}
      {draft && !isValidTag(draft) ? (
        <p className="font-body text-xs text-error-text">Tags cannot be empty or longer than {LIMITS.tagMaxLength} characters.</p>
      ) : null}
    </div>
  );
}
