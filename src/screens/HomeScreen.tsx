import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Calendar, ChevronRight, Gamepad2, Sparkles, TrendingUp, Trophy, Users,
} from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Event, Player } from '../api/types';
import { colors, radii } from '../theme/colors';
import { Button } from '../components/ui/Button';
import { SectionCard } from '../components/ui/SectionCard';
import { PillBadge } from '../components/ui/PillBadge';

function shortDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return `${parseInt(m[3])} ${months[d.getMonth()]}`;
}

function timeRange(start: string, end: string): string {
  return `${start?.slice(0, 5)}–${end?.slice(0, 5)}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ev, rk] = await Promise.allSettled([api.upcomingEvents(), api.rating()]);
      if (ev.status === 'fulfilled') setEvents(ev.value.filter((e) => e.status !== 'FINISHED'));
      if (rk.status === 'fulfilled') setPlayers(rk.value);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const today = todayStr();
  const gamesToday = events.filter((e) => e.date === today).length;
  const activePlayers = players.length;
  const calibrated = players.filter((p) => (p.calibrationEventsRemaining ?? 0) === 0).length;
  const inCalibration = activePlayers - calibrated;
  const matchesThisWeek = 0; // not in API yet

  const topPlayers = players.slice(0, 3);
  const upcomingShort = events.slice(0, 2);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 14 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Hero card */}
      <View style={styles.hero}>
        <PillBadge icon={<Sparkles size={12} color={colors.primary} />} tone="primary" filled>
          Сезон 2026
        </PillBadge>
        <Text style={styles.heroTitle}>
          Добро пожаловать в <Text style={{ color: colors.primary }}>padix</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Организуйте игры в падел, отслеживайте свой рейтинг и находите партнёров для игры.
        </Text>
        <View style={styles.heroButtons}>
          <Button
            fullWidth
            onPress={() => navigation.navigate('Games')}
            leftIcon={<Gamepad2 size={16} color={colors.primaryFg} />}
          >
            Найти игру
          </Button>
          <Button
            fullWidth
            variant="outline"
            onPress={() => navigation.navigate('CreateEvent')}
            rightIcon={<ChevronRight size={16} color={colors.text} />}
          >
            Создать игру
          </Button>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Users size={18} color={colors.primary} />}
          value={activePlayers}
          label="Активных игроков"
          sub={`${calibrated} откалиброваны · ${inCalibration} в калибровке`}
        />
        <StatCard
          icon={<Gamepad2 size={18} color={colors.primary} />}
          value={gamesToday}
          label="Игр сегодня"
        />
        <StatCard
          icon={<TrendingUp size={18} color={colors.primary} />}
          value={matchesThisWeek}
          label="Матчей за неделю"
        />
      </View>

      {/* Upcoming games */}
      <SectionCard
        icon={<Calendar size={18} color={colors.primary} />}
        title="Ближайшие игры"
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Games')} style={styles.linkRow}>
            <Text style={styles.link}>Все игры</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        }
      >
        {upcomingShort.length === 0 ? (
          <Text style={styles.empty}>Пока нет ближайших игр</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {upcomingShort.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.gameRow}
                onPress={() => navigation.navigate('EventDetails', { eventId: e.id })}
              >
                <Text style={styles.gameTitle} numberOfLines={1}>{e.title || 'Игра'}</Text>
                <Text style={styles.gameMeta}>
                  {shortDate(e.date)} · {timeRange(e.startTime, e.endTime)}
                </Text>
                <View style={styles.gameFoot}>
                  <View style={styles.gameMetaRow}>
                    <Users size={12} color={colors.textMuted} />
                    <Text style={styles.gameSubMeta}>{e.registeredCount}/{e.courtsCount * 4}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SectionCard>

      {/* Top players */}
      <SectionCard
        icon={<Trophy size={18} color={colors.primary} />}
        title="Топ игроков"
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Rating')} style={styles.linkRow}>
            <Text style={styles.link}>Полный рейтинг</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        }
      >
        {topPlayers.length === 0 ? (
          <Text style={styles.empty}>Пока нет участников.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {topPlayers.map((p, i) => (
              <View key={p.id} style={styles.topRow}>
                <View
                  style={[
                    styles.topRank,
                    i === 0 && { backgroundColor: 'rgba(245,158,11,0.20)', borderColor: 'rgba(245,158,11,0.35)' },
                  ]}
                >
                  {i === 0 ? <Trophy size={12} color={colors.warningFg} /> :
                    <Text style={[styles.topRankText, i === 0 && { color: colors.warningFg }]}>{i + 1}</Text>}
                </View>
                <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.topRating}>{p.rating}</Text>
              </View>
            ))}
          </View>
        )}
      </SectionCard>
    </ScrollView>
  );
}

function StatCard({
  icon, value, label, sub,
}: { icon: React.ReactNode; value: number; label: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconBox}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  hero: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 14,
    lineHeight: 36,
  },
  heroSubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 10, lineHeight: 20 },
  heroButtons: { gap: 8, marginTop: 18 },

  statsGrid: { gap: 10 },
  statCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: colors.text, fontSize: 28, fontWeight: '700', lineHeight: 32 },
  statLabel: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  statSub: { color: colors.textDim, fontSize: 11, marginTop: 4 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '500' },

  empty: { color: colors.textMuted, fontSize: 13 },

  gameRow: {
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameTitle: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  gameMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  gameFoot: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  gameMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gameSubMeta: { color: colors.textMuted, fontSize: 12 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  topRank: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  topName: { color: colors.text, fontSize: 14, flex: 1 },
  topRating: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
