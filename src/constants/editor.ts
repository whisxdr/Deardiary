/** Placeholder shown in an empty editor body. */
export const EDITOR_PLACEHOLDER = 'Today I feel...';

/** Templates offered when starting a fresh entry. */
export const ENTRY_TEMPLATES = [
  {
    id: 'free',
    name: 'Free writing',
    description: 'An empty page and no expectations.',
    content: '',
  },
  {
    id: 'gratitude',
    name: 'Three good things',
    description: 'Note three small wins from today.',
    content: '<p>Three good things about today:</p><ol><li></li><li></li><li></li></ol>',
  },
  {
    id: 'reflect',
    name: 'Evening reflection',
    description: 'Look back before the day closes.',
    content: '<h2>How the day went</h2><p></p><h2>What I would change</h2><p></p>',
  },
] as const;
