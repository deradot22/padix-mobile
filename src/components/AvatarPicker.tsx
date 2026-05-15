import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';
import { colors } from '../theme/colors';

export default function AvatarPicker({
  avatarUrl, name, onUpdated,
}: { avatarUrl?: string | null; name?: string; onUpdated: (newUrl: string | null) => void }) {
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Доступ', 'Нужен доступ к фото');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Ошибка', 'Не удалось прочитать файл');
        return;
      }
      setBusy(true);
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      const me = await api.updateAvatar(dataUrl);
      onUpdated(me.avatarUrl ?? null);
    } catch (e: any) {
      Alert.alert('Аватар', e?.message ?? 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const me = await api.updateAvatar(null);
      onUpdated(me.avatarUrl ?? null);
    } catch (e: any) {
      Alert.alert('Аватар', e?.message ?? 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={pickImage} disabled={busy}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.image} />
          ) : (
            <Text style={styles.initial}>{initial}</Text>
          )}
          {busy && (
            <View style={styles.busy}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.btnRow}>
        <TouchableOpacity onPress={pickImage} style={styles.btn} disabled={busy}>
          <Text style={styles.btnText}>Изменить</Text>
        </TouchableOpacity>
        {avatarUrl && (
          <TouchableOpacity onPress={remove} style={styles.btn} disabled={busy}>
            <Text style={[styles.btnText, { color: colors.danger }]}>Удалить</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  initial: { color: colors.primary, fontSize: 40, fontWeight: '700' },
  busy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 6 },
  btnText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
});
