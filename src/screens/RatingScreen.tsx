import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Player } from '../api/types';
import { colors } from '../theme/colors';

export default function RatingScreen() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.rating();
      setPlayers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, search]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск игрока"
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
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
          <Text style={styles.empty}>Никого не нашли</Text>
        }
        renderItem={({ item, index }) => {
          const isMe = item.id === user?.playerId;
          // Need to compute rank against full list (not filtered)
          const realRank = players.findIndex((p) => p.id === item.id) + 1;
          return (
            <View style={[styles.row, isMe && styles.rowMe]}>
              <Text style={styles.rank}>{realRank}</Text>
              <View style={styles.nameBox}>
                <Text style={[styles.name, isMe && { color: colors.primary }]}>
                  {item.name} {isMe ? '(вы)' : ''}
                </Text>
                <Text style={styles.sub}>
                  {item.gamesPlayed} матчей{item.ntrp ? ` · NTRP ${item.ntrp}` : ''}
                  {(item.calibrationEventsRemaining ?? 0) > 0 ? ' · калибровка' : ''}
                </Text>
              </View>
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg,
  },
  searchBox: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchInput: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  list: { padding: 16 },
  empty: { color: colors.textDim, textAlign: 'center', padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMe: { borderColor: colors.primary },
  rank: { color: colors.textMuted, fontSize: 14, width: 36, fontWeight: '600' },
  nameBox: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '500' },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  rating: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
