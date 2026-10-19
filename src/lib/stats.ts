import { addDays, dayKey, formatDayLabel, weekdayShort } from './time';
import type { FocusSession } from './types';

export interface DayTotal {
  key: string;
  dayStart: number;
  label: string;
  count: number;
  ms: number;
}

export interface Stats {
  todayCount: number;
  todayMs: number;
  totalCount: number;
  totalMs: number;
  /** Consecutive days with at least one focus session, ending today (or yesterday). */
  streak: number;
  /** Oldest → newest, ending today. */
  lastSevenDays: DayTotal[];
  averageDailyMs: number;
}

export interface HistoryGroup {
  key: string;
  label: string;
  totalMs: number;
  sessions: FocusSession[];
}

function totalsByDay(sessions: FocusSession[]): Map<string, { count: number; ms: number }> {
  const map = new Map<string, { count: number; ms: number }>();
  for (const s of sessions) {
    const key = dayKey(s.endedAt);
    const entry = map.get(key) ?? { count: 0, ms: 0 };
    entry.count += 1;
    entry.ms += s.durationMs;
    map.set(key, entry);
  }
  return map;
}

export function computeStats(sessions: FocusSession[], now: number): Stats {
  const byDay = totalsByDay(sessions);
  const today = byDay.get(dayKey(now)) ?? { count: 0, ms: 0 };

  let totalMs = 0;
  for (const s of sessions) totalMs += s.durationMs;

  // A streak is still alive if today has no sessions yet but yesterday did.
  let streak = 0;
  let cursor = today.count > 0 ? now : addDays(now, -1);
  while (byDay.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const lastSevenDays: DayTotal[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = addDays(now, -i);
    const key = dayKey(dayStart);
    const entry = byDay.get(key) ?? { count: 0, ms: 0 };
    lastSevenDays.push({ key, dayStart, label: weekdayShort(dayStart), ...entry });
  }

  const weekMs = lastSevenDays.reduce((sum, d) => sum + d.ms, 0);

  return {
    todayCount: today.count,
    todayMs: today.ms,
    totalCount: sessions.length,
    totalMs,
    streak,
    lastSevenDays,
    averageDailyMs: weekMs / 7,
  };
}

/** Sessions grouped by local day, newest day and newest session first. */
export function groupHistory(sessions: FocusSession[], now: number): HistoryGroup[] {
  const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
  const groups: HistoryGroup[] = [];
  for (const s of sorted) {
    const key = dayKey(s.endedAt);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: formatDayLabel(s.endedAt, now), totalMs: 0, sessions: [] };
      groups.push(group);
    }
    group.sessions.push(s);
    group.totalMs += s.durationMs;
  }
  return groups;
}

export function pomodorosByTask(sessions: FocusSession[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions) {
    if (s.taskId) out[s.taskId] = (out[s.taskId] ?? 0) + 1;
  }
  return out;
}
