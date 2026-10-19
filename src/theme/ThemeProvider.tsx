import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemePreference } from '@/lib/types';

import { palettes, type Palette } from './theme';

const ThemeContext = createContext<Palette>(palettes.light);

export function ThemeProvider({
  preference,
  children,
}: {
  preference: ThemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return <ThemeContext.Provider value={palettes[scheme]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
