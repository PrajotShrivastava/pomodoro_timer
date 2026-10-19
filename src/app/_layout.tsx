import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useAppState } from '@/state/AppProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function ThemedApp() {
  const t = useTheme();
  const navTheme = useMemo(() => {
    const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: t.bg, card: t.bg, text: t.text, primary: t.phase.focus, border: 'transparent' },
    };
  }, [t]);

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NavThemeProvider>
  );
}

function Root() {
  const { hydrated, settings } = useAppState();
  return (
    <ThemeProvider preference={settings.theme}>
      {hydrated ? <ThemedApp /> : <Splash />}
    </ThemeProvider>
  );
}

/** Plain base-colored screen while persisted state loads (usually a few ms). */
function Splash() {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
