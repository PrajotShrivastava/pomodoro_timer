import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, space, type as typeScale } from '@/theme/theme';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

/** A text input carved into the surface. */
export function TextField({ containerStyle, style, ...rest }: Props) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius.md,
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'sm'),
          paddingHorizontal: space.lg,
          minHeight: 52,
          justifyContent: 'center',
        },
        containerStyle,
      ]}
    >
      <TextInput
        placeholderTextColor={t.textFaint}
        selectionColor={t.phase.focus}
        {...rest}
        style={[typeScale.body, { color: t.text, paddingVertical: space.md, outlineStyle: 'none' } as object, style]}
      />
    </View>
  );
}
