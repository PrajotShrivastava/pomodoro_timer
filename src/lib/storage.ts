import AsyncStorage from '@react-native-async-storage/async-storage';

import { sanitizeSettings } from './settings';
import { createTimer } from './timerEngine';
import type { FocusSession, Phase, Settings, Task, TimerState } from './types';

const PREFIX = 'pomodoro/v1/';
export const STORAGE_KEYS = {
  settings: `${PREFIX}settings`,
  tasks: `${PREFIX}tasks`,
  sessions: `${PREFIX}sessions`,
  timer: `${PREFIX}timer`,
} as const;

export interface PersistedData {
  settings: Settings;
  tasks: Task[];
  sessions: FocusSession[];
  timer: TimerState;
}

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const PHASES: Phase[] = ['focus', 'shortBreak', 'longBreak'];

export function parseTasks(input: unknown): Task[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isObj).flatMap((t): Task[] => {
    if (!isStr(t.id) || !isStr(t.title)) return [];
    return [
      {
        id: t.id,
        title: t.title,
        estimatedPomodoros: isNum(t.estimatedPomodoros) ? Math.max(1, Math.round(t.estimatedPomodoros)) : 1,
        done: t.done === true,
        createdAt: isNum(t.createdAt) ? t.createdAt : Date.now(),
        completedAt: isNum(t.completedAt) ? t.completedAt : null,
      },
    ];
  });
}

export function parseSessions(input: unknown): FocusSession[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isObj).flatMap((s): FocusSession[] => {
    if (!isStr(s.id) || !isNum(s.startedAt) || !isNum(s.endedAt) || !isNum(s.durationMs)) return [];
    return [
      {
        id: s.id,
        taskId: isStr(s.taskId) ? s.taskId : null,
        taskTitle: isStr(s.taskTitle) ? s.taskTitle : null,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationMs: s.durationMs,
      },
    ];
  });
}

export function parseTimer(input: unknown, settings: Settings): TimerState {
  const fallback = createTimer(settings);
  if (!isObj(input)) return fallback;
  const phase = PHASES.includes(input.phase as Phase) ? (input.phase as Phase) : null;
  const status = input.status;
  if (!phase || !isNum(input.durationMs) || !isNum(input.remainingMs)) return fallback;
  if (status !== 'idle' && status !== 'running' && status !== 'paused') return fallback;
  if (status === 'running' && !isNum(input.endsAt)) return fallback;
  return {
    phase,
    status,
    durationMs: input.durationMs,
    remainingMs: input.remainingMs,
    endsAt: status === 'running' ? (input.endsAt as number) : null,
    startedAt: isNum(input.startedAt) ? input.startedAt : null,
    cycleCount: isNum(input.cycleCount) ? Math.max(0, Math.round(input.cycleCount)) : 0,
    taskId: isStr(input.taskId) ? input.taskId : null,
  };
}

async function readJSON(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch (e) {
    console.warn(`[storage] failed to read ${key}`, e);
    return undefined;
  }
}

export async function loadAll(): Promise<PersistedData> {
  const [settingsRaw, tasksRaw, sessionsRaw, timerRaw] = await Promise.all([
    readJSON(STORAGE_KEYS.settings),
    readJSON(STORAGE_KEYS.tasks),
    readJSON(STORAGE_KEYS.sessions),
    readJSON(STORAGE_KEYS.timer),
  ]);
  const settings = sanitizeSettings(settingsRaw);
  return {
    settings,
    tasks: parseTasks(tasksRaw),
    sessions: parseSessions(sessionsRaw),
    timer: parseTimer(timerRaw, settings),
  };
}

export async function save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] failed to write ${key}`, e);
  }
}
