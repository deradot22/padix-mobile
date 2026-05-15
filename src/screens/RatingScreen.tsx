import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api/client';
import type { Player } from '../api/types';
import { colors } from '../theme/colors';

export default function RatingScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.rating();
      setPlayers(data);
    } catch {
      // ignore
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
    <FlatList
      style={styles.container}
      data={players}
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
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <Text style={styles.rank}>{index + 1}</Text>
          <View style={styles.nameBox}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.gamesPlayed} матчей{item.ntrp ? ` · NTRP ${item.ntrp}` : ''}
            </Text>
          </View>
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
      )}
    />
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
    backgroundColor: colors.bg,
  },
  list: {
    padding: 16,
  },
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
  rank: {
    color: colors.textMuted,
    fontSize: 14,
    width: 30,
    fontWeight: '600',
  },
  nameBox: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  sub: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  rating: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
