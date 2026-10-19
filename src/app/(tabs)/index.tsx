import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Buttons';
import { NeuPressable } from '@/components/NeuPressable';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Surface } from '@/components/Surface';
import { TaskPicker } from '@/components/TaskPicker';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useNow } from '@/hooks/useNow';
import { confirm } from '@/lib/confirm';
import { PHASE_LABEL, PHASE_ORDER } from '@/lib/phase';
import { computeStats } from '@/lib/stats';
import { formatClock, formatDuration, formatTimeOfDay, startOfDay } from '@/lib/time';
import { getProgress, getRemainingMs } from '@/lib/timerEngine';
import type { Phase } from '@/lib/types';
import { useActions, useAppState } from '@/state/AppProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, space } from '@/theme/theme';

const COMPLETION_MESSAGE: Record<Phase, string> = {
  focus: 'Focus session complete — nice work!',
  shortBreak: 'Break over — ready to focus?',
  longBreak: 'Long break over — let’s get going.',
};

export default function TimerScreen() {
  const t = useTheme();
  const { timer, settings, tasks, sessions, lastFinished } = useAppState();
  const actions = useActions();
  const { width } = useWindowDimensions();
  const [pickerOpen, setPickerOpen] = useState(false);

  const running = timer.status === 'running';
  const now = useNow(running);
  const remaining = getRemainingMs(timer, now);
  const progress = getProgress(timer, now);
  const accent = t.phase[timer.phase];
  const task = tasks.find((x) => x.id === timer.taskId) ?? null;
  const dayStart = startOfDay(now);
  const today = useMemo(() => computeStats(sessions, dayStart), [sessions, dayStart]);
  const dialSize = Math.min(width - space.xl * 2 - space.lg, 300);

  const isFresh = timer.status === 'idle';
  const statusLine =
    timer.status === 'running'
      ? `Ends at ${formatTimeOfDay(timer.endsAt ?? now)}`
      : timer.status === 'paused'
        ? 'Paused'
        : 'Ready';

  const onSwitchPhase = (phase: Phase) => {
    if (phase === timer.phase) return;
    actions.tap();
    if (isFresh) return actions.switchPhase(phase);
    confirm(
      `Switch to ${PHASE_LABEL[phase].toLowerCase()}?`,
      'Your current session progress will be discarded.',
      'Switch',
      () => actions.switchPhase(phase),
    );
  };

  const onPrimary = () => {
    actions.tap();
    if (running) actions.pause();
    else actions.start();
  };

  return (
    <Screen contentStyle={{ alignItems: 'center' }}>
      <Segmented
        accessibilityLabel="Session type"
        value={timer.phase}
        onChange={onSwitchPhase}
        options={PHASE_ORDER.map((p) => ({ value: p, label: PHASE_LABEL[p], color: t.phase[p] }))}
        style={{ alignSelf: 'stretch', marginBottom: space.xxl }}
      />

      <ProgressRing size={dialSize} progress={progress} color={accent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
          <AppText variant="overline" tone="muted">
            {PHASE_LABEL[timer.phase]}
          </AppText>
        </View>
        <AppText
          variant="display"
          accessibilityRole="timer"
          accessibilityLabel={`${formatClock(remaining)} remaining`}
          style={{ fontVariant: ['tabular-nums'], fontSize: dialSize < 260 ? 46 : 56, marginVertical: 2 }}
        >
          {formatClock(remaining)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {statusLine}
        </AppText>
      </ProgressRing>

      <CycleDots
        total={settings.sessionsBeforeLongBreak}
        done={timer.cycleCount}
        inFocus={timer.phase === 'focus'}
        color={t.phase.focus}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, marginTop: space.lg }}>
        <IconButton
          icon="refresh"
          size={56}
          depth="md"
          disabled={isFresh}
          onPress={() => {
            actions.tap();
            actions.reset();
          }}
          accessibilityLabel="Reset session"
        />
        <NeuPressable
          onPress={onPrimary}
          depth="lg"
          radius={44}
          style={{ width: 88, height: 88 }}
          accessibilityLabel={running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start'}
        >
          <Ionicons
            name={running ? 'pause' : 'play'}
            size={36}
            color={accent}
            style={{ marginLeft: running ? 0 : 4 }}
          />
        </NeuPressable>
        <IconButton
          icon="play-skip-forward"
          size={56}
          depth="md"
          onPress={() => {
            actions.tap();
            actions.skip();
          }}
          accessibilityLabel={`Skip ${PHASE_LABEL[timer.phase].toLowerCase()}`}
        />
      </View>

      <CompletionToast lastFinished={lastFinished} />

      <NeuPressable
        onPress={() => {
          actions.tap();
          setPickerOpen(true);
        }}
        radius={radius.md}
        accessibilityLabel={task ? `Working on ${task.title}. Change task` : 'Choose a task to focus on'}
        containerStyle={{ alignSelf: 'stretch', marginTop: space.xl }}
        style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: space.md, padding: space.lg }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.bg,
            boxShadow: insetShadow(t, 'sm'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={task ? 'flag' : 'flag-outline'} size={16} color={task ? accent : t.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" tone="muted">
            {task ? 'Working on' : 'No task selected'}
          </AppText>
          <AppText variant="label" numberOfLines={1}>
            {task ? task.title : 'Choose a task'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.textFaint} />
      </NeuPressable>

      <Surface style={{ alignSelf: 'stretch', padding: space.lg, marginTop: space.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: space.md }}>
          <AppText variant="label" style={{ flex: 1 }}>
            Today’s goal
          </AppText>
          <AppText variant="caption" tone="muted">
            {today.todayCount} / {settings.dailyGoal} sessions · {formatDuration(today.todayMs)}
          </AppText>
        </View>
        <ProgressBar
          progress={today.todayCount / settings.dailyGoal}
          color={t.phase.shortBreak}
          accessibilityLabel="Daily goal progress"
        />
      </Surface>

      <TaskPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={timer.taskId}
        onSelect={(id) => {
          actions.setTimerTask(id);
          setPickerOpen(false);
        }}
      />
    </Screen>
  );
}

/** One groove per focus session in the cycle; completed ones are filled. */
function CycleDots({ total, done, inFocus, color }: { total: number; done: number; inFocus: boolean; color: string }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${done} of ${total} focus sessions completed before the long break`}
      style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xl, flexWrap: 'wrap', justifyContent: 'center' }}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < done;
        const current = inFocus && i === done;
        return (
          <View
            key={i}
            style={{
              width: current ? 26 : 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: t.bg,
              boxShadow: insetShadow(t, 'sm'),
              padding: 3,
            }}
          >
            {(filled || current) && (
              <View
                style={{
                  flex: 1,
                  borderRadius: 4,
                  backgroundColor: color,
                  opacity: filled ? 1 : 0.45,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Briefly shows a soft raised pill when a phase finishes while the app is open. */
function CompletionToast({ lastFinished }: { lastFinished: { phase: Phase; nonce: number } | null }) {
  const opacity = useAnimatedValue(0);
  const [message, setMessage] = useState<string | null>(null);
  const seen = useRef(lastFinished?.nonce ?? null);

  useEffect(() => {
    if (!lastFinished || lastFinished.nonce === seen.current) return;
    seen.current = lastFinished.nonce;
    setMessage(COMPLETION_MESSAGE[lastFinished.phase]);
    const useNativeDriver = Platform.OS !== 'web';
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver }),
      Animated.delay(3500),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver }),
    ]);
    anim.start(({ finished }) => finished && setMessage(null));
    return () => anim.stop();
  }, [lastFinished, opacity]);

  if (!message) return null;
  return (
    <Animated.View style={{ opacity, marginTop: space.xl }} accessibilityLiveRegion="polite">
      <Surface depth="sm" radius={radius.pill} style={{ paddingHorizontal: space.xl, paddingVertical: space.md }}>
        <AppText variant="label" align="center">
          {message}
        </AppText>
      </Surface>
    </Animated.View>
  );
}
