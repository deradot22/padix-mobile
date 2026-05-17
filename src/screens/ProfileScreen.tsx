import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar, ChevronDown, ChevronRight, Clock, Gamepad2, Mail, Pencil,
  TrendingUp, Trophy, UserPlus, Users, LogOut,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type {
  EventHistoryItem,
  FriendsSnapshot,
  RatingHistoryPoint,
} from '../api/types';
import { colors, radii } from '../theme/colors';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionCard } from '../components/ui/SectionCard';
import { PillBadge } from '../components/ui/PillBadge';
import RatingMiniChart from '../components/RatingMiniChart';
import PlayerAvatar from '../components/PlayerAvatar';

const CALIBRATION_TARGET = 30;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryPoint[]>([]);
  const [friends, setFriends] = useState<FriendsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openSection, setOpenSection] = useState<'history' | 'friends' | null>(null);
  const [friendPublicId, setFriendPublicId] = useState('');
  const [busyAvatar, setBusyAvatar] = useState(false);

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

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      setBusyAvatar(true);
      await api.updateAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      await refreshUser();
    } catch (e: any) {
      Alert.alert('Аватар', e?.message ?? 'Ошибка');
    } finally {
      setBusyAvatar(false);
    }
  };

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

  const calibProgress = user
    ? Math.min(1, ((CALIBRATION_TARGET - (user.calibrationMatchesRemaining ?? 0)) / CALIBRATION_TARGET))
    : 0;
  const isCalibrating = (user?.calibrationMatchesRemaining ?? 0) > 0;
  const matchesPlayed = CALIBRATION_TARGET - (user?.calibrationMatchesRemaining ?? CALIBRATION_TARGET);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader title="Профиль" />

      {/* Profile card with cover banner */}
      <View style={styles.profileCard}>
        <View style={styles.cover}>
          <View style={styles.coverGradient} />
        </View>

        <View style={styles.profileBody}>
          <View style={styles.identityRow}>
            <TouchableOpacity
              onPress={pickAvatar}
              style={styles.avatarWrap}
              disabled={busyAvatar}
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(user?.name?.trim()?.[0] ?? '?').toUpperCase()}
                </Text>
              )}
              {busyAvatar && (
                <View style={styles.avatarBusy}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 14, paddingTop: 28 }}>
              <Text style={styles.name}>{user?.name}</Text>
              <View style={styles.emailRow}>
                <Mail size={12} color={colors.textMuted} />
                <Text style={styles.email}>{user?.email}</Text>
              </View>
            </View>
          </View>

          <Button
            variant="outline"
            fullWidth
            onPress={() => navigation.navigate('EditProfile')}
            leftIcon={<Pencil size={14} color={colors.text} />}
            style={{ marginTop: 14 }}
          >
            Редактировать профиль
          </Button>

          <View style={styles.pillsRow}>
            {isCalibrating ? (
              <PillBadge icon={<Trophy size={12} color={colors.primary} />} tone="primary">
                на калибровке
              </PillBadge>
            ) : (
              <PillBadge icon={<Trophy size={12} color={colors.warningFg} />} tone="amber" filled>
                {user?.rating}
              </PillBadge>
            )}
            <PillBadge icon={<Gamepad2 size={12} color={colors.primary} />} tone="primary">
              {user?.gamesPlayed ?? 0} матчей
            </PillBadge>
          </View>

          <View style={[styles.pillsRow, { marginTop: 8 }]}>
            {user?.gender && (
              <View style={styles.smallPill}>
                <Text style={styles.smallPillText}>{user.gender}</Text>
              </View>
            )}
            {user?.publicId && (
              <View style={styles.idPill}>
                <Text style={styles.idLabel}>ID</Text>
                <Text style={styles.idValue}>#{user.publicId}</Text>
              </View>
            )}
          </View>

          {isCalibrating && (
            <View style={styles.calibBox}>
              <View style={styles.calibHeader}>
                <Clock size={14} color={colors.warningFg} />
                <Text style={styles.calibText}>
                  Калибровка: <Text style={{ fontWeight: '700' }}>{matchesPlayed}/{CALIBRATION_TARGET}</Text> матчей сыграно
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${calibProgress * 100}%` }]} />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Rating chart */}
      {ratingHistory.length > 1 && (
        <SectionCard
          icon={<TrendingUp size={18} color={colors.primary} />}
          title="График рейтинга"
          subtitle="Изменение рейтинга по времени"
          style={{ marginTop: 14 }}
        >
          <RatingMiniChart points={ratingHistory} />
        </SectionCard>
      )}

      {/* Invitations / Friends (parallel sections like web) */}
      <SectionCard
        icon={<Gamepad2 size={18} color={colors.primary} />}
        title="Приглашения в игры"
        subtitle="0 новых приглашений"
        style={{ marginTop: 14 }}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Invites')}>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        }
      >
        <Text style={styles.empty}>Откройте вкладку «Приглашения» чтобы увидеть.</Text>
      </SectionCard>

      <SectionCard
        icon={<Users size={18} color={colors.primary} />}
        title="Друзья"
        subtitle="Добавьте друзей по их ID"
        style={{ marginTop: 14 }}
        right={
          <TouchableOpacity
            onPress={() => setOpenSection(openSection === 'friends' ? null : 'friends')}
          >
            <ChevronDown
              size={18}
              color={colors.textMuted}
              style={{ transform: [{ rotate: openSection === 'friends' ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        }
      >
        <View style={styles.addFriendRow}>
          <TextInput
            style={styles.addFriendInput}
            placeholder="#123456789"
            placeholderTextColor={colors.textDim}
            value={friendPublicId}
            onChangeText={setFriendPublicId}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={sendFriendRequest} style={styles.addFriendBtn}>
            <UserPlus size={16} color={colors.primaryFg} />
          </TouchableOpacity>
        </View>

        {openSection === 'friends' ? (
          <>
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
                    <TouchableOpacity onPress={async () => { await api.declineFriend(r.publicId); load(); }} style={{ marginLeft: 6, padding: 8 }}>
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
                    style={[styles.friendRow, i !== friends!.friends.length - 1 && styles.rowSep]}
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
              <Text style={[styles.empty, { marginTop: 12 }]}>Пока нет друзей.</Text>
            )}
          </>
        ) : (
          <Text style={[styles.empty, { marginTop: 10 }]}>
            {(friends?.friends?.length ?? 0) > 0
              ? `${friends!.friends.length} друзей`
              : 'Пока нет друзей.'}
          </Text>
        )}
      </SectionCard>

      {/* History */}
      <SectionCard
        icon={<Calendar size={18} color={colors.primary} />}
        title="История матчей"
        subtitle="История ваших игр и изменение рейтинга"
        style={{ marginTop: 14 }}
        right={
          <TouchableOpacity
            onPress={() => setOpenSection(openSection === 'history' ? null : 'history')}
          >
            <ChevronDown
              size={18}
              color={colors.textMuted}
              style={{ transform: [{ rotate: openSection === 'history' ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        }
      >
        {history.length === 0 ? (
          <Text style={styles.empty}>Пока пусто</Text>
        ) : openSection === 'history' ? (
          <View style={{ gap: 8 }}>
            {history.slice(0, 30).map((h) => (
              <TouchableOpacity
                key={h.eventId}
                style={styles.historyRow}
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
                  <Text style={[styles.deltaText, { color: h.ratingDelta >= 0 ? colors.success : colors.danger }]}>
                    {h.ratingDelta >= 0 ? '+' : ''}{h.ratingDelta}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>{history.length} игр в истории</Text>
        )}
      </SectionCard>

      <Button
        variant="outline"
        fullWidth
        onPress={logout}
        leftIcon={<LogOut size={14} color={colors.danger} />}
        style={{ borderColor: 'rgba(239,68,68,0.4)', marginTop: 14 }}
      >
        <Text style={{ color: colors.danger, fontWeight: '600' }}>Выйти</Text>
      </Button>
    </ScrollView>
  );
}

const COVER_HEIGHT = 90;
const AVATAR_SIZE = 80;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  // Profile card
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cover: {
    height: COVER_HEIGHT,
    backgroundColor: 'rgba(34,197,94,0.15)',
    position: 'relative',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  profileBody: { padding: 16, paddingTop: 0 },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.bgCard,
    marginTop: -AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { color: colors.primary, fontSize: 32, fontWeight: '700' },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  email: { color: colors.textMuted, fontSize: 13 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  smallPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 36,
  },
  smallPillText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  idValue: { color: colors.text, fontSize: 12, fontWeight: '700' },

  calibBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: radii.lg,
  },
  calibHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calibText: { color: colors.warningFg, fontSize: 13 },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(245,158,11,0.20)',
    borderRadius: radii.full,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.warning, borderRadius: radii.full },

  // Sections
  empty: { color: colors.textMuted, fontSize: 13 },
  subTitle: { color: colors.textMuted, fontSize: 12, marginBottom: 6, fontWeight: '500' },
  rowSep: { borderBottomWidth: 1, borderBottomColor: colors.border },

  // Add friend
  addFriendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addFriendInput: {
    flex: 1,
    backgroundColor: 'rgba(54,54,54,0.4)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  addFriendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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

  // Friends
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  friendName: { color: colors.text, fontSize: 14, fontWeight: '500' },
  friendMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  friendRating: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
