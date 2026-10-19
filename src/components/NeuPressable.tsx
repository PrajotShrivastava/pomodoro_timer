import type { ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius as radii, raisedShadow, type Depth } from '@/theme/theme';

const useNativeDriver = Platform.OS !== 'web';

export interface NeuPressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  /** Renders pressed-in, e.g. a selected or "on" control. */
  active?: boolean;
  disabled?: boolean;
  depth?: Depth;
  radius?: number;
  /** Visual styles for the extruded surface (padding, size, layout of children). */
  style?: StyleProp<ViewStyle>;
  /** Layout styles for the outer touch target (flex, alignSelf, margins). */
  containerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  hitSlop?: number;
  testID?: string;
}

/**
 * The tactile building block: a raised surface that sinks into the page while
 * pressed (shadow flips to inset) with a slight spring on the scale.
 */
export function NeuPressable({
  onPress,
  onLongPress,
  active = false,
  disabled = false,
  depth = 'md',
  radius = radii.md,
  style,
  containerStyle,
  children,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
  ...a11y
}: NeuPressableProps) {
  const t = useTheme();
  const scale = useAnimatedValue(1);

  const springTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => springTo(0.97)}
      onPressOut={() => springTo(1)}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      hitSlop={hitSlop}
      style={containerStyle}
      {...a11y}
    >
      {({ pressed }) => {
        const sunk = pressed || active;
        return (
          <Animated.View
            style={[
              {
                backgroundColor: t.bg,
                borderRadius: radius,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: sunk ? insetShadow(t, depth === 'lg' ? 'md' : 'sm') : raisedShadow(t, depth),
                opacity: disabled ? 0.45 : 1,
                transform: [{ scale }],
              },
              style,
            ]}
          >
            {children}
          </Animated.View>
        );
      }}
    </Pressable>
  );
}
