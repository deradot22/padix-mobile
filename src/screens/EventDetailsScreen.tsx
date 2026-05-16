import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft, Clock, MapPin, Pencil, Play, Square, Swords,
  Trash2, Trophy, UserPlus,
} from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { EventDetails, EventInviteStatusItem } from '../api/types';
import { colors, radii } from '../theme/colors';
import { Button } from '../components/ui/Button';
import { PillBadge } from '../components/ui/PillBadge';
import { SectionCard } from '../components/ui/SectionCard';
import ParticipantsGrid from '../components/ParticipantsGrid';
import RoundsModal from '../components/RoundsModal';
import InviteFriendsModal from '../components/InviteFriendsModal';

type EventRouteParams = {
  EventDetails: { eventId: string };
};

function statusPill(status: string) {
  if (status === 'OPEN_FOR_REGISTRATION') return <PillBadge tone="primary" filled>Регистрация</PillBadge>;
  if (status === 'IN_PROGRESS') return <PillBadge tone="primary" filled>Идёт</PillBadge>;
  if (status === 'FINISHED') return <PillBadge tone="neutral" filled>Завершено</PillBadge>;
  if (status === 'REGISTRATION_CLOSED') return <PillBadge tone="amber" filled>Закрыта</PillBadge>;
  if (status === 'DRAFT') return <PillBadge tone="neutral" filled>Черновик</PillBadge>;
  if (status === 'CANCELLED') return <PillBadge tone="destructive" filled>Отменена</PillBadge>;
  return <PillBadge tone="neutral" filled>{status}</PillBadge>;
}

function shortDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return `${parseInt(m[3])} ${months[d.getMonth()]}`;
}

