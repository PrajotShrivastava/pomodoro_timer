# Pomodoro

A neumorphic (soft UI) Pomodoro timer for iOS and Android, built with Expo SDK 58, Expo Router and TypeScript.

## Run it

```bash
npm install
npx expo start          # then press i (iOS simulator), a (Android emulator), or scan the QR code with Expo Go
npx expo start --web    # browser preview (no notifications/haptics)
```

Every native module used (AsyncStorage, notifications, haptics, SVG) ships in Expo Go, so no custom dev build is needed. To make a standalone build, use `npx eas-cli@latest build`.

## Scripts

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm test`          | Unit tests (timer engine, reducer, stats, storage parsing) |
| `npm run typecheck` | `tsc --noEmit`                      |
| `npm run lint`      | ESLint (Expo config + React Compiler rules) |

## How it's put together

```
src/
  app/                    Expo Router routes
    _layout.tsx           Providers, theme, root stack
    (tabs)/               Timer · Tasks · Stats · Settings
  lib/                    Pure logic, no React
    timerEngine.ts        Timestamp-based Pomodoro state machine
    stats.ts, time.ts     Aggregation and formatting
    storage.ts            AsyncStorage load/save with defensive parsing
    notifications.ts      Local notification scheduling
    settings.ts           Defaults, presets, limits, validation
  state/
    reducer.ts            All state transitions (pure, unit-tested)
    AppProvider.tsx       Hydration, persistence, background handling, side effects
  components/             Neumorphic UI kit (Surface, NeuPressable, ProgressRing, …)
  theme/                  Palettes, shadow recipes, spacing and type scale
```

### Timer reliability

The timer never counts ticks. A running session stores `endsAt`; the UI derives the remaining time as `endsAt - now`. A once-per-session `setTimeout` (not a ticking interval) fires the transition at the right moment. When the app returns to the foreground, or is relaunched after being killed, `reconcile()` replays every phase that ended in the meantime at its real end time. That means sessions finished in the background are recorded with correct timestamps, and auto-started chains pick up exactly where they would be. Local notifications are scheduled ahead of time along the projected auto-start chain, so they fire even while the app is suspended.

### Neumorphism

Every surface uses the same base color. Depth comes from a paired light (top-left) and dark (bottom-right) `boxShadow`, either raised or inset. React Native's native `boxShadow` needs the New Architecture, which is the default in SDK 58. Phase accents were validated for contrast and color-vision-deficiency separation against both the light and dark base colors.
