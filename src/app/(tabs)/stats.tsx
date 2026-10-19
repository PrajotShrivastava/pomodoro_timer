import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { NeuButton, type IconName } from '@/components/Buttons';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen, SectionLabel } from '@/components/Screen';
import { Surface } from '@/components/Surface';
import { WeekChart } from '@/components/WeekChart';
import { useNow } from '@/hooks/useNow';
import { computeStats, groupHistory } from '@/lib/stats';
import { formatDuration, formatTimeOfDay, startOfDay } from '@/lib/time';
import { useAppState } from '@/state/AppProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, space } from '@/theme/theme';

const HISTORY_PAGE = 7;

export default function StatsScreen() {
  const t = useTheme();
  const { sessions, settings } = useAppState();
  // Refresh once a minute so "today" rolls over at midnight.
  const now = useNow(true, 60_000);
  const day = startOfDay(now);
  const stats = useMemo(() => computeStats(sessions, day), [sessions, day]);
  const history = useMemo(() => groupHistory(sessions, day), [sessions, day]);
  const [pages, setPages] = useState(1);

  const goal = settings.dailyGoal;
  const left = Math.max(0, goal - stats.todayCount);

  return (
    <Screen title="Statistics" subtitle="Your focus at a glance">
      <Surface style={{ flexDirection: 'row', alignItems: 'center', padding: space.xl, gap: space.xl }}>
        <ProgressRing size={124} progress={stats.todayCount / goal} color={t.phase.shortBreak}>
          <AppText variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
            {stats.todayCount}
            <AppText variant="caption" tone="muted">{`/${goal}`}</AppText>
          </AppText>
        </ProgressRing>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="overline" tone="muted">
            Daily goal
          </AppText>
          <AppText variant="heading">{left === 0 ? 'Goal reached!' : `${left} to go`}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDuration(stats.todayMs)} focused today
          </AppText>
        </View>
      </Surface>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginTop: space.xl }}>
        <Tile icon="flame-outline" label="Streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} />
        <Tile icon="time-outline" label="Total focus" value={formatDuration(stats.totalMs)} />
        <Tile icon="checkmark-done-outline" label="Sessions" value={String(stats.totalCount)} />
        <Tile icon="analytics-outline" label="Daily avg (7d)" value={formatDuration(stats.averageDailyMs)} />
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionLabel>Focus time · last 7 days</SectionLabel>
        <Surface style={{ padding: space.xl }}>
          <WeekChart days={stats.lastSevenDays} now={day} color={t.phase.focus} />
        </Surface>
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionLabel>History</SectionLabel>
        {history.length === 0 ? (
          <Surface variant="inset" style={{ padding: space.xxl, alignItems: 'center', gap: space.sm }}>
            <Ionicons name="hourglass-outline" size={26} color={t.textFaint} />
            <AppText variant="label" tone="muted" align="center">
              No focus sessions yet
            </AppText>
            <AppText variant="caption" tone="faint" align="center">
              Complete a focus session and it will be logged here.
            </AppText>
          </Surface>
        ) : (
          <View style={{ gap: space.lg }}>
            {history.slice(0, pages * HISTORY_PAGE).map((g) => (
              <Surface key={g.key} depth="sm" radius={radius.md} style={{ padding: space.lg }}>
                <View style={{ flexDirection: 'row', marginBottom: space.sm }}>
                  <AppText variant="label" style={{ flex: 1 }}>
                    {g.label}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {g.sessions.length} · {formatDuration(g.totalMs)}
                  </AppText>
                </View>
                {g.sessions.map((s, i) => (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      paddingVertical: space.sm,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.divider,
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.phase.focus }} />
                    <AppText variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'], width: 92 }}>
                      {formatTimeOfDay(s.startedAt)}–{formatTimeOfDay(s.endedAt)}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                      {s.taskTitle ?? 'Focus session'}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {formatDuration(s.durationMs)}
                    </AppText>
                  </View>
                ))}
              </Surface>
            ))}
            {history.length > pages * HISTORY_PAGE && (
              <NeuButton
                label="Show more"
                compact
                icon="chevron-down"
                onPress={() => setPages((p) => p + 1)}
                style={{ alignSelf: 'center' }}
              />
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

function Tile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const t = useTheme();
  return (
    <Surface depth="sm" radius={radius.md} style={{ flexGrow: 1, flexBasis: '40%', padding: space.lg, gap: space.sm }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'sm'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={17} color={t.textMuted} />
      </View>
      <AppText variant="heading" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </Surface>
  );
}
