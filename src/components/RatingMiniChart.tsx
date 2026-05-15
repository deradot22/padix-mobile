import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import type { RatingHistoryPoint } from '../api/types';
import { colors } from '../theme/colors';

const HEIGHT = 120;
const PADDING = 16;

export default function RatingMiniChart({ points }: { points: RatingHistoryPoint[] }) {
  const [width, setWidth] = useState(300);

  if (points.length < 2) return null;

  const ratings = points.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = Math.max(1, max - min);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const innerW = Math.max(1, width - PADDING * 2);
  const innerH = HEIGHT - PADDING * 2;

  const toXY = (i: number, v: number) => {
    const x = PADDING + (i / (points.length - 1)) * innerW;
    const y = PADDING + (1 - (v - min) / range) * innerH;
    return { x, y };
  };

  // Build line as a sequence of small rotated rectangles between consecutive points
  const segments: { x: number; y: number; len: number; angle: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = toXY(i, points[i].rating);
    const b = toXY(i + 1, points[i + 1].rating);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    segments.push({ x: a.x, y: a.y, len, angle });
  }

  return (
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
              transform: [{ translateY: -1 }, { rotateZ: `${s.angle}deg` }],
            },
          ]}
        />
      ))}
      {points.map((p, i) => {
        const { x, y } = toXY(i, p.rating);
        return (
          <View
            key={`pt-${i}`}
            style={[styles.point, { left: x - 3, top: y - 3 }]}
          />
        );
      })}
      <Text style={[styles.label, { top: 4, left: 6 }]}>{max}</Text>
      <Text style={[styles.label, { bottom: 4, left: 6 }]}>{min}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.primary,
    transformOrigin: 'left center' as any,
  },
  point: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  label: { color: colors.textDim, fontSize: 10, position: 'absolute' },
});
