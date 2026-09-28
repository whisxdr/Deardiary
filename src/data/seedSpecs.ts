import type { Mood } from '@/types';

/** Raw description of one starter entry, expanded into an `Entry` by the seed builder. */
export interface SeedSpec {
  slug: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  daysAgo: number;
  hour: number;
  location?: string;
  isFavorite?: boolean;
}

/** Eight starter entries so the diary is never empty on a first visit. */
export const SEED_SPECS: SeedSpec[] = [
  {
    slug: 'quiet-morning',
    title: 'A Quiet Morning',
    content:
      '<p>Woke up before my alarm and watched the light crawl across the wall. No phone, no music, just the kettle and the sound of the street waking up.</p><p>I want more mornings like this one.</p>',
    mood: 'calm',
    tags: ['morning', 'peaceful'],
    daysAgo: 0,
    hour: 7,
    location: 'Kitchen window',
    isFavorite: true,
  },
  {
    slug: 'lecture-notes',
    title: 'Lecture Notes and Coffee',
    content:
      '<p>Three hours of statistics and my handwriting got worse with every page. Still, the confidence interval finally clicked when I drew it out.</p><blockquote><p>If you cannot explain it simply, you do not understand it yet.</p></blockquote>',
    mood: 'thoughtful',
    tags: ['college', 'study'],
    daysAgo: 1,
    hour: 14,
    location: 'Library, third floor',
  },
  {
    slug: 'rainy-run',
    title: 'Caught in the Rain',
    content:
      '<p>Went for a run and the sky opened halfway through. Ended up laughing under a bus shelter with a stranger and her very unhappy dog.</p><p>Best run in weeks.</p>',
    mood: 'excited',
    tags: ['running', 'weather'],
    daysAgo: 2,
    hour: 18,
    location: 'Riverside path',
  },
  {
    slug: 'family-dinner',
    title: 'Sunday Dinner at Home',
    content:
      '<p>Mum made the same soup she always makes and everyone argued about the same things. It was loud and warm and I did not want it to end.</p>',
    mood: 'loved',
    tags: ['family', 'food'],
    daysAgo: 3,
    hour: 19,
    location: 'Home',
    isFavorite: true,
  },
  {
    slug: 'hard-day',
    title: 'A Day That Dragged',
    content:
      '<p>Nothing went badly, exactly. Everything just took twice as long as it should have and I finished the day tired and slightly sad for no clear reason.</p><p>Writing it down helps more than I expected.</p>',
    mood: 'sad',
    tags: ['work', 'tired'],
    daysAgo: 4,
    hour: 22,
  },
  {
    slug: 'new-hobby',
    title: 'Learning to Sketch Again',
    content:
      '<p>Bought a cheap sketchbook and drew the plants on the windowsill. Everything looks like a potato, but I kept going for an hour without checking my phone once.</p>',
    mood: 'happy',
    tags: ['hobby', 'drawing', 'growth'],
    daysAgo: 5,
    hour: 20,
  },
  {
    slug: 'deadline-night',
    title: 'Deadline Night',
    content:
      '<p>Shipped the project at 23:40 with eleven minutes to spare. The relief hit harder than the caffeine.</p><p>Note to self: start the next one earlier.</p>',
    mood: 'mindblown',
    tags: ['work', 'deadline'],
    daysAgo: 6,
    hour: 23,
    location: 'Desk',
  },
  {
    slug: 'slow-sunday',
    title: 'Slow Sunday Reset',
    content:
      '<p>Laundry, a long walk, and a podcast about deep sea creatures. Nothing productive happened and that was the entire point.</p>',
    mood: 'cool',
    tags: ['weekend', 'rest'],
    daysAgo: 7,
    hour: 16,
  },
];
