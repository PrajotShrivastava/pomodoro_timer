import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';

import { useActions, useAppState } from '@/state/AppProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, raisedShadow, space } from '@/theme/theme';

import { AppText } from './AppText';
import type { IconName } from './Buttons';

const ICONS: Record<string, IconName> = {
  index: 'timer-outline',
  tasks: 'checkbox-outline',
  stats: 'stats-chart-outline',
  settings: 'options-outline',
};

/** A floating raised dock; the current tab is pressed into it. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const t = useTheme();
  const { tap } = useActions();
  const phase = useAppState().timer.phase;
  const accent = t.phase[phase];

  return (
    <View
      style={{
        backgroundColor: t.bg,
        paddingHorizontal: space.xl,
        paddingTop: space.sm,
        paddingBottom: Math.max(insets.bottom, space.lg),
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          width: '100%',
          maxWidth: 512,
          alignSelf: 'center',
          padding: space.sm,
          gap: space.xs,
          borderRadius: radius.lg,
          backgroundColor: t.bg,
          boxShadow: raisedShadow(t, 'md'),
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              tap();
              navigateToTab(route.key);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={{
                flex: 1,
                height: 56,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: t.bg,
                boxShadow: focused ? insetShadow(t, 'sm') : undefined,
              }}
            >
              <Ionicons name={ICONS[route.name] ?? 'ellipse-outline'} size={22} color={focused ? accent : t.textMuted} />
              <AppText
                variant="caption"
                color={focused ? t.text : t.textMuted}
                style={{ fontSize: 11, fontWeight: focused ? '700' : '500' }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
