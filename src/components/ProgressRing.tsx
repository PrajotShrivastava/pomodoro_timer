import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, raisedShadow } from '@/theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size: number;
  /** 0..1 */
  progress: number;
  color: string;
  children?: ReactNode;
}

/**
 * Neumorphic dial: a raised disc holding an inset dish, with a raised knob in
 * the middle. The progress arc runs along the groove between dish and knob.
 */
export function ProgressRing({ size, progress, color, children }: Props) {
  const t = useTheme();
  const rim = Math.round(size * 0.05);
  const groove = Math.round(size * 0.095);
  const dish = size - rim * 2;
  const knob = dish - groove * 2;

  const stroke = Math.round(groove * 0.42);
  const r = dish / 2 - groove / 2;
  const circumference = 2 * Math.PI * r;

  const clamped = Math.min(1, Math.max(0, progress));
  const anim = useAnimatedValue(clamped);
  const prev = useRef(clamped);

  useEffect(() => {
    // Ticks glide linearly; big jumps (reset, skip) ease back.
    const jump = Math.abs(clamped - prev.current) > 0.02;
    prev.current = clamped;
    Animated.timing(anim, {
      toValue: clamped,
      duration: jump ? 450 : 300,
      easing: jump ? Easing.out(Easing.cubic) : Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  const dashOffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.bg,
        boxShadow: raisedShadow(t, 'lg'),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: dish,
          height: dish,
          borderRadius: dish / 2,
          backgroundColor: t.bg,
          boxShadow: insetShadow(t, 'md'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg
          width={dish}
          height={dish}
          style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
          pointerEvents="none"
        >
          <AnimatedCircle
            cx={dish / 2}
            cy={dish / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            opacity={clamped > 0 ? 1 : 0}
          />
        </Svg>
        <View
          style={{
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            backgroundColor: t.bg,
            boxShadow: raisedShadow(t, 'md'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
