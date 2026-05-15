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
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { EventDetails, EventInviteStatusItem, Match, Round } from '../api/types';
import { colors } from '../theme/colors';
import ScoreInputModal from '../components/ScoreInputModal';
import InviteFriendsModal from '../components/InviteFriendsModal';

type EventRouteParams = {
  EventDetails: { eventId: string };
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  OPEN_FOR_REGISTRATION: 'Регистрация',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  IN_PROGRESS: 'Идёт',
  FINISHED: 'Завершена',
  CANCELLED: 'Отменена',
};

export default function EventDetailsScreen() {
  const route = useRoute<RouteProp<EventRouteParams, 'EventDetails'>>();
  const navigation = useNavigation();
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

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.headRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{statusLabels[e.status] ?? e.status}</Text>
            </View>
            <Text style={styles.author}>Автор: {data.authorName}</Text>
          </View>
          <Text style={styles.meta}>
            📅 {e.date} · {e.startTime?.slice(0, 5)}–{e.endTime?.slice(0, 5)}
          </Text>
          <Text style={styles.meta}>
            🎾 Игроков: {e.registeredCount} · Кортов: {e.courtsCount} · Раундов: {e.roundsPlanned}
          </Text>
          <Text style={styles.meta}>
            🏓 Режим пар: {e.pairingMode === 'ROUND_ROBIN' ? 'Каждый с каждым' : 'Равный бой'}
          </Text>
        </View>

        {/* Player actions */}
        {!data.isAuthor && canRegister && (
          <ActionButton
            label={isRegistered ? 'Отменить регистрацию' : 'Записаться'}
            tone={isRegistered ? 'danger' : 'primary'}
            disabled={busy}
            onPress={() => {
              if (!user?.playerId) return;
              if (isRegistered) action('Отмена', () => api.cancelRegistration(eventId));
              else action('Регистрация', () => api.registerForEvent(eventId, user.playerId));
            }}
          />
        )}

        {/* Author actions */}
        {data.isAuthor && (
          <View style={{ marginTop: 12 }}>
            {(e.status === 'DRAFT' || e.status === 'OPEN_FOR_REGISTRATION' || e.status === 'REGISTRATION_CLOSED') && (
              <ActionButton label="✎ Редактировать игру" disabled={busy}
                onPress={() => (navigation as any).navigate('EditEvent', { eventId })} />
            )}
            {(e.status === 'OPEN_FOR_REGISTRATION' || e.status === 'REGISTRATION_CLOSED') && (
              <ActionButton label="👥 Добавить друзей" disabled={busy}
                onPress={() => setInviteOpen(true)} />
            )}
            {e.status === 'OPEN_FOR_REGISTRATION' && (
              <ActionButton label="Закрыть регистрацию" disabled={busy}
                onPress={() => action('Закрыть', () => api.closeRegistration(eventId))} />
            )}
            {e.status === 'REGISTRATION_CLOSED' && (
              <ActionButton label="Начать игру" tone="primary" disabled={busy}
                onPress={() => action('Старт', () => api.startEvent(eventId))} />
            )}
            {e.status === 'IN_PROGRESS' && (
              <>
                <ActionButton label="+ Добавить раунд" disabled={busy}
                  onPress={() => action('Добавить раунд', () => api.addRound(eventId))} />
                <ActionButton label="🏆 Финальный раунд" disabled={busy}
                  onPress={() => confirm('Финальный раунд?', 'Сильные vs сильные.',
                    () => action('Финал', () => api.addFinalRound(eventId)))} />
                <ActionButton label="Завершить игру" tone="warning" disabled={busy}
                  onPress={() => confirm('Завершить игру?', 'После этого начислится рейтинг.',
                    () => action('Финиш', () => api.finishEvent(eventId)))} />
              </>
            )}
            {e.status !== 'FINISHED' && e.status !== 'CANCELLED' && (
              <ActionButton label="Удалить игру" tone="danger" disabled={busy}
                onPress={() => confirm('Удалить игру?', 'Действие необратимо.',
                  () => action('Удалить', async () => {
                    await api.deleteEvent(eventId);
                    navigation.goBack();
                  }))} />
            )}
          </View>
        )}

        {/* Pending cancel requests (author only) */}
        {data.isAuthor && data.pendingCancelRequests.length > 0 && (
          <View style={[styles.card, { marginTop: 16, borderColor: colors.warning }]}>
            <Text style={[styles.sectionTitle, { color: colors.warning }]}>
              Запросы на отмену ({data.pendingCancelRequests.length})
            </Text>
            {data.pendingCancelRequests.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <Text style={styles.playerName}>{p.name}</Text>
                <TouchableOpacity
                  onPress={() => confirm('Подтвердить отмену?', p.name,
                    () => action('Отмена', () => api.approveCancel(eventId, p.id)))}
                  style={styles.smallBtn}
                >
                  <Text style={[styles.smallBtnText, { color: colors.danger }]}>Подтвердить</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Registered players */}
        {data.registeredPlayers.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Записаны ({data.registeredPlayers.length})</Text>
            {data.registeredPlayers.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <Text style={styles.playerName}>{p.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.playerRating}>{p.rating}</Text>
                  {data.isAuthor && p.id !== user?.playerId && e.status !== 'IN_PROGRESS' && e.status !== 'FINISHED' && (
                    <TouchableOpacity
                      onPress={() => confirm('Удалить игрока?', p.name,
                        () => action('Удалить', () => api.removePlayerFromEvent(eventId, p.id)))}
                      hitSlop={10}
                    >
                      <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sent invites */}
        {data.isAuthor && invites.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Приглашения ({invites.length})</Text>
            {invites.map((inv) => {
              const color =
                inv.status === 'ACCEPTED' ? colors.success :
                inv.status === 'DECLINED' ? colors.danger : colors.warning;
              const label =
                inv.status === 'ACCEPTED' ? 'принято' :
                inv.status === 'DECLINED' ? 'отклонено' : 'ожидает';
              return (
                <View key={inv.publicId} style={styles.playerRow}>
                  <Text style={styles.playerName}>{inv.name}</Text>
                  <Text style={{ color, fontSize: 12 }}>{label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Rounds */}
        {(() => {
          // Active round = the lowest round number with any non-finished match (while IN_PROGRESS)
          const activeRoundId = e.status === 'IN_PROGRESS'
            ? data.rounds.find((r) => r.matches.some((m) => m.status !== 'FINISHED'))?.id ?? null
            : null;
          return data.rounds.map((r) => (
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
          ));
        })()}
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

function RoundCard({
  round,
  isActive,
  canSubmitScore,
  isAuthor,
  onScorePress,
  onDeleteRound,
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
    <View style={[
      styles.card,
      { marginTop: 16 },
      isActive && { borderColor: colors.primary, borderWidth: 2 },
    ]}>
      <View style={styles.headRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.sectionTitle}>Раунд {round.roundNumber}</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>● сейчас</Text>
            </View>
          )}
        </View>
        {isAuthor && !allFinished && (
          <TouchableOpacity onPress={onDeleteRound}>
            <Text style={styles.deleteRound}>удалить</Text>
          </TouchableOpacity>
        )}
      </View>
      {round.matches.map((m) => (
        <MatchRow key={m.id} match={m} canSubmitScore={canSubmitScore} onPress={() => onScorePress(m)} />
      ))}
    </View>
  );
}

function MatchRow({ match, canSubmitScore, onPress }:
  { match: Match; canSubmitScore: boolean; onPress: () => void }) {
  const finished = match.status === 'FINISHED';
  const teamA = match.teamA.map((p) => p.name).join(' / ');
  const teamB = match.teamB.map((p) => p.name).join(' / ');
  const scoreText = (() => {
    if (!match.score) return null;
    if (match.score.points) return `${match.score.points.teamAPoints} : ${match.score.points.teamBPoints}`;
    if (match.score.sets?.length) return match.score.sets.map((s) => `${s.teamAGames}:${s.teamBGames}`).join(' ');
    return null;
  })();

  return (
    <TouchableOpacity
      style={[styles.matchRow, finished && styles.matchRowDone]}
      disabled={!canSubmitScore}
      onPress={onPress}
    >
      <Text style={styles.courtLabel}>{match.courtName ?? `Корт ${match.courtNumber}`}</Text>
      <View style={styles.teamRow}>
        <Text style={styles.teamText} numberOfLines={2}>{teamA}</Text>
        <Text style={styles.vs}>vs</Text>
        <Text style={[styles.teamText, { textAlign: 'right' }]} numberOfLines={2}>{teamB}</Text>
      </View>
      {scoreText && <Text style={styles.scoreText}>{scoreText}</Text>}
      {!finished && canSubmitScore && <Text style={styles.tapHint}>Тап — ввести счёт</Text>}
    </TouchableOpacity>
  );
}

function ActionButton({
  label, onPress, tone = 'default', disabled,
}: { label: string; onPress: () => void; tone?: 'default' | 'primary' | 'danger' | 'warning'; disabled?: boolean }) {
  const styleMap = {
    default: { bg: colors.bgCard, fg: colors.text, border: colors.border },
    primary: { bg: colors.primary, fg: '#000', border: colors.primary },
    danger: { bg: colors.bgCard, fg: colors.danger, border: colors.danger },
    warning: { bg: colors.bgCard, fg: colors.warning, border: colors.warning },
  }[tone];
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: styleMap.bg, borderColor: styleMap.border }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.actionText, { color: styleMap.fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32 },
  error: { color: colors.danger, fontSize: 14 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { color: colors.textMuted, fontSize: 11 },
  author: { color: colors.textDim, fontSize: 12 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playerName: { color: colors.text, fontSize: 14 },
  playerRating: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: { fontSize: 15, fontWeight: '600' },
  matchRow: {
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchRowDone: { opacity: 0.7 },
  courtLabel: { color: colors.textDim, fontSize: 11, marginBottom: 4 },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamText: { color: colors.text, fontSize: 13, flex: 1 },
  vs: { color: colors.textDim, fontSize: 11, marginHorizontal: 8 },
  scoreText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  tapHint: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 4 },
  deleteRound: { color: colors.danger, fontSize: 12 },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnText: { fontSize: 12, fontWeight: '600' },
  activeBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
});
