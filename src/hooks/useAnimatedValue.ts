import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * A stable Animated.Value for the component's lifetime. React Native ships its
 * own `useAnimatedValue`, but react-native-web doesn't, so we use this everywhere.
 */
export function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}
