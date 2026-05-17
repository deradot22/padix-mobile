import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
};

export function AnimatedCard({ children, delay = 0, style }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(350).delay(delay).springify().damping(18)} style={style as any}>
      {children}
    </Animated.View>
  );
}
