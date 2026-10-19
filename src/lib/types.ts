export type Phase = 'focus' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** Number of focus sessions before a long break. */
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  theme: ThemePreference;
  /** Daily goal, in completed focus sessions. */
  dailyGoal: number;
}

/**
 * The timer is stored as timestamps rather than a ticking counter, so the
 * remaining time can always be recomputed from the wall clock — even after the
 * app was suspended in the background.
 */
export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  /** Full length of the current phase. */
  durationMs: number;
  /** Epoch ms when the running phase ends. Only meaningful while running. */
  endsAt: number | null;
  /** Remaining time while idle or paused. */
  remainingMs: number;
  /** Epoch ms when the current phase was first started (for history). */
  startedAt: number | null;
  /** Focus sessions completed in the current long-break cycle. */
  cycleCount: number;
  /** Task the current/next focus session is attributed to. */
  taskId: string | null;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  /** Task title at the time of completion, kept so history survives task deletion. */
  taskTitle: string | null;
  startedAt: number;
  endedAt: number;
  durationMs: number;
}

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
}
