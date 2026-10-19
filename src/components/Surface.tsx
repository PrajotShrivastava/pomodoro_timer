import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius as radii, raisedShadow, type Depth } from '@/theme/theme';

export type SurfaceVariant = 'raised' | 'inset' | 'flat';

export interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  depth?: Depth;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A soft extruded (raised) or pressed-in (inset) panel of the base color. */
export function Surface({
  variant = 'raised',
  depth = 'md',
  radius = radii.lg,
  style,
  ...rest
}: SurfaceProps) {
  const t = useTheme();
  const boxShadow =
    variant === 'raised' ? raisedShadow(t, depth) : variant === 'inset' ? insetShadow(t, depth) : undefined;
  return <View {...rest} style={[{ backgroundColor: t.bg, borderRadius: radius, boxShadow }, style]} />;
}
