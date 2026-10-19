import type { Settings, ThemePreference } from './types';

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  notificationsEnabled: true,
  hapticsEnabled: true,
  theme: 'system',
  dailyGoal: 8,
};

export const LIMITS = {
  focusMinutes: { min: 1, max: 180 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 90 },
  sessionsBeforeLongBreak: { min: 1, max: 12 },
  dailyGoal: { min: 1, max: 24 },
} as const;

export interface Preset {
  id: string;
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

export const PRESETS: Preset[] = [
  { id: 'classic', name: 'Classic', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
  { id: 'sprint', name: 'Sprint', focusMinutes: 15, shortBreakMinutes: 3, longBreakMinutes: 10 },
  { id: 'deep', name: 'Deep work', focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 30 },
  { id: 'flow', name: 'Flow', focusMinutes: 90, shortBreakMinutes: 15, longBreakMinutes: 30 },
];

export function matchPreset(settings: Settings): Preset | undefined {
  return PRESETS.find(
    (p) =>
      p.focusMinutes === settings.focusMinutes &&
      p.shortBreakMinutes === settings.shortBreakMinutes &&
      p.longBreakMinutes === settings.longBreakMinutes,
  );
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

/** Coerces anything (e.g. stale or corrupted persisted data) into valid settings. */
export function sanitizeSettings(input: unknown): Settings {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  const num = (key: keyof typeof LIMITS) =>
    clampInt(raw[key], LIMITS[key].min, LIMITS[key].max, d[key]);
  return {
    focusMinutes: num('focusMinutes'),
    shortBreakMinutes: num('shortBreakMinutes'),
    longBreakMinutes: num('longBreakMinutes'),
    sessionsBeforeLongBreak: num('sessionsBeforeLongBreak'),
    dailyGoal: num('dailyGoal'),
    autoStartBreaks: bool(raw.autoStartBreaks, d.autoStartBreaks),
    autoStartFocus: bool(raw.autoStartFocus, d.autoStartFocus),
    notificationsEnabled: bool(raw.notificationsEnabled, d.notificationsEnabled),
    hapticsEnabled: bool(raw.hapticsEnabled, d.hapticsEnabled),
    theme: THEMES.includes(raw.theme as ThemePreference) ? (raw.theme as ThemePreference) : d.theme,
  };
}
