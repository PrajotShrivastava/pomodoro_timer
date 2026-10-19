/**
 * Pure, timestamp-based Pomodoro state machine.
 *
 * Every function takes the current wall-clock time explicitly, which keeps the
 * engine deterministic and unit-testable. Remaining time is always derived from
 * `endsAt - now`, never from counting interval ticks, so the timer stays
 * accurate across app backgrounding, JS thread stalls, and device sleep.
 */
import type { Phase, Settings, TimerState } from './types';

const MINUTE = 60_000;
/** Safety cap when catching up on many elapsed auto-started phases. */
const MAX_CATCH_UP_STEPS = 100;

export interface CompletedFocus {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  taskId: string | null;
}

export interface TransitionResult {
  timer: TimerState;
  /** Focus sessions completed during the transition, oldest first. */
  completed: CompletedFocus[];
  /** Phases that ended naturally during the transition, oldest first. */
  finishedPhases: Phase[];
}

export interface ScheduledEnd {
  at: number;
  finishedPhase: Phase;
  nextPhase: Phase;
  nextAutoStarts: boolean;
}

export function phaseDurationMs(phase: Phase, settings: Settings): number {
  const minutes =
    phase === 'focus'
      ? settings.focusMinutes
      : phase === 'shortBreak'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
  return Math.max(1, minutes) * MINUTE;
}

export function createTimer(settings: Settings, phase: Phase = 'focus'): TimerState {
  const durationMs = phaseDurationMs(phase, settings);
  return {
    phase,
    status: 'idle',
    durationMs,
    endsAt: null,
    remainingMs: durationMs,
    startedAt: null,
    cycleCount: 0,
    taskId: null,
  };
}

export function getRemainingMs(timer: TimerState, now: number): number {
  if (timer.status === 'running' && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now);
  }
  return Math.max(0, timer.remainingMs);
}

/** 0 → just started, 1 → finished. */
export function getProgress(timer: TimerState, now: number): number {
  if (timer.durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - getRemainingMs(timer, now) / timer.durationMs));
}

export function start(timer: TimerState, now: number): TimerState {
  if (timer.status === 'running') return timer;
  const remainingMs = timer.remainingMs > 0 ? timer.remainingMs : timer.durationMs;
  return {
    ...timer,
    status: 'running',
    remainingMs,
    endsAt: now + remainingMs,
    startedAt: timer.startedAt ?? now,
  };
}

export function pause(timer: TimerState, now: number): TimerState {
  if (timer.status !== 'running') return timer;
  return {
    ...timer,
    status: 'paused',
    remainingMs: getRemainingMs(timer, now),
    endsAt: null,
  };
}

/** Restarts the current phase from its full duration and stops the clock. */
export function reset(timer: TimerState, settings: Settings): TimerState {
  const durationMs = phaseDurationMs(timer.phase, settings);
  return {
    ...timer,
    status: 'idle',
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    startedAt: null,
  };
}

/** Manually jump to a phase. The cycle counter is kept. */
export function switchPhase(timer: TimerState, phase: Phase, settings: Settings): TimerState {
  return reset({ ...timer, phase }, settings);
}

/** Starts a fresh long-break cycle at a focus session. */
export function resetCycle(timer: TimerState, settings: Settings): TimerState {
  return reset({ ...timer, phase: 'focus', cycleCount: 0 }, settings);
}

export function setTask(timer: TimerState, taskId: string | null): TimerState {
  return { ...timer, taskId };
}

/** Keeps an untouched idle timer in sync with edited durations. */
export function applySettings(timer: TimerState, settings: Settings): TimerState {
  const cycleCount = Math.min(timer.cycleCount, settings.sessionsBeforeLongBreak);
  if (timer.status !== 'idle') return { ...timer, cycleCount };
  return reset({ ...timer, cycleCount }, settings);
}

function shouldAutoStart(phase: Phase, settings: Settings): boolean {
  return phase === 'focus' ? settings.autoStartFocus : settings.autoStartBreaks;
}

/**
 * Moves to the phase after the current one.
 *
 * @param at       When the transition happens (also the start time of an
 *                 auto-started next phase).
 * @param natural  True when the phase ran to completion, false when skipped.
 *                 Only natural focus completions count toward the cycle and
 *                 history.
 * @param autoStart Whether the next phase should begin running immediately.
 */
function advance(
  timer: TimerState,
  settings: Settings,
  at: number,
  natural: boolean,
  autoStart: boolean,
): TransitionResult {
  const completed: CompletedFocus[] = [];
  let cycleCount = timer.cycleCount;
  let nextPhase: Phase;

  if (timer.phase === 'focus') {
    if (natural) {
      cycleCount += 1;
      completed.push({
        startedAt: timer.startedAt ?? at - timer.durationMs,
        endedAt: at,
        durationMs: timer.durationMs,
        taskId: timer.taskId,
      });
    }
    nextPhase = cycleCount >= settings.sessionsBeforeLongBreak ? 'longBreak' : 'shortBreak';
  } else {
    if (timer.phase === 'longBreak') cycleCount = 0;
    nextPhase = 'focus';
  }

  let next = reset({ ...timer, phase: nextPhase, cycleCount }, settings);
  if (autoStart && shouldAutoStart(nextPhase, settings)) {
    next = start(next, at);
  }
  return { timer: next, completed, finishedPhases: natural ? [timer.phase] : [] };
}

/** User skipped the current phase. Honors auto-start only if the clock was running. */
export function skip(timer: TimerState, settings: Settings, now: number): TransitionResult {
  return advance(timer, settings, now, false, timer.status === 'running');
}

/**
 * Brings the timer up to date with the wall clock. If the running phase has
 * ended — possibly several phases ago, when auto-start is on and the app was
 * in the background — each elapsed transition is applied at the moment it
 * actually happened.
 */
export function reconcile(timer: TimerState, settings: Settings, now: number): TransitionResult {
  let current = timer;
  const completed: CompletedFocus[] = [];
  const finishedPhases: Phase[] = [];

  for (let i = 0; i < MAX_CATCH_UP_STEPS; i++) {
    if (current.status !== 'running' || current.endsAt === null || current.endsAt > now) break;
    const result = advance(current, settings, current.endsAt, true, true);
    completed.push(...result.completed);
    finishedPhases.push(...result.finishedPhases);
    current = result.timer;
  }

  return { timer: current, completed, finishedPhases };
}

/**
 * Predicts upcoming phase endings for a running timer, following the auto-start
 * chain. Used to schedule local notifications ahead of time so they fire even
 * if the app is suspended.
 */
export function projectSchedule(timer: TimerState, settings: Settings, limit = 8): ScheduledEnd[] {
  const out: ScheduledEnd[] = [];
  let current = timer;
  while (out.length < limit && current.status === 'running' && current.endsAt !== null) {
    const at = current.endsAt;
    const result = advance(current, settings, at, true, true);
    out.push({
      at,
      finishedPhase: current.phase,
      nextPhase: result.timer.phase,
      nextAutoStarts: result.timer.status === 'running',
    });
    current = result.timer;
  }
  return out;
}
