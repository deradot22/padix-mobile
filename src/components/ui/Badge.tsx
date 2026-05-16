import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme/colors';

type Variant = 'default' | 'secondary' | 'primary' | 'amber' | 'destructive' | 'outline';

export function Badge({
  variant = 'secondary', children, style,
}: { variant?: Variant; children: React.ReactNode; style?: ViewStyle }) {
  const v = variants[variant];
  return (
    <View style={[styles.base, v.container, style]}>
      <Text style={[styles.text, v.text]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '500' },
});

const variants: Record<Variant, { container: any; text: any }> = {
  default: {
    container: { backgroundColor: colors.secondary, borderColor: colors.border },
    text: { color: colors.text },
  },
  secondary: {
    container: { backgroundColor: colors.secondary, borderColor: colors.border },
    text: { color: colors.textMuted },
  },
  primary: {
    container: { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder },
    text: { color: colors.primary, fontWeight: '600' },
  },
  amber: {
    container: { backgroundColor: colors.amberTint, borderColor: colors.amberTintBorder },
    text: { color: colors.warningFg, fontWeight: '600' },
  },
  destructive: {
    container: { backgroundColor: colors.destructiveTint, borderColor: colors.destructiveTintBorder },
    text: { color: colors.danger, fontWeight: '600' },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderColor: colors.border },
    text: { color: colors.text },
  },
};
