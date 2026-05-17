import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radii } from '../../theme/colors';
import { haptic } from '../../lib/haptics';

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
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'none';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  hapticType = 'light',
}: Props) {
  const scale = useSharedValue(1);
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    if (hapticType !== 'none') haptic[hapticType]();
    onPress?.();
  }, [hapticType, onPress]);

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); }}
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.5 },
        animStyle,
        style as any,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
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
    </AnimatedPressable>
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
  lg: { container: { paddingHorizontal: 24, paddingVertical: 14, minHeight: 50 }, text: { fontSize: 16 } },
  icon: { container: { width: 40, height: 40, padding: 0 }, text: {} },
};
