import type { Phase } from './types';

export const PHASE_LABEL: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

export const PHASE_ORDER: Phase[] = ['focus', 'shortBreak', 'longBreak'];
