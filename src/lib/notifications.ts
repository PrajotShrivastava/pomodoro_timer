import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PHASE_LABEL } from './phase';
import type { ScheduledEnd } from './timerEngine';

const CHANNEL_ID = 'timer';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

let initialized = false;
let permission: 'granted' | 'denied' | 'unknown' = 'unknown';
/** Serializes cancel/schedule calls so rapid timer changes can't interleave. */
let queue: Promise<void> = Promise.resolve();

export function initNotifications(): void {
  if (!supported || initialized) return;
  initialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Timer alerts',
        description: 'Alerts when a focus session or break ends',
        // eslint-disable-next-line import/namespace -- exported via a compiled TS enum the plugin can't see
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        sound: 'default',
      }).catch((e) => console.warn('[notifications] channel setup failed', e));
    }
  } catch (e) {
    console.warn('[notifications] init failed', e);
  }
}

/** Asks for permission once; later calls reuse the answer. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  if (permission !== 'unknown') return permission === 'granted';
  try {
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && current.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    permission = granted ? 'granted' : 'denied';
    return granted;
  } catch (e) {
    console.warn('[notifications] permission request failed', e);
    return false;
  }
}

function describe(end: ScheduledEnd): { title: string; body: string } {
  const next = PHASE_LABEL[end.nextPhase].toLowerCase();
  if (end.finishedPhase === 'focus') {
    return {
      title: 'Focus session complete',
      body: end.nextAutoStarts ? `Nice work! Your ${next} has started.` : `Nice work! Time for a ${next}.`,
    };
  }
  return {
    title: `${PHASE_LABEL[end.finishedPhase]} is over`,
    body: end.nextAutoStarts ? 'Your next focus session has started.' : 'Ready to focus again?',
  };
}

/** Replaces all pending timer alerts with the given schedule. Pass [] to clear. */
export function syncTimerNotifications(schedule: ScheduledEnd[]): Promise<void> {
  if (!supported) return Promise.resolve();
  queue = queue.then(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const now = Date.now();
      const upcoming = schedule.filter((s) => s.at > now + 500);
      if (upcoming.length === 0) return;
      if (!(await ensureNotificationPermission())) return;
      for (const end of upcoming) {
        await Notifications.scheduleNotificationAsync({
          content: { ...describe(end), sound: 'default' },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(end.at),
            channelId: CHANNEL_ID,
          },
        });
      }
    } catch (e) {
      console.warn('[notifications] scheduling failed', e);
    }
  });
  return queue;
}
