import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

export default function GamesScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <View style={styles.center}>
            <Text style={styles.empty}>
              {error ?? 'Игр пока нет'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {statusLabels[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {item.date} · {item.startTime?.slice(0, 5)}–{item.endTime?.slice(0, 5)}
            </Text>
            <Text style={styles.meta}>
              Игроков: {item.registeredCount} · Кортов: {item.courtsCount} · Раундов: {item.roundsPlanned}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  list: {
    padding: 16,
  },
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
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    color: colors.textDim,
    fontSize: 14,
  },
});
