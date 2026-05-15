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
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type {
  EventHistoryItem,
  FriendsSnapshot,
  RatingHistoryPoint,
} from '../api/types';
import { colors } from '../theme/colors';
import RatingMiniChart from '../components/RatingMiniChart';
import AvatarPicker from '../components/AvatarPicker';

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
      Alert.alert('Заявка в друзья', e?.message ?? 'Ошибка');
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.card}>
        <AvatarPicker
          avatarUrl={user?.avatarUrl}
          name={user?.name}
          onUpdated={() => refreshUser()}
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.publicId && (
          <Text style={styles.publicId}>ID для друзей: {user.publicId}</Text>
        )}

        <View style={styles.statsRow}>
          <Stat label="Рейтинг" value={String(user?.rating ?? 0)} primary />
          <Stat label="NTRP" value={user?.ntrp ?? '—'} />
          <Stat label="Матчей" value={String(user?.gamesPlayed ?? 0)} />
        </View>

        {(user?.calibrationMatchesRemaining ?? 0) > 0 && (
          <View style={styles.calibBox}>
            <Text style={styles.calibText}>
              📈 Калибровка: ещё {user?.calibrationMatchesRemaining} матчей
            </Text>
          </View>
        )}
      </View>

      {ratingHistory.length > 1 && (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>График рейтинга</Text>
          <RatingMiniChart points={ratingHistory} />
        </View>
      )}

      <SectionHeader
        title={`История матчей (${history.length})`}
        open={openSection === 'history'}
        onPress={() => setOpenSection(openSection === 'history' ? null : 'history')}
      />
      {openSection === 'history' && (
        <View style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.empty}>Пока пусто</Text>
          ) : (
            history.slice(0, 30).map((h) => (
              <TouchableOpacity
                key={h.eventId}
                style={styles.historyRow}
                onPress={() => navigation.navigate('HistoryEvent', { eventId: h.eventId, eventTitle: h.eventTitle })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{h.eventTitle}</Text>
                  <Text style={styles.historyMeta}>
                    {h.eventDate} · {h.matchesCount} матчей
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyDelta,
                    { color: h.ratingDelta >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {h.ratingDelta >= 0 ? '+' : ''}{h.ratingDelta}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <SectionHeader
        title={`Друзья (${friends?.friends.length ?? 0})`}
        open={openSection === 'friends'}
        onPress={() => setOpenSection(openSection === 'friends' ? null : 'friends')}
      />
      {openSection === 'friends' && (
        <View style={styles.card}>
          <View style={styles.addFriendRow}>
            <TextInput
              style={styles.addFriendInput}
              placeholder="Public ID игрока"
              placeholderTextColor={colors.textDim}
              value={friendPublicId}
              onChangeText={setFriendPublicId}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addFriendBtn} onPress={sendFriendRequest}>
              <Text style={styles.addFriendBtnText}>Добавить</Text>
            </TouchableOpacity>
          </View>

          {(friends?.incoming?.length ?? 0) > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.subTitle}>Входящие заявки</Text>
              {friends!.incoming.map((r) => (
                <View key={r.publicId} style={styles.friendRow}>
                  <Text style={styles.friendName}>{r.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      onPress={async () => { await api.acceptFriend(r.publicId); load(); }}
                    >
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      onPress={async () => { await api.declineFriend(r.publicId); load(); }}
                    >
                      <Text style={[styles.miniBtnText, { color: colors.danger }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {(friends?.friends?.length ?? 0) > 0 ? (
            <View style={{ marginTop: 12 }}>
              {friends!.friends.map((f) => (
                <View key={f.userId} style={styles.friendRow}>
                  <View style={{ flex: 1 }}>
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
        </View>
      )}

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, primary && { color: colors.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title, open, onPress,
}: { title: string; open: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  email: { color: colors.textMuted, fontSize: 13, marginTop: 2, textAlign: 'center' },
  publicId: { color: colors.textDim, fontSize: 12, marginTop: 4, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  calibBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  calibText: { color: colors.warning, fontSize: 12, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 14,
    marginTop: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.textDim, fontSize: 14 },
  empty: { color: colors.textDim, fontSize: 13, textAlign: 'center', padding: 8 },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  historyMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  historyDelta: { fontSize: 15, fontWeight: '700' },
  addFriendRow: { flexDirection: 'row', gap: 8 },
  addFriendInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  addFriendBtn: {
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addFriendBtnText: { color: '#000', fontWeight: '600' },
  subTitle: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  friendName: { color: colors.text, fontSize: 14, fontWeight: '500' },
  friendMeta: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  friendRating: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  miniBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniBtnText: { fontSize: 16, fontWeight: '700' },
  logout: {
    marginTop: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
