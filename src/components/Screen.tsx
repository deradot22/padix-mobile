import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: Array<'top' | 'bottom'>;
};

/**
 * Tab screens: applies safe-area padding so content does not collide with
 * status bar (notch / clock) or the home indicator.
 */
export default function Screen({ children, style, edges = ['top'] }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        },
        style as any,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
