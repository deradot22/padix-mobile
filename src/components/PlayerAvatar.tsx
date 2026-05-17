import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

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
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
          placeholder={BLURHASH}
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  initial: { color: colors.primary, fontWeight: '700' },
});
