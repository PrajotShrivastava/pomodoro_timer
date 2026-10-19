import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Current wall-clock time, refreshed every `intervalMs` while `active`.
 * This only drives re-rendering — the displayed values are always derived from
 * timestamps, so a late or skipped tick never causes drift.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Sync right away so a freshly started timer doesn't show a stale reading.
    const first = setTimeout(tick, 0);
    if (!active) return () => clearTimeout(first);
    const id = setInterval(tick, intervalMs);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearTimeout(first);
      clearInterval(id);
      sub.remove();
    };
  }, [active, intervalMs]);

  return now;
}
