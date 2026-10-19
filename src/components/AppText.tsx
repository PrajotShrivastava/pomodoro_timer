import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { type as typeScale } from '@/theme/theme';

type Variant = keyof typeof typeScale;
type Tone = 'default' | 'muted' | 'faint' | 'danger';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  /** Overrides tone, e.g. a phase accent. */
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function AppText({ variant = 'body', tone = 'default', color, align, style, ...rest }: Props) {
  const t = useTheme();
  const toneColor =
    tone === 'muted' ? t.textMuted : tone === 'faint' ? t.textFaint : tone === 'danger' ? t.danger : t.text;
  return (
    <Text
      {...rest}
      style={[
        typeScale[variant],
        variant === 'overline' && { textTransform: 'uppercase' },
        { color: color ?? toneColor, textAlign: align },
        style,
      ]}
    />
  );
}
