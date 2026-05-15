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
import { api } from '../api/client';
import type { Event } from '../api/types';
import { colors } from '../theme/colors';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  OPEN_FOR_REGISTRATION: 'Регистрация',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  IN_PROGRESS: 'Идёт',
  FINISHED: 'Завершена',
  CANCELLED: 'Отменена',
};

const statusColors: Record<string, string> = {
  OPEN_FOR_REGISTRATION: colors.success,
  IN_PROGRESS: colors.primary,
  REGISTRATION_CLOSED: colors.warning,
};

export default function GamesScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.upcomingEvents();
      setEvents(data);
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить игры');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.createBtnText}>+ Создать игру</Text>
      </TouchableOpacity>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{error ?? 'Игр пока нет'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View
                style={[
                  styles.badge,
                  { borderColor: statusColors[item.status] ?? colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: statusColors[item.status] ?? colors.textMuted },
                  ]}
                >
                  {statusLabels[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              📅 {item.date} · {item.startTime?.slice(0, 5)}–{item.endTime?.slice(0, 5)}
            </Text>
            <Text style={styles.meta}>
              👥 {item.registeredCount} · 🎾 {item.courtsCount} кортов · {item.roundsPlanned} раундов
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg,
  },
  createBtn: {
    margin: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  createBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { color: colors.textDim, fontSize: 14 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '500' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
