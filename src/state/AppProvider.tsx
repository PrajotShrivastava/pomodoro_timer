import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { AppState as RNAppState } from 'react-native';

import { successHaptic, tapHaptic } from '@/lib/haptics';
import { createId } from '@/lib/id';
import { initNotifications, syncTimerNotifications } from '@/lib/notifications';
import { loadAll, save, STORAGE_KEYS } from '@/lib/storage';
import { projectSchedule } from '@/lib/timerEngine';
import type { Phase, Settings, Task } from '@/lib/types';

import { initialState, reducer, type Action, type AppState } from './reducer';

interface AppActions {
  start(): void;
  pause(): void;
  reset(): void;
  skip(): void;
  switchPhase(phase: Phase): void;
  resetCycle(): void;
  setTimerTask(taskId: string | null): void;
  updateSettings(patch: Partial<Settings>): void;
  /** Returns the new task's id. */
  addTask(title: string, estimatedPomodoros: number): string;
  updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'estimatedPomodoros'>>): void;
  toggleTask(id: string): void;
  deleteTask(id: string): void;
  clearCompletedTasks(): void;
  clearHistory(): void;
  /** Light haptic tick for UI controls, respecting the user's setting. */
  tap(): void;
}

const StateContext = createContext<AppState | null>(null);
const ActionsContext = createContext<AppActions | null>(null);

initNotifications();

/** Persists one slice whenever it changes (after hydration). */
function usePersist(hydrated: boolean, key: string, value: unknown) {
  useEffect(() => {
    if (hydrated) void save(key, value);
  }, [hydrated, key, value]);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { hydrated, settings, tasks, sessions, timer, lastFinished } = state;

  // --- Hydration -----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    loadAll()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'hydrate', data, now: Date.now() });
      })
      .catch((e) => {
        console.warn('[app] hydration failed, using defaults', e);
        if (!cancelled) dispatch({ type: 'hydrate', data: { ...initialState }, now: Date.now() });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Persistence ---------------------------------------------------------
  usePersist(hydrated, STORAGE_KEYS.settings, settings);
  usePersist(hydrated, STORAGE_KEYS.tasks, tasks);
  usePersist(hydrated, STORAGE_KEYS.sessions, sessions);
  usePersist(hydrated, STORAGE_KEYS.timer, timer);

  // --- Phase completion ----------------------------------------------------
  // Fire exactly when the running phase ends. If JS is suspended in the
  // background this simply runs late, and reconcile() back-dates the
  // transition to the true end time.
  useEffect(() => {
    if (!hydrated || timer.status !== 'running' || timer.endsAt === null) return;
    const delay = Math.max(0, timer.endsAt - Date.now()) + 30;
    const id = setTimeout(() => dispatch({ type: 'timer/reconcile', now: Date.now() }), delay);
    return () => clearTimeout(id);
  }, [hydrated, timer.status, timer.endsAt]);

  // Catch up immediately when returning to the foreground.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') dispatch({ type: 'timer/reconcile', now: Date.now() });
    });
    return () => sub.remove();
  }, []);

  // --- Notifications -------------------------------------------------------
  // Re-plan alerts whenever anything affecting the schedule changes.
  const scheduleKey = useMemo(() => {
    if (!hydrated || !settings.notificationsEnabled) return 'off';
    const plan = projectSchedule(timer, settings);
    return JSON.stringify(plan);
  }, [hydrated, timer, settings]);

  useEffect(() => {
    if (!hydrated) return;
    void syncTimerNotifications(scheduleKey === 'off' ? [] : JSON.parse(scheduleKey));
  }, [hydrated, scheduleKey]);

  // --- Completion feedback -------------------------------------------------
  const lastNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!lastFinished || lastFinished.nonce === lastNonce.current) return;
    lastNonce.current = lastFinished.nonce;
    successHaptic(settings.hapticsEnabled);
  }, [lastFinished, settings.hapticsEnabled]);

  // --- Actions -------------------------------------------------------------
  const hapticsRef = useRef(settings.hapticsEnabled);
  useEffect(() => {
    hapticsRef.current = settings.hapticsEnabled;
  }, [settings.hapticsEnabled]);

  const actions = useMemo<AppActions>(() => {
    const d = (a: Action) => dispatch(a);
    return {
      start: () => d({ type: 'timer/start', now: Date.now() }),
      pause: () => d({ type: 'timer/pause', now: Date.now() }),
      reset: () => d({ type: 'timer/reset' }),
      skip: () => d({ type: 'timer/skip', now: Date.now() }),
      switchPhase: (phase) => d({ type: 'timer/switchPhase', phase }),
      resetCycle: () => d({ type: 'timer/resetCycle' }),
      setTimerTask: (taskId) => d({ type: 'timer/setTask', taskId }),
      updateSettings: (patch) => d({ type: 'settings/update', patch }),
      addTask: (title, estimatedPomodoros) => {
        const id = createId();
        d({ type: 'task/add', id, title, estimatedPomodoros, now: Date.now() });
        return id;
      },
      updateTask: (id, patch) => d({ type: 'task/update', id, patch }),
      toggleTask: (id) => d({ type: 'task/toggle', id, now: Date.now() }),
      deleteTask: (id) => d({ type: 'task/delete', id }),
      clearCompletedTasks: () => d({ type: 'tasks/clearCompleted' }),
      clearHistory: () => d({ type: 'history/clear' }),
      tap: () => tapHaptic(hapticsRef.current),
    };
  }, []);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppProvider>');
  return ctx;
}

export function useActions(): AppActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useActions must be used inside <AppProvider>');
  return ctx;
}

