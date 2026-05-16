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
  Calendar, ChevronRight, Clock, Crown, Flag, Pencil, Play, Plus,
  Square, Trash2, Trophy, UserPlus, Users, X,
} from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { EventDetails, EventInviteStatusItem, Match, Round } from '../api/types';
import { colors, radii } from '../theme/colors';
import { SectionCard } from '../components/ui/SectionCard';
import { Button } from '../components/ui/Button';
import { PillBadge } from '../components/ui/PillBadge';
import PlayerAvatar from '../components/PlayerAvatar';
import ScoreInputModal from '../components/ScoreInputModal';
import InviteFriendsModal from '../components/InviteFriendsModal';

type EventRouteParams = {
  EventDetails: { eventId: string };
};

function statusBadge(status: string) {
  if (status === 'OPEN_FOR_REGISTRATION') return <PillBadge tone="primary" filled>Регистрация</PillBadge>;
  if (status === 'IN_PROGRESS') return <PillBadge tone="amber" filled>В процессе</PillBadge>;
  if (status === 'FINISHED') return <PillBadge tone="neutral" filled>Завершено</PillBadge>;
  if (status === 'REGISTRATION_CLOSED') return <PillBadge tone="amber" filled>Регистрация закрыта</PillBadge>;
  if (status === 'DRAFT') return <PillBadge tone="neutral" filled>Черновик</PillBadge>;
  if (status === 'CANCELLED') return <PillBadge tone="destructive" filled>Отменена</PillBadge>;
  return <PillBadge tone="neutral" filled>{status}</PillBadge>;
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
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
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
    if (data?.event?.title) navigation.setOptions({ title: data.event.title });
  }, [data?.event?.title, navigation]);

  const isRegistered = !!data?.registeredPlayers?.some((p) => p.id === user?.playerId);

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
  const canRegister = e.status === 'OPEN_FOR_REGISTRATION';
  const canSubmitScore = e.status === 'IN_PROGRESS';

  const activeRoundId = e.status === 'IN_PROGRESS'
    ? data.rounds.find((r) => r.matches.some((m) => m.status !== 'FINISHED'))?.id ?? null
    : null;

  return (
    <>
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
        {/* Top hero card */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{e.title}</Text>
              <Text style={styles.heroAuthor}>Автор: {data.authorName}</Text>
            </View>
            {statusBadge(e.status)}
          </View>

          <View style={styles.metaGrid}>
            <MetaItem icon={<Calendar size={14} color={colors.primary} />} text={e.date} />
            <MetaItem
              icon={<Clock size={14} color={colors.primary} />}
              text={`${e.startTime?.slice(0, 5)}–${e.endTime?.slice(0, 5)}`}
            />
            <MetaItem
              icon={<Users size={14} color={colors.primary} />}
              text={`${e.registeredCount}/${e.courtsCount * 4}`}
            />
            <MetaItem
              icon={<Trophy size={14} color={colors.primary} />}
              text={e.pairingMode === 'BALANCED' ? 'Равный бой' : 'Каждый с каждым'}
            />
          </View>
        </View>

        {/* Player actions */}
        {!data.isAuthor && canRegister && (
          <Button
            variant={isRegistered ? 'outline' : 'default'}
            size="lg"
            onPress={() => {
              if (!user?.playerId) return;
              if (isRegistered) action('Отмена', () => api.cancelRegistration(eventId));
              else action('Регистрация', () => api.registerForEvent(eventId, user.playerId));
            }}
            disabled={busy}
            fullWidth
          >
            {isRegistered ? 'Отменить регистрацию' : 'Записаться'}
          </Button>
        )}

        {/* Author actions */}
        {data.isAuthor && (
          <View style={{ gap: 8 }}>
            {(e.status === 'DRAFT' || e.status === 'OPEN_FOR_REGISTRATION' || e.status === 'REGISTRATION_CLOSED') && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  variant="outline"
                  onPress={() => navigation.navigate('EditEvent', { eventId })}
                  disabled={busy}
                  leftIcon={<Pencil size={14} color={colors.text} />}
                  style={{ flex: 1 }}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  onPress={() => setInviteOpen(true)}
                  disabled={busy}
                  leftIcon={<UserPlus size={14} color={colors.text} />}
                  style={{ flex: 1 }}
                >
                  Друзья
                </Button>
              </View>
            )}
            {e.status === 'OPEN_FOR_REGISTRATION' && (
              <Button
                onPress={() => action('Закрыть', () => api.closeRegistration(eventId))}
                disabled={busy}
                leftIcon={<Square size={14} color={colors.primaryFg} />}
                fullWidth
              >
                Закрыть регистрацию
              </Button>
            )}
            {e.status === 'REGISTRATION_CLOSED' && (
              <Button
                onPress={() => action('Старт', () => api.startEvent(eventId))}
                disabled={busy}
                leftIcon={<Play size={14} color={colors.primaryFg} />}
                fullWidth
              >
                Начать игру
              </Button>
            )}
            {e.status === 'IN_PROGRESS' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  variant="outline"
                  onPress={() => action('Раунд', () => api.addRound(eventId))}
                  disabled={busy}
                  leftIcon={<Plus size={14} color={colors.text} />}
                  style={{ flex: 1 }}
                >
                  Раунд
                </Button>
                <Button
                  variant="outline"
                  onPress={() => confirm('Финальный раунд?', 'Сильные vs сильные.',
                    () => action('Финал', () => api.addFinalRound(eventId)))}
                  disabled={busy}
                  leftIcon={<Crown size={14} color={colors.warningFg} />}
                  style={{ flex: 1 }}
                >
                  Финал
                </Button>
              </View>
            )}
            {e.status === 'IN_PROGRESS' && (
              <Button
                variant="outline"
                onPress={() => confirm('Завершить игру?', 'После этого начислится рейтинг.',
                  () => action('Финиш', () => api.finishEvent(eventId)))}
                disabled={busy}
                leftIcon={<Flag size={14} color={colors.warningFg} />}
                fullWidth
              >
                Завершить игру
              </Button>
            )}
            {e.status !== 'FINISHED' && e.status !== 'CANCELLED' && (
              <Button
                variant="outline"
                onPress={() => confirm('Удалить игру?', 'Действие необратимо.',
                  () => action('Удалить', async () => {
                    await api.deleteEvent(eventId);
                    navigation.goBack();
                  }))}
                disabled={busy}
                leftIcon={<Trash2 size={14} color={colors.danger} />}
                style={{ borderColor: 'rgba(239,68,68,0.4)' }}
                fullWidth
              >
                <Text style={{ color: colors.danger, fontWeight: '600' }}>Удалить игру</Text>
              </Button>
            )}
          </View>
        )}

        {/* Pending cancel */}
        {data.isAuthor && data.pendingCancelRequests.length > 0 && (
          <SectionCard
            icon={<X size={18} color={colors.warningFg} />}
            title="Запросы на отмену"
            subtitle={`${data.pendingCancelRequests.length} ожидают подтверждения`}
            style={{ borderColor: 'rgba(245,158,11,0.40)' }}
          >
            {data.pendingCancelRequests.map((p) => (
              <View key={p.id} style={styles.smallRow}>
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
          </SectionCard>
        )}

        {/* Registered */}
        {data.registeredPlayers.length > 0 && (
          <SectionCard
            icon={<Users size={18} color={colors.primary} />}
            title="Записаны"
            subtitle={`${data.registeredPlayers.length} ${data.registeredPlayers.length === 1 ? 'игрок' : 'игроков'}`}
          >
            <View style={{ gap: 6 }}>
              {data.registeredPlayers.map((p) => (
                <View key={p.id} style={styles.playerCard}>
                  <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size={28} />
                  <Text style={[styles.playerName, { flex: 1 }]}>{p.name}</Text>
                  <Text style={styles.playerRating}>{p.rating}</Text>
                  {data.isAuthor && p.id !== user?.playerId && e.status !== 'IN_PROGRESS' && e.status !== 'FINISHED' && (
                    <TouchableOpacity
                      onPress={() => confirm('Удалить игрока?', p.name,
                        () => action('Удалить', () => api.removePlayerFromEvent(eventId, p.id)))}
                      hitSlop={10}
                    >
                      <X size={16} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        )}

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

        {/* Rounds */}
        {data.rounds.map((r) => (
          <RoundCard
            key={r.id}
            round={r}
            isActive={r.id === activeRoundId}
            canSubmitScore={canSubmitScore}
            isAuthor={data.isAuthor}
            onScorePress={(m) => setScoreMatch(m)}
            onDeleteRound={() =>
              confirm('Удалить раунд?', `Раунд ${r.roundNumber}`,
                () => action('Удалить раунд', () => api.deleteRound(eventId, r.id)))
            }
          />
        ))}
      </ScrollView>

      <ScoreInputModal
        match={scoreMatch}
        scoringMode={e.scoringMode}
        pointsPerPlayer={e.pointsPerPlayerPerMatch}
        setsPerMatch={e.setsPerMatch || 3}
        onClose={() => setScoreMatch(null)}
        onSubmitted={async () => {
          setScoreMatch(null);
          await load();
        }}
      />

      <InviteFriendsModal
        visible={inviteOpen}
        eventId={eventId}
        excludeIds={data.registeredPlayers.map((p) => p.id)}
        onClose={() => setInviteOpen(false)}
        onChanged={load}
      />
    </>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function RoundCard({
  round, isActive, canSubmitScore, isAuthor, onScorePress, onDeleteRound,
}: {
  round: Round;
  isActive: boolean;
  canSubmitScore: boolean;
  isAuthor: boolean;
  onScorePress: (m: Match) => void;
  onDeleteRound: () => void;
}) {
  const allFinished = round.matches.every((m) => m.status === 'FINISHED');
  return (
    <SectionCard
      icon={<Trophy size={18} color={isActive ? colors.warningFg : colors.primary} />}
      title={`Раунд ${round.roundNumber}`}
      subtitle={isActive ? 'Идёт сейчас' : allFinished ? 'Сыгран' : 'Не сыгран'}
      style={isActive ? { borderColor: colors.primary, borderWidth: 2 } : undefined}
      right={
        isAuthor && !allFinished ? (
          <TouchableOpacity onPress={onDeleteRound} hitSlop={10}>
            <Trash2 size={14} color={colors.danger} />
          </TouchableOpacity>
        ) : isActive ? <PillBadge tone="primary" filled>сейчас</PillBadge> : null
      }
    >
      <View style={{ gap: 8 }}>
        {round.matches.map((m) => (
          <MatchRow key={m.id} match={m} canSubmitScore={canSubmitScore} onPress={() => onScorePress(m)} />
        ))}
      </View>
    </SectionCard>
  );
}

function MatchRow({
  match, canSubmitScore, onPress,
}: { match: Match; canSubmitScore: boolean; onPress: () => void }) {
  const finished = match.status === 'FINISHED';
  const scoreText = (() => {
    if (!match.score) return null;
    if (match.score.points) return `${match.score.points.teamAPoints} : ${match.score.points.teamBPoints}`;
    if (match.score.sets?.length) return match.score.sets.map((s) => `${s.teamAGames}:${s.teamBGames}`).join(' ');
    return null;
  })();

  return (
    <TouchableOpacity
      style={[styles.matchRow, finished && { opacity: 0.75 }]}
      disabled={!canSubmitScore}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.courtLabel}>
          {match.courtName ?? `Корт ${match.courtNumber}`}
        </Text>
        {finished
          ? <PillBadge tone="primary" filled>завершён</PillBadge>
          : canSubmitScore && <ChevronRight size={14} color={colors.textMuted} />}
      </View>

      <View style={styles.matchTeams}>
        <View style={styles.matchTeam}>
          {match.teamA.map((p, i) => (
            <View key={i} style={styles.teamPlayer}>
              <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size={22} />
              <Text style={styles.teamPlayerName} numberOfLines={1}>{p.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.scoreBox}>
          {scoreText
            ? <Text style={styles.scoreText}>{scoreText}</Text>
            : <Text style={styles.scoreEmpty}>vs</Text>}
        </View>

        <View style={[styles.matchTeam, { alignItems: 'flex-end' }]}>
          {match.teamB.map((p, i) => (
            <View key={i} style={[styles.teamPlayer, { flexDirection: 'row-reverse' }]}>
              <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size={22} />
              <Text style={styles.teamPlayerName} numberOfLines={1}>{p.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  error: { color: colors.danger, fontSize: 14 },

  hero: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  heroAuthor: { color: colors.textMuted, fontSize: 12, marginTop: 4 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(54,54,54,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  metaText: { color: colors.text, fontSize: 12 },

  smallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerName: { color: colors.text, fontSize: 14 },
  playerRating: { color: colors.primary, fontSize: 14, fontWeight: '700' },

  matchRow: {
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  courtLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  matchTeams: { flexDirection: 'row', alignItems: 'center' },
  matchTeam: { flex: 1, gap: 4 },
  teamPlayer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamPlayerName: { color: colors.text, fontSize: 12, flex: 1 },
  scoreBox: { paddingHorizontal: 8, alignItems: 'center', minWidth: 60 },
  scoreText: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  scoreEmpty: { color: colors.textDim, fontSize: 12 },
});
