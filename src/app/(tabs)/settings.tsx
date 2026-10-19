import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { NeuButton } from '@/components/Buttons';
import { NeuPressable } from '@/components/NeuPressable';
import { NeuSwitch } from '@/components/NeuSwitch';
import { Screen, SectionLabel } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Surface } from '@/components/Surface';
import { confirm } from '@/lib/confirm';
import { ensureNotificationPermission } from '@/lib/notifications';
import { DEFAULT_SETTINGS, LIMITS, matchPreset, PRESETS } from '@/lib/settings';
import type { Settings, ThemePreference } from '@/lib/types';
import { useActions, useAppState } from '@/state/AppProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/theme';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export default function SettingsScreen() {
  const t = useTheme();
  const { settings, timer, sessions } = useAppState();
  const actions = useActions();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const preset = matchPreset(settings);

  const update = (patch: Partial<Settings>) => {
    actions.tap();
    actions.updateSettings(patch);
  };

  const toggleNotifications = async (on: boolean) => {
    update({ notificationsEnabled: on });
    if (on && isNative) setPermissionDenied(!(await ensureNotificationPermission()));
    else setPermissionDenied(false);
  };

  return (
    <Screen title="Settings" subtitle="Tune the timer to your rhythm">
      <SectionLabel>Presets</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -space.xl, marginBottom: space.xl }}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.md, gap: space.md }}
      >
        {PRESETS.map((p) => {
          const active = preset?.id === p.id;
          return (
            <NeuPressable
              key={p.id}
              active={active}
              depth="sm"
              radius={radius.md}
              onPress={() =>
                update({
                  focusMinutes: p.focusMinutes,
                  shortBreakMinutes: p.shortBreakMinutes,
                  longBreakMinutes: p.longBreakMinutes,
                })
              }
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${p.name} preset: ${p.focusMinutes} minute focus, ${p.shortBreakMinutes} minute short break, ${p.longBreakMinutes} minute long break`}
              style={{ paddingHorizontal: space.lg, paddingVertical: space.md, minWidth: 104, alignItems: 'flex-start' }}
            >
              <AppText variant="label">{p.name}</AppText>
              <AppText variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                {p.focusMinutes} · {p.shortBreakMinutes} · {p.longBreakMinutes}
              </AppText>
            </NeuPressable>
          );
        })}
        {/* Not a button: reflects that the steppers below hold a non-preset combination. */}
        <Surface
          variant={preset ? 'raised' : 'inset'}
          depth="sm"
          radius={radius.md}
          accessible
          accessibilityLabel={preset ? 'Custom durations: adjust the steppers below' : 'Custom durations selected'}
          style={{ paddingHorizontal: space.lg, paddingVertical: space.md, minWidth: 104, opacity: preset ? 0.6 : 1 }}
        >
          <AppText variant="label">Custom</AppText>
          <AppText variant="caption" tone="muted">
            {preset ? 'Use steppers' : `${settings.focusMinutes} · ${settings.shortBreakMinutes} · ${settings.longBreakMinutes}`}
          </AppText>
        </Surface>
      </ScrollView>

      <SectionLabel>Durations</SectionLabel>
      <Card>
        <Stepper
          label="Focus"
          unit="min"
          hint="Hold ± to change by 5"
          value={settings.focusMinutes}
          {...LIMITS.focusMinutes}
          bigStep={5}
          onChange={(v) => update({ focusMinutes: v })}
        />
        <Divider />
        <Stepper
          label="Short break"
          unit="min"
          value={settings.shortBreakMinutes}
          {...LIMITS.shortBreakMinutes}
          bigStep={5}
          onChange={(v) => update({ shortBreakMinutes: v })}
        />
        <Divider />
        <Stepper
          label="Long break"
          unit="min"
          value={settings.longBreakMinutes}
          {...LIMITS.longBreakMinutes}
          bigStep={5}
          onChange={(v) => update({ longBreakMinutes: v })}
        />
        <Divider />
        <Stepper
          label="Long break after"
          unit="focus"
          hint="Focus sessions per cycle"
          value={settings.sessionsBeforeLongBreak}
          {...LIMITS.sessionsBeforeLongBreak}
          onChange={(v) => update({ sessionsBeforeLongBreak: v })}
        />
        {timer.status !== 'idle' && (
          <AppText variant="caption" tone="muted" style={{ marginTop: space.lg }}>
            New durations apply from the next session.
          </AppText>
        )}
      </Card>

      <SectionLabel>Session flow</SectionLabel>
      <Card>
        <SwitchRow
          label="Auto-start breaks"
          hint="Begin the break as soon as focus ends"
          value={settings.autoStartBreaks}
          onChange={(v) => update({ autoStartBreaks: v })}
          accent={t.phase.shortBreak}
        />
        <Divider />
        <SwitchRow
          label="Auto-start focus"
          hint="Begin the next focus session after a break"
          value={settings.autoStartFocus}
          onChange={(v) => update({ autoStartFocus: v })}
          accent={t.phase.focus}
        />
        <Divider />
        <Stepper
          label="Daily goal"
          unit="sessions"
          value={settings.dailyGoal}
          {...LIMITS.dailyGoal}
          onChange={(v) => update({ dailyGoal: v })}
        />
      </Card>

      <SectionLabel>Appearance</SectionLabel>
      <Card>
        <AppText variant="label" style={{ marginBottom: space.md }}>
          Theme
        </AppText>
        <Segmented<ThemePreference>
          accessibilityLabel="Theme"
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <SectionLabel>Alerts</SectionLabel>
      <Card>
        <SwitchRow
          label="Notifications"
          hint={
            isNative
              ? 'Alert me when a session ends, even in the background'
              : 'Available in the iOS and Android app'
          }
          value={settings.notificationsEnabled}
          onChange={toggleNotifications}
          disabled={!isNative}
        />
        {permissionDenied && (
          <AppText variant="caption" tone="danger" style={{ marginTop: space.sm }}>
            Notifications are blocked. Enable them for this app in your device settings.
          </AppText>
        )}
        <Divider />
        <SwitchRow
          label="Haptics"
          hint={isNative ? 'Gentle vibration on taps and completions' : 'Available in the iOS and Android app'}
          value={settings.hapticsEnabled}
          onChange={(v) => update({ hapticsEnabled: v })}
          disabled={!isNative}
        />
      </Card>

      <SectionLabel>Data</SectionLabel>
      <Card>
        <View style={{ gap: space.lg }}>
          <NeuButton
            label="Start a new cycle"
            icon="refresh"
            compact
            onPress={() => {
              actions.tap();
              actions.resetCycle();
            }}
            accessibilityHint="Resets the timer to a fresh focus session and clears the long-break counter"
          />
          <NeuButton
            label="Restore default settings"
            icon="options-outline"
            compact
            onPress={() =>
              confirm('Restore defaults?', 'All timer and app settings will be reset.', 'Restore', () =>
                actions.updateSettings(DEFAULT_SETTINGS),
              )
            }
          />
          <NeuButton
            label="Clear focus history"
            icon="trash-outline"
            tone="danger"
            compact
            disabled={sessions.length === 0}
            onPress={() =>
              confirm(
                'Clear focus history?',
                `All ${sessions.length} recorded sessions and statistics will be permanently deleted.`,
                'Clear',
                actions.clearHistory,
              )
            }
          />
        </View>
      </Card>

      <AppText variant="caption" tone="faint" align="center" style={{ marginTop: space.md }}>
        Pomodoro v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>
    </Screen>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <Surface style={{ padding: space.lg, marginBottom: space.xxl }}>
      {children}
    </Surface>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.divider, marginVertical: space.lg }} />;
}

interface SwitchRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
  disabled?: boolean;
}

function SwitchRow({ label, hint, value, onChange, accent, disabled }: SwitchRowProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
      <View style={{ flex: 1 }}>
        <AppText variant="label">{label}</AppText>
        {hint && (
          <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {hint}
          </AppText>
        )}
      </View>
      <NeuSwitch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        accentColor={accent}
        disabled={disabled}
      />
    </View>
  );
}
