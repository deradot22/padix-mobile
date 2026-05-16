import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Trophy, TrendingUp, Users } from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Player } from '../api/types';
import { colors, radii } from '../theme/colors';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import PlayerAvatar from '../components/PlayerAvatar';

function ntrpLevel(rating: number): string {
  if (rating < 1200) return '1.0';
  if (rating < 1300) return '1.5';
  if (rating < 1400) return '2.0';
  if (rating < 1500) return '2.5';
  if (rating < 1600) return '3.0';
  if (rating < 1700) return '3.5';
  if (rating < 1800) return '4.0';
  if (rating < 1900) return '4.5';
  return '5.0+';
}

const NTRP_COLOR: Record<string, string> = {
  '1.0': '#a1a1aa', '1.5': '#a1a1aa',
  '2.0': '#34d399', '2.5': '#34d399',
  '3.0': '#38bdf8', '3.5': '#38bdf8',
  '4.0': '#a78bfa',
  '4.5': '#fbbf24',
  '5.0+': '#fb7185',
};

export default function RatingScreen() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.rating();
      setPlayers(data.filter((p) => !p.name.startsWith('Удалённый')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stats = useMemo(() => {
    const calibrated = players.filter((p) => (p.calibrationEventsRemaining ?? 0) === 0).length;
    const inCalib = players.filter((p) => (p.calibrationEventsRemaining ?? 0) > 0).length;
    return { total: players.length, calibrated, inCalib };
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, search]);

  const myRank = useMemo(() => {
    if (!user?.playerId) return null;
    const i = players.findIndex((p) => p.id === user.playerId);
    return i === -1 ? null : i + 1;
  }, [players, user?.playerId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader title="Рейтинг" subtitle="Топ игроков сообщества" />

      <View style={styles.statsRow}>
        <StatCard icon={<Users size={16} color={colors.primary} />} label="Всего" value={stats.total} />
        <StatCard icon={<Trophy size={16} color={colors.warningFg} />} label="Откалибровано" value={stats.calibrated} />
        <StatCard icon={<TrendingUp size={16} color={colors.textMuted} />} label="Калибровка" value={stats.inCalib} />
      </View>

      {myRank != null && (
        <Card style={{ marginBottom: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.rankBadge, getRankStyle(myRank)]}>
            <Text style={[styles.rankText, { color: getRankTextColor(myRank) }]}>{myRank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.myRankLabel}>Ваше место в рейтинге</Text>
            <Text style={styles.myRankName}>{user?.name}</Text>
          </View>
          <Text style={styles.myRating}>{user?.rating}</Text>
        </Card>
      )}

      <View style={styles.searchBox}>
        <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск игрока"
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <Card style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>Никого не нашли</Text>
        ) : (
          filtered.map((p, idx) => {
            const realRank = players.findIndex((x) => x.id === p.id) + 1;
            const isMe = p.id === user?.playerId;
            const isCalib = (p.calibrationEventsRemaining ?? 0) > 0;
            const ntrp = p.ntrp ?? ntrpLevel(p.rating);
            const ntrpColor = NTRP_COLOR[ntrp] ?? colors.textMuted;
            return (
              <View
                key={p.id}
                style={[
                  styles.row,
                  isMe && styles.rowMe,
                  idx !== filtered.length - 1 && styles.rowSep,
                ]}
              >
                <View style={[styles.rankBadge, getRankStyle(realRank)]}>
                  {realRank === 1 ? (
                    <Trophy size={12} color={getRankTextColor(1)} />
                  ) : (
                    <Text style={[styles.rankText, { color: getRankTextColor(realRank) }]}>{realRank}</Text>
                  )}
                </View>

                <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size={32} />

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.name, isMe && { color: colors.primary }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    {isMe && <Badge variant="primary">Вы</Badge>}
                    {isCalib && <Badge variant="amber">Калибровка</Badge>}
                  </View>
                  <Text style={styles.sub}>
                    {p.gamesPlayed} матчей · <Text style={{ color: ntrpColor }}>{ntrp}</Text>
                  </Text>
                </View>

                <Text style={styles.rating}>{p.rating}</Text>
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getRankStyle(rank: number) {
  if (rank === 1) return { backgroundColor: 'rgba(245,158,11,0.20)', borderColor: 'rgba(245,158,11,0.30)' };
  if (rank === 2) return { backgroundColor: 'rgba(148,163,184,0.20)', borderColor: 'rgba(148,163,184,0.30)' };
  if (rank === 3) return { backgroundColor: 'rgba(234,88,12,0.20)', borderColor: 'rgba(234,88,12,0.30)' };
  return { backgroundColor: colors.secondary, borderColor: colors.border };
}

function getRankTextColor(rank: number) {
  if (rank === 1) return colors.warningFg;
  if (rank === 2) return '#cbd5e1';
  if (rank === 3) return '#fb923c';
  return colors.textMuted;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: { marginBottom: 6 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  myRankLabel: { color: colors.textMuted, fontSize: 11 },
  myRankName: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
  myRating: { color: colors.primary, fontSize: 20, fontWeight: '700' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 10,
  },

  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 32 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowMe: { backgroundColor: 'rgba(34,197,94,0.08)' },
  rowSep: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 12, fontWeight: '700' },
  name: { color: colors.text, fontSize: 14, fontWeight: '500' },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rating: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
