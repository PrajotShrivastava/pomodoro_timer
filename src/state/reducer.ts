import { DEFAULT_SETTINGS, sanitizeSettings } from '@/lib/settings';
import { createId } from '@/lib/id';
import type { PersistedData } from '@/lib/storage';
import * as engine from '@/lib/timerEngine';
import type { FocusSession, Phase, Settings, Task, TimerState } from '@/lib/types';

export interface AppState extends PersistedData {
  hydrated: boolean;
  /** Last phase that ended naturally; drives completion feedback (haptics, toast). */
  lastFinished: { phase: Phase; nonce: number } | null;
}

export type Action =
  | { type: 'hydrate'; data: PersistedData; now: number }
  | { type: 'timer/start'; now: number }
  | { type: 'timer/pause'; now: number }
  | { type: 'timer/reset' }
  | { type: 'timer/skip'; now: number }
  | { type: 'timer/switchPhase'; phase: Phase }
  | { type: 'timer/resetCycle' }
  | { type: 'timer/reconcile'; now: number }
  | { type: 'timer/setTask'; taskId: string | null }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'task/add'; id: string; title: string; estimatedPomodoros: number; now: number }
  | { type: 'task/update'; id: string; patch: Partial<Pick<Task, 'title' | 'estimatedPomodoros'>> }
  | { type: 'task/toggle'; id: string; now: number }
  | { type: 'task/delete'; id: string }
  | { type: 'tasks/clearCompleted' }
  | { type: 'history/clear' };

export const initialState: AppState = {
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  tasks: [],
  sessions: [],
  timer: engine.createTimer(DEFAULT_SETTINGS),
  lastFinished: null,
};

/** Folds a timer transition into app state, recording completed focus sessions. */
function applyTransition(state: AppState, result: engine.TransitionResult): AppState {
  if (result.timer === state.timer && result.completed.length === 0) return state;

  const newSessions: FocusSession[] = result.completed.map((c) => ({
    id: createId(),
    taskId: c.taskId,
    taskTitle: state.tasks.find((t) => t.id === c.taskId)?.title ?? null,
    startedAt: c.startedAt,
    endedAt: c.endedAt,
    durationMs: c.durationMs,
  }));

  const lastPhase = result.finishedPhases[result.finishedPhases.length - 1];
  return {
    ...state,
    timer: result.timer,
    sessions: newSessions.length ? [...state.sessions, ...newSessions] : state.sessions,
    lastFinished: lastPhase
      ? { phase: lastPhase, nonce: (state.lastFinished?.nonce ?? 0) + 1 }
      : state.lastFinished,
  };
}

function withTimer(state: AppState, timer: TimerState): AppState {
  return timer === state.timer ? state : { ...state, timer };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate': {
      const next: AppState = { ...state, ...action.data, hydrated: true };
      // Catch up on anything that finished while the app was closed.
      const caughtUp = applyTransition(next, engine.reconcile(next.timer, next.settings, action.now));
      // Don't buzz for sessions that ended while the app was closed.
      return { ...caughtUp, lastFinished: null };
    }

    case 'timer/start':
      return withTimer(state, engine.start(state.timer, action.now));
    case 'timer/pause':
      return withTimer(state, engine.pause(state.timer, action.now));
    case 'timer/reset':
      return withTimer(state, engine.reset(state.timer, state.settings));
    case 'timer/skip':
      return applyTransition(state, engine.skip(state.timer, state.settings, action.now));
    case 'timer/switchPhase':
      return withTimer(state, engine.switchPhase(state.timer, action.phase, state.settings));
    case 'timer/resetCycle':
      return withTimer(state, engine.resetCycle(state.timer, state.settings));
    case 'timer/reconcile':
      return applyTransition(state, engine.reconcile(state.timer, state.settings, action.now));
    case 'timer/setTask':
      return withTimer(state, engine.setTask(state.timer, action.taskId));

    case 'settings/update': {
      const settings = sanitizeSettings({ ...state.settings, ...action.patch });
      return { ...state, settings, timer: engine.applySettings(state.timer, settings) };
    }

    case 'task/add': {
      const title = action.title.trim();
      if (!title) return state;
      const task: Task = {
        id: action.id,
        title,
        estimatedPomodoros: Math.max(1, Math.round(action.estimatedPomodoros)),
        done: false,
        createdAt: action.now,
        completedAt: null,
      };
      return { ...state, tasks: [...state.tasks, task] };
    }

    case 'task/update': {
      const patch = { ...action.patch };
      if (patch.title !== undefined) {
        patch.title = patch.title.trim();
        if (!patch.title) delete patch.title;
      }
      if (patch.estimatedPomodoros !== undefined) {
        patch.estimatedPomodoros = Math.max(1, Math.round(patch.estimatedPomodoros));
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...patch } : t)),
      };
    }

    case 'task/toggle': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task) return state;
      const done = !task.done;
      const tasks = state.tasks.map((t) =>
        t.id === action.id ? { ...t, done, completedAt: done ? action.now : null } : t,
      );
      // A finished task shouldn't keep collecting new focus sessions.
      const timer =
        done && state.timer.taskId === action.id ? engine.setTask(state.timer, null) : state.timer;
      return { ...state, tasks, timer };
    }

    case 'task/delete': {
      const timer =
        state.timer.taskId === action.id ? engine.setTask(state.timer, null) : state.timer;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id), timer };
    }

    case 'tasks/clearCompleted':
      return { ...state, tasks: state.tasks.filter((t) => !t.done) };

    case 'history/clear':
      return { ...state, sessions: [] };
  }
}
