import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/theme';

import { AppText } from './AppText';
import { NeuPressable } from './NeuPressable';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** Accent color for text/icon; defaults to the primary text color. */
  color?: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  active?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function NeuButton({
  label,
  onPress,
  icon,
  color,
  tone = 'default',
  disabled,
  active,
  compact,
  style,
  accessibilityHint,
}: ButtonProps) {
  const t = useTheme();
  const fg = color ?? (tone === 'danger' ? t.danger : t.text);
  return (
    <NeuPressable
      onPress={onPress}
      disabled={disabled}
      active={active}
      depth={compact ? 'sm' : 'md'}
      radius={radius.md}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      containerStyle={style}
      style={{
        flexDirection: 'row',
        gap: space.sm,
        minHeight: compact ? 40 : 52,
        paddingHorizontal: compact ? space.lg : space.xl,
      }}
    >
      {icon && <Ionicons name={icon} size={compact ? 16 : 18} color={fg} />}
      <AppText variant="label" color={fg}>
        {label}
      </AppText>
    </NeuPressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  iconSize?: number;
  color?: string;
  active?: boolean;
  disabled?: boolean;
  depth?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  onLongPress,
  accessibilityLabel,
  size = 44,
  iconSize,
  color,
  active,
  disabled,
  depth = 'sm',
  style,
}: IconButtonProps) {
  const t = useTheme();
  return (
    <NeuPressable
      onPress={onPress}
      onLongPress={onLongPress}
      active={active}
      disabled={disabled}
      depth={depth}
      radius={size / 2}
      accessibilityLabel={accessibilityLabel}
      hitSlop={size < 44 ? (44 - size) / 2 : undefined}
      style={[{ width: size, height: size }, style]}
    >
      <View>
        <Ionicons name={icon} size={iconSize ?? Math.round(size * 0.42)} color={color ?? t.textMuted} />
      </View>
    </NeuPressable>
  );
}
