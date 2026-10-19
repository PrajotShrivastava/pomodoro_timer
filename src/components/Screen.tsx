import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/theme';

import { AppText } from './AppText';

interface Props {
  title?: string;
  subtitle?: string;
  /** Element shown at the right of the title row. */
  accessory?: ReactNode;
  scroll?: boolean;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Page shell: base color, safe-area padding, title row and comfortable gutters. */
export function Screen({ title, subtitle, accessory, scroll = true, children, contentStyle }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const header = title ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.xl }}>
      <View style={{ flex: 1 }}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        )}
      </View>
      {accessory}
    </View>
  ) : null;

  const padding: ViewStyle = {
    paddingTop: insets.top + space.lg,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  };

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={[padding, { flex: 1 }, contentStyle]}>
          {header}
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {header}
      {children}
    </ScrollView>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="overline" tone="muted" style={{ marginBottom: space.md, marginLeft: space.xs }}>
      {children}
    </AppText>
  );
}
