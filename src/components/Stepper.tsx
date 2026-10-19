import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, space } from '@/theme/theme';

import { AppText } from './AppText';
import { IconButton } from './Buttons';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Step applied on long-press. */
  bigStep?: number;
  unit?: string;
  hint?: string;
}

/** A labelled row with a value readout pressed into the surface between − and + keys. */
export function Stepper({ label, value, onChange, min, max, step = 1, bigStep, unit, hint }: Props) {
  const t = useTheme();
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="label">{label}</AppText>
        {hint && (
          <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {hint}
          </AppText>
        )}
      </View>
      <IconButton
        icon="remove"
        size={36}
        onPress={() => set(value - step)}
        onLongPress={bigStep ? () => set(value - bigStep) : undefined}
        disabled={value <= min}
        accessibilityLabel={`Decrease ${label}`}
      />
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: unit ? `${value} ${unit}` : String(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => set(e.nativeEvent.actionName === 'increment' ? value + step : value - step)}
        style={{
          minWidth: 64,
          height: 40,
          paddingHorizontal: space.sm,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'sm'),
        }}
      >
        <AppText variant="label" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
          {unit ? <AppText variant="caption" tone="muted">{` ${unit}`}</AppText> : null}
        </AppText>
      </View>
      <IconButton
        icon="add"
        size={36}
        onPress={() => set(value + step)}
        onLongPress={bigStep ? () => set(value + bigStep) : undefined}
        disabled={value >= max}
        accessibilityLabel={`Increase ${label}`}
      />
    </View>
  );
}
