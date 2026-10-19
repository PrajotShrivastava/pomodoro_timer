import { useEffect } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow } from '@/theme/theme';

interface Props {
  /** 0..1 */
  progress: number;
  color: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** An inset groove filled with a softly glowing accent bar. */
export function ProgressBar({ progress, color, height = 12, style, accessibilityLabel }: Props) {
  const t = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const anim = useAnimatedValue(clamped);

  useEffect(() => {
    // Width can't use the native driver.
    Animated.timing(anim, { toValue: clamped, duration: 450, useNativeDriver: false }).start();
  }, [clamped, anim]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'sm'),
          padding: 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          minWidth: clamped > 0 ? height - 4 : 0,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          borderRadius: (height - 4) / 2,
          backgroundColor: color,
          boxShadow: `0px 0px 6px 0px ${color}66`,
        }}
      />
    </View>
  );
}
