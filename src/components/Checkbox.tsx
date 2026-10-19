import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme/ThemeProvider';

import { NeuPressable } from './NeuPressable';

interface Props {
  checked: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  color?: string;
}

/** Raised round key; pressed in with a check mark once done. */
export function Checkbox({ checked, onToggle, accessibilityLabel, color }: Props) {
  const t = useTheme();
  return (
    <NeuPressable
      onPress={onToggle}
      active={checked}
      depth="sm"
      radius={15}
      hitSlop={7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      style={{ width: 30, height: 30 }}
    >
      {checked && <Ionicons name="checkmark" size={18} color={color ?? t.phase.shortBreak} />}
    </NeuPressable>
  );
}
