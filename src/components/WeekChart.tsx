import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { formatDuration, formatDayLabel } from '@/lib/time';
import type { DayTotal } from '@/lib/stats';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, space } from '@/theme/theme';

import { AppText } from './AppText';

const CHART_H = 132;
const GROOVE_W = 20;
const PAD = 3;

interface Props {
  days: DayTotal[];
  now: number;
  color: string;
}

/**
 * Seven inset grooves filled from the baseline with focus time. Tapping a day
 * reads its value out in the header (the touch equivalent of a hover tooltip),
 * so values are never encoded by bar height alone.
 */
export function WeekChart({ days, now, color }: Props) {
  const t = useTheme();
  const [selected, setSelected] = useState(days.length - 1);
  const day = days[Math.min(selected, days.length - 1)];
  const max = Math.max(...days.map((d) => d.ms), 1);
  const inner = CHART_H - PAD * 2;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: space.lg }}>
        <AppText variant="label" style={{ flex: 1 }}>
          {formatDayLabel(day.dayStart, now)}
        </AppText>
        <AppText variant="label">{formatDuration(day.ms)}</AppText>
        <AppText variant="caption" tone="muted">
          {`  ·  ${day.count} session${day.count === 1 ? '' : 's'}`}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((d, i) => {
          const isSel = i === selected;
          const h = d.ms > 0 ? Math.max(GROOVE_W - PAD * 2, (d.ms / max) * inner) : 0;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelected(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={`${formatDayLabel(d.dayStart, now)}: ${formatDuration(d.ms)}, ${d.count} sessions`}
              hitSlop={{ left: 6, right: 6 }}
              style={{ alignItems: 'center', gap: space.sm }}
            >
              <View
                style={{
                  width: GROOVE_W,
                  height: CHART_H,
                  borderRadius: GROOVE_W / 2,
                  backgroundColor: t.bg,
                  boxShadow: insetShadow(t, 'sm'),
                  padding: PAD,
                  justifyContent: 'flex-end',
                }}
              >
                {h > 0 && (
                  <View
                    style={{
                      height: h,
                      borderRadius: (GROOVE_W - PAD * 2) / 2,
                      backgroundColor: color,
                      opacity: isSel ? 1 : 0.7,
                    }}
                  />
                )}
              </View>
              <AppText
                variant="caption"
                tone={isSel ? 'default' : 'muted'}
                style={{ fontSize: 11, fontWeight: isSel ? '700' : '500' }}
              >
                {d.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
