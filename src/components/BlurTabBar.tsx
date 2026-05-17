import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Renders a frosted background behind the bottom tab bar on iOS.
export default function BlurTabBarBackground() {
  if (Platform.OS !== 'ios') return null;
  return (
    <BlurView
      tint="dark"
      intensity={60}
      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(38,38,38,0.72)' }]}
    />
  );
}