export default function EventDetailsScreen() {
  const route = useRoute<RouteProp<EventRouteParams, 'EventDetails'>>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { eventId } = route.params;

  const [data, setData] = useState<EventDetails | null>(null);
  const [invites, setInvites] = useState<EventInviteStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundsOpen, setRoundsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await api.eventDetails(eventId);
      setData(d);
      if (d.isAuthor) {
        try {
          const inv = await api.eventInvites(eventId);
          setInvites(inv);
        } catch {
          setInvites([]);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить игру');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const action = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e: any) {
      Alert.alert(label, e?.message ?? 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const confirm = (title: string, message: string, onYes: () => void) =>
    Alert.alert(title, message, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Да', style: 'destructive', onPress: onYes },
    ]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Игра не найдена'}</Text>
      </View>
    );
  }

  const e = data.event;
  const isRegistered = !!data.registeredPlayers.some((p) => p.id === user?.playerId);
  const canRegister = e.status === 'OPEN_FOR_REGISTRATION';
  const inProgress = e.status === 'IN_PROGRESS';
  const capacity = e.courtsCount * 4;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 40, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Back link */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}
          hitSlop={10}
        >
          <ArrowLeft size={16} color={colors.textMuted} />
          <Text style={styles.backText}>Назад к играм</Text>
        </TouchableOpacity>

        {/* Hero card */}
        <View style={[styles.hero, inProgress && styles.heroActive]}>
          <View style={styles.heroPills}>
            {statusPill(e.status)}
            {data.isAuthor && (
              <PillBadge tone="primary">Вы автор</PillBadge>
            )}
            {isRegistered && !data.isAuthor && (
              <PillBadge tone="primary" filled>Вы записаны</PillBadge>
            )}
          </View>

          <Text style={styles.heroTitle}>{e.title}</Text>
          <Text style={styles.heroDate}>{shortDate(e.date)}</Text>

          <View style={styles.metaPills}>
            <View style={styles.metaPill}>
              <Clock size={14} color={colors.primary} />
              <Text style={styles.metaText}>
                {e.startTime?.slice(0, 5)}–{e.endTime?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.metaText}>
                {e.courtsCount} {e.courtsCount === 1 ? 'корт' : e.courtsCount < 5 ? 'корта' : 'кортов'}
              </Text>
            </View>
          </View>

          {/* Big actions */}
          <View style={styles.heroActions}>
            {inProgress && (
              <Button
                fullWidth
                size="lg"
                onPress={() => setRoundsOpen(true)}
                disabled={busy}
              >
                Ввести счёт
              </Button>
            )}
            {data.isAuthor && e.status === 'OPEN_FOR_REGISTRATION' && (
              <Button
                fullWidth
                size="lg"
                onPress={() => action('Закрыть', () => api.closeRegistration(eventId))}
                disabled={busy}
                leftIcon={<Square size={14} color={colors.primaryFg} />}
              >
                Закрыть регистрацию
              </Button>
            )}
            {data.isAuthor && e.status === 'REGISTRATION_CLOSED' && (
              <Button
                fullWidth
                size="lg"
                onPress={() => action('Старт', () => api.startEvent(eventId))}
                disabled={busy}
                leftIcon={<Play size={14} color={colors.primaryFg} />}
              >
                Начать игру
              </Button>
            )}
            {!data.isAuthor && canRegister && (
              <Button
                fullWidth
                size="lg"
                variant={isRegistered ? 'outline' : 'default'}
                onPress={() => {
                  if (!user?.playerId) return;
                  if (isRegistered) action('Отмена', () => api.cancelRegistration(eventId));
                  else action('Регистрация', () => api.registerForEvent(eventId, user.playerId));
                }}
                disabled={busy}
              >
                {isRegistered ? 'Отменить регистрацию' : 'Записаться'}
              </Button>
            )}

            <Button
              fullWidth
              size="lg"
              variant="outline"
              onPress={() => setRoundsOpen(true)}
            >
              {inProgress ? 'Все раунды' : 'Таблица лидеров'}
            </Button>

            {/* Mini action icons */}
            {data.isAuthor && (
              <View style={styles.iconButtonsRow}>
                {(e.status === 'OPEN_FOR_REGISTRATION' || e.status === 'REGISTRATION_CLOSED') && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setInviteOpen(true)}
                  >
                    <UserPlus size={16} color={colors.text} />
                  </TouchableOpacity>
                )}
                {(e.status === 'DRAFT' || e.status === 'OPEN_FOR_REGISTRATION' || e.status === 'REGISTRATION_CLOSED') && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('EditEvent', { eventId })}
                  >
                    <Pencil size={16} color={colors.text} />
                  </TouchableOpacity>
                )}
                {e.status !== 'FINISHED' && e.status !== 'CANCELLED' && (
                  <TouchableOpacity
                    style={[styles.iconButton, { borderColor: 'rgba(239,68,68,0.4)' }]}
                    onPress={() => confirm('Удалить игру?', 'Действие необратимо.',
                      () => action('Удалить', async () => {
                        await api.deleteEvent(eventId);
                        navigation.goBack();
                      }))}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Compact info bar */}
        <View style={styles.infoBar}>
          <Text style={styles.infoBarText}>
            <Text style={{ color: colors.text }}>{e.courtsCount}</Text>
            <Text style={{ color: colors.textMuted }}>  ·  </Text>
            {e.pairingMode === 'BALANCED' ? 'Равный бой' : 'Каждый с каждым'}
            <Text style={{ color: colors.textMuted }}>  ·  </Text>
            <Text style={{ color: colors.text }}>{data.registeredPlayers.length}/{capacity}</Text>
          </Text>
        </View>

        {/* Pending cancel */}
        {data.isAuthor && data.pendingCancelRequests.length > 0 && (
          <SectionCard
            icon={<Trash2 size={18} color={colors.warningFg} />}
            title="Запросы на отмену"
            subtitle={`${data.pendingCancelRequests.length} ожидают подтверждения`}
            style={{ borderColor: 'rgba(245,158,11,0.40)' }}
          >
            <View style={{ gap: 6 }}>
              {data.pendingCancelRequests.map((p) => (
                <View key={p.id} style={styles.cancelRow}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => confirm('Подтвердить?', p.name,
                      () => action('Отмена', () => api.approveCancel(eventId, p.id)))}
                  >
                    Подтвердить
                  </Button>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Participants */}
        <ParticipantsGrid players={data.registeredPlayers} capacity={capacity} />

        {/* Sent invites */}
        {data.isAuthor && invites.length > 0 && (
          <SectionCard
            icon={<UserPlus size={18} color={colors.primary} />}
            title="Приглашения"
            subtitle={`${invites.length} отправлено`}
          >
            <View style={{ gap: 6 }}>
              {invites.map((inv) => (
                <View key={inv.publicId} style={styles.smallRow}>
                  <Text style={styles.playerName}>{inv.name}</Text>
                  {inv.status === 'ACCEPTED' ? <PillBadge tone="primary" filled>принято</PillBadge>
                    : inv.status === 'DECLINED' ? <PillBadge tone="destructive" filled>отклонено</PillBadge>
                    : <PillBadge tone="amber" filled>ожидает</PillBadge>}
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Rounds list (collapsed quick view) */}
        {data.rounds.length > 0 && (
          <SectionCard
            icon={<Trophy size={18} color={colors.primary} />}
            title="Раунды"
            subtitle={`${data.rounds.length} ${data.rounds.length === 1 ? 'раунд' : 'раундов'}`}
          >
            <TouchableOpacity
              style={styles.openRoundsBtn}
              onPress={() => setRoundsOpen(true)}
            >
              <Text style={styles.openRoundsText}>Открыть раунды</Text>
            </TouchableOpacity>
          </SectionCard>
        )}
      </ScrollView>

      <RoundsModal
        visible={roundsOpen}
        onClose={() => setRoundsOpen(false)}
        eventId={eventId}
        data={data}
        isAuthor={data.isAuthor}
        pointsPerPlayer={e.pointsPerPlayerPerMatch}
        onChanged={load}
      />

      <InviteFriendsModal
        visible={inviteOpen}
        eventId={eventId}
        excludeIds={data.registeredPlayers.map((p) => p.id)}
        onClose={() => setInviteOpen(false)}
        onChanged={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  error: { color: colors.danger, fontSize: 14 },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText: { color: colors.textMuted, fontSize: 14 },

  hero: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  heroActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(34,197,94,0.04)',
  },
  heroPills: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  heroTitle: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  heroDate: { color: colors.textMuted, fontSize: 14, marginTop: 4 },

  metaPills: { flexDirection: 'row', gap: 8, marginTop: 14 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  metaText: { color: colors.text, fontSize: 13, fontWeight: '600' },

  heroActions: { gap: 8, marginTop: 16 },
  iconButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoBar: {
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoBarText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },

  cancelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  smallRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  playerName: { color: colors.text, fontSize: 14 },

  openRoundsBtn: {
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
    alignItems: 'center',
  },
  openRoundsText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
