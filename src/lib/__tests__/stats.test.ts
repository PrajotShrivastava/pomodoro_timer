import { computeStats, groupHistory, pomodorosByTask } from '../stats';
import { addDays, formatClock, formatDuration } from '../time';
import type { FocusSession } from '../types';

const MIN = 60_000;
// Local noon avoids any timezone/DST edge in the fixtures.
const NOW = new Date(2026, 9, 19, 12, 0, 0).getTime();

function session(endedAt: number, minutes = 25, taskId: string | null = null): FocusSession {
  return {
    id: String(endedAt),
    taskId,
    taskTitle: taskId,
    startedAt: endedAt - minutes * MIN,
    endedAt,
    durationMs: minutes * MIN,
  };
}

describe('computeStats', () => {
  it('handles no sessions', () => {
    const s = computeStats([], NOW);
    expect(s).toMatchObject({ todayCount: 0, todayMs: 0, totalCount: 0, totalMs: 0, streak: 0 });
    expect(s.lastSevenDays).toHaveLength(7);
  });

  it('totals today and all time, and builds the 7-day series ending today', () => {
    const sessions = [session(NOW - MIN), session(NOW - 2 * MIN, 50), session(addDays(NOW, -2) + 9 * 3600_000)];
    const s = computeStats(sessions, NOW);
    expect(s.todayCount).toBe(2);
    expect(s.todayMs).toBe(75 * MIN);
    expect(s.totalCount).toBe(3);
    expect(s.totalMs).toBe(100 * MIN);
    expect(s.lastSevenDays[6]).toMatchObject({ count: 2, ms: 75 * MIN });
    expect(s.lastSevenDays[4]).toMatchObject({ count: 1 });
    expect(s.averageDailyMs).toBeCloseTo((100 * MIN) / 7);
  });

  it('counts a streak that is still alive if today has no session yet', () => {
    const y = addDays(NOW, -1) + 10 * 3600_000;
    const sessions = [session(y), session(addDays(NOW, -2) + 10 * 3600_000), session(addDays(NOW, -4) + 10 * 3600_000)];
    expect(computeStats(sessions, NOW).streak).toBe(2);
    expect(computeStats([...sessions, session(NOW)], NOW).streak).toBe(3);
  });
});

describe('groupHistory', () => {
  it('groups by day, newest first', () => {
    const groups = groupHistory([session(addDays(NOW, -1) + 3600_000), session(NOW - MIN), session(NOW - 30 * MIN)], NOW);
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday']);
    expect(groups[0].sessions.map((s) => s.endedAt)).toEqual([NOW - MIN, NOW - 30 * MIN]);
    expect(groups[0].totalMs).toBe(50 * MIN);
  });
});

describe('pomodorosByTask', () => {
  it('counts sessions per task and ignores untagged ones', () => {
    expect(pomodorosByTask([session(1, 25, 'a'), session(2, 25, 'a'), session(3, 25, null)])).toEqual({ a: 2 });
  });
});

describe('formatting', () => {
  it('formats countdowns, rounding up seconds', () => {
    expect(formatClock(25 * MIN)).toBe('25:00');
    expect(formatClock(1)).toBe('00:01');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(90 * MIN)).toBe('1:30:00');
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45 * MIN)).toBe('45m');
    expect(formatDuration(120 * MIN)).toBe('2h');
    expect(formatDuration(135 * MIN)).toBe('2h 15m');
  });
});
