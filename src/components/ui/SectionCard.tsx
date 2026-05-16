import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme/colors';

type Props = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function SectionCard({ icon, title, subtitle, right, children, style }: Props) {
  return (
    <View style={[styles.card, style as any]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  body: { marginTop: 14 },
});
