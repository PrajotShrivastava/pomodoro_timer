import { DEFAULT_SETTINGS } from '../settings';
import * as engine from '../timerEngine';
import type { Settings } from '../types';

const MIN = 60_000;
const T0 = 1_700_000_000_000;
const settings: Settings = {
  ...DEFAULT_SETTINGS,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

describe('timer engine', () => {
  it('starts idle with the full focus duration', () => {
    const t = engine.createTimer(settings);
    expect(t.status).toBe('idle');
    expect(t.phase).toBe('focus');
    expect(engine.getRemainingMs(t, T0)).toBe(25 * MIN);
  });

  it('derives remaining time from timestamps, not ticks', () => {
    const t = engine.start(engine.createTimer(settings), T0);
    expect(t.endsAt).toBe(T0 + 25 * MIN);
    // No intermediate updates needed: any later "now" yields the right answer.
    expect(engine.getRemainingMs(t, T0 + 10 * MIN)).toBe(15 * MIN);
    expect(engine.getProgress(t, T0 + 12.5 * MIN)).toBeCloseTo(0.5);
    expect(engine.getRemainingMs(t, T0 + 99 * MIN)).toBe(0);
  });

  it('pauses and resumes without losing or gaining time', () => {
    let t = engine.start(engine.createTimer(settings), T0);
    t = engine.pause(t, T0 + 10 * MIN);
    expect(t.status).toBe('paused');
    expect(t.remainingMs).toBe(15 * MIN);
    // Time spent paused doesn't count.
    expect(engine.getRemainingMs(t, T0 + 60 * MIN)).toBe(15 * MIN);
    t = engine.start(t, T0 + 60 * MIN);
    expect(t.endsAt).toBe(T0 + 75 * MIN);
    expect(t.startedAt).toBe(T0); // original start kept for history
  });

  it('ignores redundant start/pause calls', () => {
    const running = engine.start(engine.createTimer(settings), T0);
    expect(engine.start(running, T0 + MIN)).toBe(running);
    const idle = engine.createTimer(settings);
    expect(engine.pause(idle, T0)).toBe(idle);
  });

  it('reset restores the full duration of the current phase', () => {
    let t = engine.start(engine.createTimer(settings), T0);
    t = engine.reset(t, settings);
    expect(t).toMatchObject({ status: 'idle', remainingMs: 25 * MIN, endsAt: null, startedAt: null });
  });

  it('completes focus into a short break and records the session', () => {
    const t = engine.start(engine.setTask(engine.createTimer(settings), 'task-1'), T0);
    const r = engine.reconcile(t, settings, T0 + 25 * MIN);
    expect(r.completed).toEqual([
      { startedAt: T0, endedAt: T0 + 25 * MIN, durationMs: 25 * MIN, taskId: 'task-1' },
    ]);
    expect(r.finishedPhases).toEqual(['focus']);
    expect(r.timer).toMatchObject({ phase: 'shortBreak', status: 'idle', cycleCount: 1, taskId: 'task-1' });
  });

  it('does nothing before the phase ends', () => {
    const t = engine.start(engine.createTimer(settings), T0);
    const r = engine.reconcile(t, settings, T0 + 25 * MIN - 1);
    expect(r.timer).toBe(t);
    expect(r.completed).toHaveLength(0);
  });

  it('goes to a long break after N focus sessions, then resets the cycle', () => {
    let t = { ...engine.createTimer(settings), cycleCount: 3 };
    t = engine.start(t, T0);
    let r = engine.reconcile(t, settings, T0 + 25 * MIN);
    expect(r.timer.phase).toBe('longBreak');
    expect(r.timer.cycleCount).toBe(4);
    expect(r.timer.durationMs).toBe(15 * MIN);

    r = engine.reconcile(engine.start(r.timer, T0 + 30 * MIN), settings, T0 + 45 * MIN);
    expect(r.timer).toMatchObject({ phase: 'focus', cycleCount: 0 });
  });

  it('catches up on several auto-started phases that elapsed in the background', () => {
    const auto = { ...settings, autoStartBreaks: true, autoStartFocus: true };
    const t = engine.start(engine.createTimer(auto), T0);
    // focus(25) + short(5) + focus(25) = 55 min, then 3 min into the next short break.
    const r = engine.reconcile(t, auto, T0 + 58 * MIN);
    expect(r.completed.map((c) => c.endedAt)).toEqual([T0 + 25 * MIN, T0 + 55 * MIN]);
    expect(r.completed[1].startedAt).toBe(T0 + 30 * MIN);
    expect(r.finishedPhases).toEqual(['focus', 'shortBreak', 'focus']);
    expect(r.timer).toMatchObject({ phase: 'shortBreak', status: 'running', cycleCount: 2 });
    expect(engine.getRemainingMs(r.timer, T0 + 58 * MIN)).toBe(2 * MIN);
  });

  it('stops at the first phase that does not auto-start', () => {
    const breaksOnly = { ...settings, autoStartBreaks: true, autoStartFocus: false };
    const t = engine.start(engine.createTimer(breaksOnly), T0);
    const r = engine.reconcile(t, breaksOnly, T0 + 5 * 60 * MIN);
    expect(r.completed).toHaveLength(1);
    expect(r.timer).toMatchObject({ phase: 'focus', status: 'idle' });
  });

  it('skip moves on without recording or counting the session', () => {
    const t = engine.start(engine.createTimer(settings), T0);
    const r = engine.skip(t, settings, T0 + MIN);
    expect(r.completed).toHaveLength(0);
    expect(r.finishedPhases).toHaveLength(0);
    expect(r.timer).toMatchObject({ phase: 'shortBreak', cycleCount: 0, status: 'idle' });
  });

  it('skip honors auto-start only when the clock was running', () => {
    const auto = { ...settings, autoStartFocus: true };
    const brk = engine.switchPhase(engine.createTimer(auto), 'shortBreak', auto);
    expect(engine.skip(brk, auto, T0).timer.status).toBe('idle');
    expect(engine.skip(engine.start(brk, T0), auto, T0 + MIN).timer.status).toBe('running');
  });

  it('applies edited durations only to an idle timer', () => {
    const longer = { ...settings, focusMinutes: 50 };
    expect(engine.applySettings(engine.createTimer(settings), longer).remainingMs).toBe(50 * MIN);
    const running = engine.start(engine.createTimer(settings), T0);
    expect(engine.applySettings(running, longer).endsAt).toBe(T0 + 25 * MIN);
  });

  it('clamps the cycle counter when sessions-per-cycle is lowered', () => {
    const t = { ...engine.createTimer(settings), cycleCount: 3 };
    expect(engine.applySettings(t, { ...settings, sessionsBeforeLongBreak: 2 }).cycleCount).toBe(2);
  });

  it('projects the notification schedule along the auto-start chain', () => {
    const auto = { ...settings, autoStartBreaks: true, autoStartFocus: false };
    const plan = engine.projectSchedule(engine.start(engine.createTimer(auto), T0), auto);
    expect(plan).toEqual([
      { at: T0 + 25 * MIN, finishedPhase: 'focus', nextPhase: 'shortBreak', nextAutoStarts: true },
      { at: T0 + 30 * MIN, finishedPhase: 'shortBreak', nextPhase: 'focus', nextAutoStarts: false },
    ]);
    expect(engine.projectSchedule(engine.createTimer(auto), auto)).toEqual([]);
  });
});
