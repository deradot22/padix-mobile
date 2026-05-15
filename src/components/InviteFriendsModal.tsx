import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import type { FriendItem } from '../api/types';
import { colors } from '../theme/colors';

export default function InviteFriendsModal({
  visible, eventId, onClose, onChanged, excludeIds,
}: {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onChanged: () => void;
  excludeIds: string[];
}) {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) =>
      f.name.toLowerCase().includes(q) || f.publicId.toLowerCase().includes(q)
    );
  }, [friends, query]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api.friends()
      .then((s) => setFriends(s.friends))
      .catch((e) => setError(e?.message ?? 'Ошибка'))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleAdd = async (publicId: string) => {
    setBusyId(publicId);
    try {
      await api.addFriendToEvent(eventId, publicId);
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setBusyId(null);
    }
  };

  const handleInvite = async (publicId: string) => {
    setBusyId(publicId);
    try {
      await api.inviteFriendToEvent(eventId, publicId);
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Добавить друзей</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <TextInput
                style={styles.search}
                placeholder="Поиск по имени или ID"
                placeholderTextColor={colors.textDim}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />
              <FlatList
                data={filtered}
              keyExtractor={(f) => f.userId}
              ListEmptyComponent={<Text style={styles.empty}>Нет друзей</Text>}
              renderItem={({ item }) => {
                const already = excludeIds.includes(item.userId);
                const busy = busyId === item.publicId;
                return (
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.meta}>{item.gamesPlayed} матчей · {item.rating}</Text>
                    </View>
                    {already ? (
                      <Text style={styles.added}>добавлен</Text>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnPrimary, busy && { opacity: 0.5 }]}
                          onPress={() => handleAdd(item.publicId)}
                          disabled={busy}
                        >
                          <Text style={styles.actionBtnPrimaryText}>+ Добавить</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, busy && { opacity: 0.5 }]}
                          onPress={() => handleInvite(item.publicId)}
                          disabled={busy}
                        >
                          <Text style={styles.actionBtnText}>📨</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
          <Text style={styles.hint}>+ Добавить — мгновенно. 📨 — отправить приглашение.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  search: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '600' },
  close: { color: colors.textMuted, fontSize: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  name: { color: colors.text, fontSize: 14, fontWeight: '500' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  actionBtnText: { color: colors.textMuted, fontSize: 13 },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnPrimaryText: { color: '#000', fontSize: 12, fontWeight: '600' },
  added: { color: colors.textDim, fontSize: 12 },
  empty: { color: colors.textDim, fontSize: 13, textAlign: 'center', padding: 16 },
  hint: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8 },
  error: { color: colors.danger, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
