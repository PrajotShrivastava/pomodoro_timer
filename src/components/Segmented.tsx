import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, raisedShadow, space } from '@/theme/theme';

import { AppText } from './AppText';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Optional accent shown as a dot beside the selected label. */
  color?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Inset track whose selected option rises out of it. */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel, style }: Props<T>) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          flexDirection: 'row',
          padding: 5,
          gap: 4,
          borderRadius: radius.md,
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'sm'),
        },
        style,
      ]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={{
              flex: 1,
              minHeight: 38,
              paddingHorizontal: space.sm,
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md - 5,
              backgroundColor: t.bg,
              boxShadow: selected ? raisedShadow(t, 'sm') : undefined,
            }}
          >
            {selected && o.color && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: o.color }} />
            )}
            <AppText
              variant="caption"
              numberOfLines={1}
              color={selected ? t.text : t.textMuted}
              style={{ fontWeight: selected ? '700' : '500' }}
            >
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
