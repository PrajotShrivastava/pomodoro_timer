import type { Phase } from '@/lib/types';

export type Depth = 'sm' | 'md' | 'lg';

export interface Palette {
  scheme: 'light' | 'dark';
  /** The single base surface color — neumorphism extrudes everything from it. */
  bg: string;
  text: string;
  textMuted: string;
  textFaint: string;
  shadowLight: string;
  shadowDark: string;
  /** Hairline used sparingly for separators inside insets. */
  divider: string;
  danger: string;
  /** Phase accents; validated for contrast and CVD separation against `bg` in each mode. */
  phase: Record<Phase, string>;
}

const light: Palette = {
  scheme: 'light',
  bg: '#E4EBF5',
  text: '#2B3648',
  textMuted: '#56627A',
  textFaint: '#8793A8',
  shadowLight: 'rgba(255, 255, 255, 0.95)',
  shadowDark: 'rgba(158, 172, 196, 0.75)',
  divider: 'rgba(120, 135, 160, 0.18)',
  danger: '#C94343',
  phase: {
    focus: '#DC5443',
    shortBreak: '#21977F',
    longBreak: '#4F6FD8',
  },
};

const dark: Palette = {
  scheme: 'dark',
  bg: '#2A2E37',
  text: '#E7EBF3',
  textMuted: '#A4ADBE',
  textFaint: '#737D90',
  shadowLight: 'rgba(62, 68, 81, 0.9)',
  shadowDark: 'rgba(17, 19, 24, 0.85)',
  divider: 'rgba(255, 255, 255, 0.06)',
  danger: '#FF7A7A',
  phase: {
    focus: '#E86655',
    shortBreak: '#2EAA8F',
    longBreak: '#6F8CF0',
  },
};

export const palettes = { light, dark };

const DEPTHS: Record<Depth, { offset: number; blur: number }> = {
  sm: { offset: 3, blur: 6 },
  md: { offset: 6, blur: 14 },
  lg: { offset: 10, blur: 24 },
};

/** Two opposing soft shadows: light from the top-left, shade to the bottom-right. */
export function raisedShadow(p: Palette, depth: Depth = 'md'): string {
  const { offset: o, blur: b } = DEPTHS[depth];
  return `${-o}px ${-o}px ${b}px 0px ${p.shadowLight}, ${o}px ${o}px ${b}px 0px ${p.shadowDark}`;
}

/** The same light model, pressed into the surface. */
export function insetShadow(p: Palette, depth: Depth = 'md'): string {
  const { offset: o, blur: b } = DEPTHS[depth];
  return `inset ${o}px ${o}px ${b}px 0px ${p.shadowDark}, inset ${-o}px ${-o}px ${b}px 0px ${p.shadowLight}`;
}

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 56, fontWeight: '300' as const, letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  overline: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.2 },
};
