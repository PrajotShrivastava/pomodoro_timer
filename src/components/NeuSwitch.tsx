import { useEffect } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, raisedShadow } from '@/theme/theme';

const TRACK_W = 56;
const TRACK_H = 32;
const KNOB = 24;
const PAD = (TRACK_H - KNOB) / 2;

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  accentColor?: string;
  disabled?: boolean;
}

/** Inset track with a raised knob that glides across; the knob's dot lights up when on. */
export function NeuSwitch({ value, onValueChange, accessibilityLabel, accentColor, disabled }: Props) {
  const t = useTheme();
  const accent = accentColor ?? t.phase.focus;
  const x = useAnimatedValue(value ? 1 : 0);

  useEffect(() => {
    Animated.spring(x, {
      toValue: value ? 1 : 0,
      useNativeDriver: Platform.OS !== 'web',
      speed: 18,
      bounciness: 5,
    }).start();
  }, [value, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_W - KNOB - PAD * 2] });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
    >
      <View
        style={{
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'sm'),
          padding: PAD,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Animated.View
          style={{
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: t.bg,
            boxShadow: raisedShadow(t, 'sm'),
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateX }],
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: value ? accent : t.textFaint,
              opacity: value ? 1 : 0.5,
            }}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}
