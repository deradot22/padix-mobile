import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme/colors';

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
type Size = 'default' | 'sm' | 'lg' | 'icon';

type Props = {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  fullWidth?: boolean;
};

export function Button({
  variant = 'default',
  size = 'default',
  disabled,
  loading,
  onPress,
  children,
  leftIcon,
  rightIcon,
  style,
  fullWidth,
}: Props) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  return (
    <TouchableOpacity
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.5 },
        style as any,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <>
          {leftIcon}
          {typeof children === 'string' ? (
            <Text style={[styles.textBase, v.text, s.text]}>{children}</Text>
          ) : (
            children
          )}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.md,
  },
  textBase: { fontSize: 14, fontWeight: '500' },
});

const variantStyles: Record<Variant, { container: ViewStyle; text: any; spinner: string }> = {
  default: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.primaryFg, fontWeight: '600' },
    spinner: colors.primaryFg,
  },
  destructive: {
    container: { backgroundColor: colors.danger },
    text: { color: '#fff', fontWeight: '600' },
    spinner: '#fff',
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    text: { color: colors.text },
    spinner: colors.text,
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    text: { color: colors.text },
    spinner: colors.text,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.text },
    spinner: colors.text,
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: any }> = {
  default: { container: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 }, text: {} },
  sm: { container: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 32 }, text: { fontSize: 13 } },
  lg: { container: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 44 }, text: { fontSize: 15 } },
  icon: { container: { width: 40, height: 40, padding: 0 }, text: {} },
};
