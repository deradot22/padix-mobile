import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme/colors';

type Tone = 'primary' | 'amber' | 'destructive' | 'neutral';

type Props = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: Tone;
  filled?: boolean;
  style?: ViewStyle;
};

export function PillBadge({ icon, children, tone = 'primary', filled = false, style }: Props) {
  const t = TONE[tone];
  const containerStyle = filled
    ? { backgroundColor: t.filledBg, borderColor: t.border }
    : { backgroundColor: 'transparent', borderColor: t.border };
  const textColor = filled ? t.filledText : t.text;
  return (
    <View style={[styles.base, containerStyle, style]}>
      {icon}
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </View>
  );
}

const TONE: Record<Tone, { border: string; text: string; filledBg: string; filledText: string }> = {
  primary: {
    border: 'rgba(34,197,94,0.35)',
    text: colors.primary,
    filledBg: 'rgba(34,197,94,0.15)',
    filledText: colors.primary,
  },
  amber: {
    border: 'rgba(245,158,11,0.35)',
    text: colors.warningFg,
    filledBg: 'rgba(245,158,11,0.15)',
    filledText: colors.warningFg,
  },
  destructive: {
    border: 'rgba(239,68,68,0.35)',
    text: colors.danger,
    filledBg: 'rgba(239,68,68,0.15)',
    filledText: colors.danger,
  },
  neutral: {
    border: colors.border,
    text: colors.textMuted,
    filledBg: colors.secondary,
    filledText: colors.text,
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
