import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RatingHistoryPoint } from '../api/types';
import { colors } from '../theme/colors';

const HEIGHT = 140;
const PADDING = 18;

type Period = '7d' | '30d' | '3m' | 'all';

const PERIOD_DAYS: Record<Period, number | null> = {
  '7d': 7,
  '30d': 30,
  '3m': 90,
  'all': null,
};

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7д',
  '30d': '30д',
  '3m': '3м',
  'all': 'Всё',
};

export default function RatingMiniChart({ points }: { points: RatingHistoryPoint[] }) {
  const [width, setWidth] = useState(300);
  const [period, setPeriod] = useState<Period>('30d');

  const filtered = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (!days) return points;
    const cutoff = Date.now() - days * 86400000;
    const result = points.filter((p) => {
      const t = Date.parse(p.date);
      return Number.isFinite(t) && t >= cutoff;
    });
    return result.length >= 2 ? result : points.slice(-Math.min(points.length, 10));
  }, [points, period]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (filtered.length < 2) return <Text style={styles.empty}>Нужно минимум 2 матча</Text>;

  const ratings = filtered.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = Math.max(1, max - min);

  const innerW = Math.max(1, width - PADDING * 2);
  const innerH = HEIGHT - PADDING * 2;

  const toXY = (i: number, v: number) => {
    const x = PADDING + (i / (filtered.length - 1)) * innerW;
    const y = PADDING + (1 - (v - min) / range) * innerH;
    return { x, y };
  };

  const segments: { x: number; y: number; len: number; angle: number; up: boolean }[] = [];
  for (let i = 0; i < filtered.length - 1; i++) {
    const a = toXY(i, filtered[i].rating);
    const b = toXY(i + 1, filtered[i + 1].rating);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    segments.push({ x: a.x, y: a.y, len, angle, up: dy <= 0 });
  }

  const first = filtered[0].rating;
  const last = filtered[filtered.length - 1].rating;
  const totalDelta = last - first;

  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.rating}>{last}</Text>
          <Text
            style={[
              styles.delta,
              { color: totalDelta >= 0 ? colors.success : colors.danger },
            ]}
          >
            {totalDelta >= 0 ? '+' : ''}{totalDelta} за период
          </Text>
        </View>
        <View style={styles.periodRow}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View onLayout={onLayout} style={styles.box}>
        {segments.map((s, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                left: s.x,
                top: s.y,
                width: s.len,
                backgroundColor: s.up ? colors.success : colors.danger,
                transform: [{ translateY: -1 }, { rotateZ: `${s.angle}deg` }],
              },
            ]}
          />
        ))}
        {filtered.map((p, i) => {
          const { x, y } = toXY(i, p.rating);
          return (
            <View
              key={`pt-${i}`}
              style={[styles.point, { left: x - 3, top: y - 3 }]}
            />
          );
        })}
        <Text style={[styles.axisLabel, { top: 4, left: 6 }]}>{max}</Text>
        <Text style={[styles.axisLabel, { bottom: 4, left: 6 }]}>{min}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  rating: { color: colors.text, fontSize: 24, fontWeight: '700' },
  delta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { color: colors.textMuted, fontSize: 11 },
  periodTextActive: { color: '#000', fontWeight: '600' },
  box: {
    width: '100%',
    height: HEIGHT,
    position: 'relative',
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center' as any,
  },
  point: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  axisLabel: { color: colors.textDim, fontSize: 10, position: 'absolute' },
  empty: { color: colors.textDim, fontSize: 12, textAlign: 'center', padding: 16 },
});
