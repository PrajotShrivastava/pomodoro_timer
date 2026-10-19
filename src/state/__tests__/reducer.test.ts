import { DEFAULT_SETTINGS, sanitizeSettings } from '@/lib/settings';
import { parseSessions, parseTasks, parseTimer } from '@/lib/storage';
import { createTimer, start } from '@/lib/timerEngine';

import { initialState, reducer, type Action, type AppState } from '../reducer';

jest.mock('@react-native-async-storage/async-storage', () => ({}));

const MIN = 60_000;
const T0 = 1_700_000_000_000;

function run(actions: Action[], state: AppState = { ...initialState, hydrated: true }): AppState {
  return actions.reduce(reducer, state);
}

describe('app reducer', () => {
  it('records a completed focus session attributed to the selected task', () => {
    const s = run([
      { type: 'task/add', id: 't1', title: '  Write report  ', estimatedPomodoros: 2, now: T0 },
      { type: 'timer/setTask', taskId: 't1' },
      { type: 'timer/start', now: T0 },
      { type: 'timer/reconcile', now: T0 + 25 * MIN },
    ]);
    expect(s.tasks[0].title).toBe('Write report');
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0]).toMatchObject({ taskId: 't1', taskTitle: 'Write report', durationMs: 25 * MIN });
    expect(s.timer.phase).toBe('shortBreak');
    expect(s.lastFinished?.phase).toBe('focus');
  });

  it('ignores blank task titles', () => {
    expect(run([{ type: 'task/add', id: 'x', title: '   ', estimatedPomodoros: 1, now: T0 }]).tasks).toHaveLength(0);
  });

  it('detaches the timer from a task that is completed or deleted', () => {
    const base = run([
      { type: 'task/add', id: 't1', title: 'A', estimatedPomodoros: 1, now: T0 },
      { type: 'timer/setTask', taskId: 't1' },
    ]);
    const done = reducer(base, { type: 'task/toggle', id: 't1', now: T0 + 1 });
    expect(done.tasks[0]).toMatchObject({ done: true, completedAt: T0 + 1 });
    expect(done.timer.taskId).toBeNull();

    const deleted = reducer(base, { type: 'task/delete', id: 't1' });
    expect(deleted.tasks).toHaveLength(0);
    expect(deleted.timer.taskId).toBeNull();
  });

  it('keeps history titles after the task is deleted', () => {
    const s = run([
      { type: 'task/add', id: 't1', title: 'A', estimatedPomodoros: 1, now: T0 },
      { type: 'timer/setTask', taskId: 't1' },
      { type: 'timer/start', now: T0 },
      { type: 'timer/reconcile', now: T0 + 25 * MIN },
      { type: 'task/delete', id: 't1' },
    ]);
    expect(s.sessions[0].taskTitle).toBe('A');
  });

  it('updates settings with validation and refreshes an idle timer', () => {
    const s = run([{ type: 'settings/update', patch: { focusMinutes: 9999, shortBreakMinutes: 3 } }]);
    expect(s.settings.focusMinutes).toBe(180);
    expect(s.timer.remainingMs).toBe(180 * MIN);
  });

  it('on hydrate, catches up on sessions finished while the app was closed, silently', () => {
    const settings = { ...DEFAULT_SETTINGS };
    const timer = start(createTimer(settings), T0);
    const s = reducer(initialState, {
      type: 'hydrate',
      data: { settings, tasks: [], sessions: [], timer },
      now: T0 + 40 * MIN,
    });
    expect(s.hydrated).toBe(true);
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0].endedAt).toBe(T0 + 25 * MIN);
    expect(s.lastFinished).toBeNull();
  });
});

describe('persisted data parsing', () => {
  it('sanitizes garbage settings to defaults', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ focusMinutes: 'x', theme: 'neon', dailyGoal: 0 })).toEqual({
      ...DEFAULT_SETTINGS,
      dailyGoal: 1,
    });
  });

  it('drops malformed tasks and sessions', () => {
    expect(parseTasks([{ id: 'a', title: 'ok' }, { id: 1 }, null, 'x'])).toHaveLength(1);
    expect(parseSessions({})).toEqual([]);
    expect(parseSessions([{ id: 's', startedAt: 1, endedAt: 2, durationMs: 1 }, { id: 's2' }])).toHaveLength(1);
  });

  it('falls back to a fresh timer when the stored one is invalid', () => {
    const fresh = createTimer(DEFAULT_SETTINGS);
    expect(parseTimer({ phase: 'focus', status: 'running', durationMs: 1, remainingMs: 1 }, DEFAULT_SETTINGS)).toEqual(fresh);
    expect(parseTimer('nope', DEFAULT_SETTINGS)).toEqual(fresh);
  });
});
