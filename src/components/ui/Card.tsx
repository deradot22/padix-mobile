import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, radii } from '../../theme/colors';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardHeader({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function CardDescription({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.desc, style]}>{children}</Text>;
}

export function CardContent({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.content, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  desc: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
});
