import { Bell, Menu } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme/colors';

export default function TopHeader({ onMenuPress }: { onMenuPress?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo}>padix</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} hitSlop={6}>
          <Bell size={18} color={colors.text} />
        </TouchableOpacity>
        {onMenuPress && (
          <TouchableOpacity style={styles.iconBtn} hitSlop={6} onPress={onMenuPress}>
            <Menu size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { color: colors.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.5 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
