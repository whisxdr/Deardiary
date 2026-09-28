import type { ComponentType } from 'react';
import {
  AdoringIcon,
  AngryIcon,
  AnxiousIcon,
  CalmIcon,
  CoolIcon,
  ExcitedIcon,
  HappyIcon,
  LovedIcon,
  MindblownIcon,
  SadIcon,
  ThoughtfulIcon,
  TiredIcon,
} from './icons';
import { MOOD_STAMP_INK } from '@/constants';
import type { IconProps, Mood } from '@/types';

const ICONS: Record<Mood, ComponentType<IconProps>> = {
  happy: HappyIcon,
  sad: SadIcon,
  angry: AngryIcon,
  tired: TiredIcon,
  thoughtful: ThoughtfulIcon,
  loved: LovedIcon,
  cool: CoolIcon,
  anxious: AnxiousIcon,
  excited: ExcitedIcon,
  calm: CalmIcon,
  adoring: AdoringIcon,
  mindblown: MindblownIcon,
};

export interface MoodIconProps extends IconProps {
  mood: Mood;
}

/** Renders the custom ink-stamp icon for a mood. */
export function MoodIcon({ mood, color = MOOD_STAMP_INK, ...props }: MoodIconProps) {
  const Icon = ICONS[mood] ?? CalmIcon;
  return <Icon color={color} {...props} />;
}
