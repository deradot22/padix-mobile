import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function PlayerAvatar({
  name, avatarUrl, size = 28,
}: { name: string; avatarUrl?: string | null; size?: number }) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <View style={[
      styles.box,
      { width: size, height: size, borderRadius: size / 2 },
    ]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  initial: { color: colors.primary, fontWeight: '700' },
});
