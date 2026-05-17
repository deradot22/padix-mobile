import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import type { EventInviteItem } from '../api/types';
import { colors } from '../theme/colors';

export default function InvitesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [invites, setInvites] = useState<EventInviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.invites();
      setInvites(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAccept = async (eventId: string) => {
    setBusyId(eventId);
    try {
      await api.acceptEventInvite(eventId);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (eventId: string) => {
    setBusyId(eventId);
    try {
      await api.declineEventInvite(eventId);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={invites}
      keyExtractor={(item) => item.eventId}
      contentContainerStyle={[styles.list, { paddingTop: insets.top + 12 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Нет приглашений</Text>
        </View>
      }
      renderItem={({ item }) => {
        const busy = busyId === item.eventId;
        return (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
            >
              <Text style={styles.title}>{item.eventTitle}</Text>
              <Text style={styles.meta}>{item.eventDate}</Text>
              <Text style={styles.from}>от {item.fromName}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.5 }]}
                onPress={() => handleAccept(item.eventId)}
                disabled={busy}
              >
                <Text style={styles.btnPrimaryText}>Принять</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost, busy && { opacity: 0.5 }]}
                onPress={() => handleDecline(item.eventId)}
                disabled={busy}
              >
                <Text style={styles.btnGhostText}>Отклонить</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  list: { padding: 16 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textDim, fontSize: 14 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  from: { color: colors.primary, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#000', fontSize: 14, fontWeight: '600' },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.textMuted, fontSize: 14 },
});
