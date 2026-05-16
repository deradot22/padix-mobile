import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ChevronDown, ChevronRight, History, Settings, TrendingUp, Users, LogOut, UserPlus,
} from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type {
  EventHistoryItem,
  FriendsSnapshot,
  RatingHistoryPoint,
} from '../api/types';
import { colors, radii } from '../theme/colors';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import RatingMiniChart from '../components/RatingMiniChart';
import AvatarPicker from '../components/AvatarPicker';
import PlayerAvatar from '../components/PlayerAvatar';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, refreshUser } = useAuth();
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryPoint[]>([]);
  const [friends, setFriends] = useState<FriendsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openSection, setOpenSection] = useState<'history' | 'friends' | null>(null);
  const [friendPublicId, setFriendPublicId] = useState('');

  const load = useCallback(async () => {
    try {
      const [h, rh, fr] = await Promise.allSettled([
        api.myHistory(),
        api.ratingHistory(),
        api.friends(),
      ]);
      if (h.status === 'fulfilled') setHistory(h.value);
      if (rh.status === 'fulfilled') setRatingHistory(rh.value);
      if (fr.status === 'fulfilled') setFriends(fr.value);
      await refreshUser();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshUser]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendFriendRequest = async () => {
    if (!friendPublicId.trim()) return;
    try {
      await api.requestFriend(friendPublicId.trim());
      setFriendPublicId('');
      await load();
    } catch (e: any) {
      Alert.alert('Заявка', e?.message ?? 'Ошибка');
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader title="Профиль" />

      {/* Identity card */}
      <Card style={{ padding: 20, alignItems: 'center', marginBottom: 16 }}>
        <AvatarPicker
          avatarUrl={user?.avatarUrl}
          name={user?.name}
          onUpdated={() => refreshUser()}
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.publicId && (
          <View style={styles.publicIdRow}>
            <Text style={styles.publicIdLabel}>ID:</Text>
            <Text style={styles.publicIdValue}>{user.publicId}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <Stat label="Рейтинг" value={String(user?.rating ?? 0)} accent />
          <Stat label="NTRP" value={user?.ntrp ?? '—'} />
          <Stat label="Матчей" value={String(user?.gamesPlayed ?? 0)} />
        </View>

        {(user?.calibrationMatchesRemaining ?? 0) > 0 && (
          <View style={styles.calibBox}>
            <TrendingUp size={14} color={colors.warningFg} />
            <Text style={styles.calibText}>
              Калибровка: ещё {user?.calibrationMatchesRemaining} матчей
            </Text>
          </View>
        )}

        <Button
          variant="outline"
          size="sm"
          onPress={() => navigation.navigate('EditProfile')}
          style={{ marginTop: 14 }}
          leftIcon={<Settings size={14} color={colors.text} />}
        >
          Изменить
        </Button>
      </Card>

      {/* Rating chart */}
      {ratingHistory.length > 1 && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>График рейтинга</Text>
          <View style={{ marginTop: 12 }}>
            <RatingMiniChart points={ratingHistory} />
          </View>
        </Card>
      )}

      {/* History section */}
      <SectionToggle
        icon={<History size={16} color={colors.text} />}
        title="История матчей"
        count={history.length}
        open={openSection === 'history'}
        onPress={() => setOpenSection(openSection === 'history' ? null : 'history')}
      />
      {openSection === 'history' && (
        <Card style={{ padding: 4, marginBottom: 16 }}>
          {history.length === 0 ? (
            <Text style={styles.empty}>Пока пусто</Text>
          ) : (
            history.slice(0, 30).map((h, i) => (
              <TouchableOpacity
                key={h.eventId}
                style={[styles.historyRow, i !== Math.min(history.length, 30) - 1 && styles.rowSep]}
                onPress={() => navigation.navigate('HistoryEvent', { eventId: h.eventId, eventTitle: h.eventTitle })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{h.eventTitle}</Text>
                  <Text style={styles.historyMeta}>{h.eventDate} · {h.matchesCount} матчей</Text>
                </View>
                <View
                  style={[
                    styles.deltaPill,
                    {
                      backgroundColor: h.ratingDelta >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      borderColor: h.ratingDelta >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.deltaText,
                      { color: h.ratingDelta >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {h.ratingDelta >= 0 ? '+' : ''}{h.ratingDelta}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.textDim} />
              </TouchableOpacity>
            ))
          )}
        </Card>
      )}

      {/* Friends section */}
      <SectionToggle
        icon={<Users size={16} color={colors.text} />}
        title="Друзья"
        count={friends?.friends.length ?? 0}
        open={openSection === 'friends'}
        onPress={() => setOpenSection(openSection === 'friends' ? null : 'friends')}
      />
      {openSection === 'friends' && (
        <Card style={{ padding: 12, marginBottom: 16 }}>
          <View style={styles.addFriendRow}>
            <TextInput
              style={styles.addFriendInput}
              placeholder="Public ID игрока"
              placeholderTextColor={colors.textDim}
              value={friendPublicId}
              onChangeText={setFriendPublicId}
              autoCapitalize="none"
            />
            <Button size="sm" onPress={sendFriendRequest} leftIcon={<UserPlus size={14} color={colors.primaryFg} />}>
              Заявка
            </Button>
          </View>

          {(friends?.incoming?.length ?? 0) > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subTitle}>Входящие заявки</Text>
              {friends!.incoming.map((r) => (
                <View key={r.publicId} style={styles.friendRow}>
                  <PlayerAvatar name={r.name} avatarUrl={r.avatarUrl} size={32} />
                  <Text style={[styles.friendName, { flex: 1, marginLeft: 10 }]}>{r.name}</Text>
                  <Button size="sm" variant="outline" onPress={async () => { await api.acceptFriend(r.publicId); load(); }}>
                    Принять
                  </Button>
                  <TouchableOpacity onPress={async () => { await api.declineFriend(r.publicId); load(); }} style={{ marginLeft: 8, padding: 8 }}>
                    <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {(friends?.friends?.length ?? 0) > 0 ? (
            <View style={{ marginTop: 12 }}>
              {friends!.friends.map((f, i) => (
                <View
                  key={f.userId}
                  style={[
                    styles.friendRow,
                    i !== friends!.friends.length - 1 && styles.rowSep,
                  ]}
                >
                  <PlayerAvatar name={f.name} avatarUrl={f.avatarUrl} size={32} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.friendName}>{f.name}</Text>
                    <Text style={styles.friendMeta}>
                      {f.gamesPlayed} матчей{f.ntrp ? ` · NTRP ${f.ntrp}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.friendRating}>{f.rating}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.empty, { marginTop: 12 }]}>Пока нет друзей</Text>
          )}
        </Card>
      )}

      <Button
        variant="outline"
        fullWidth
        onPress={logout}
        leftIcon={<LogOut size={14} color={colors.danger} />}
        style={{ borderColor: colors.destructiveTintBorder, marginTop: 8 }}
      >
        <Text style={{ color: colors.danger, fontWeight: '600' }}>Выйти</Text>
      </Button>
    </ScrollView>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent && { color: colors.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionToggle({
  icon, title, count, open, onPress,
}: { icon: React.ReactNode; title: string; count: number; open: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionToggle} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text style={styles.sectionToggleText}>{title}</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      </View>
      <ChevronDown
        size={16}
        color={colors.textMuted}
        style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  name: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  email: { color: colors.textMuted, fontSize: 13, marginTop: 2, textAlign: 'center' },

  publicIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  publicIdLabel: { color: colors.textMuted, fontSize: 11 },
  publicIdValue: { color: colors.text, fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(54,54,54,0.4)',
    borderRadius: radii.md,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  calibBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.amberTint,
    borderColor: colors.amberTintBorder,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  calibText: { color: colors.warningFg, fontSize: 12 },

  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },

  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionToggleText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sectionCount: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  sectionCountText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },

  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 16 },
  rowSep: { borderBottomWidth: 1, borderBottomColor: colors.border },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  historyTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  historyMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  deltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  deltaText: { fontSize: 13, fontWeight: '700' },

  addFriendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addFriendInput: {
    flex: 1,
    backgroundColor: 'rgba(54,54,54,0.3)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  subTitle: { color: colors.textMuted, fontSize: 12, marginBottom: 6, fontWeight: '500' },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  friendName: { color: colors.text, fontSize: 14, fontWeight: '500' },
  friendMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  friendRating: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
