import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown, ChevronUp, Crown, Flag, Plus, Trash2, X,
} from 'lucide-react-native';
import { api } from '../api/client';
import type { EventDetails, Match, Round } from '../api/types';
import { colors, radii } from '../theme/colors';
import { Button } from './ui/Button';
import PlayerAvatar from './PlayerAvatar';

type Props = {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  data: EventDetails | null;
  isAuthor: boolean;
  pointsPerPlayer: number;
  onChanged: () => void;
};

export default function RoundsModal({
  visible, onClose, eventId, data, isAuthor, pointsPerPlayer, onChanged,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data || !visible) return;
    // Auto-expand the active (or last) round
    const active = data.rounds.find((r) => r.matches.some((m) => m.status !== 'FINISHED'));
    setExpandedId(active?.id ?? data.rounds[data.rounds.length - 1]?.id ?? null);
  }, [data, visible]);

  if (!data) return null;
  const e = data.event;
  const inProgress = e.status === 'IN_PROGRESS';

  const handle = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); onChanged(); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ width: 28 }} />
            <Text style={styles.title}>Раунды</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {data.rounds.map((round) => {
              const finished = round.matches.every((m) => m.status === 'FINISHED');
              const isExpanded = expandedId === round.id;
              const isActive = !finished && inProgress;
              return (
                <RoundCard
                  key={round.id}
                  round={round}
                  expanded={isExpanded}
                  active={isActive}
                  finished={finished}
                  isAuthor={isAuthor}
                  pointsPerPlayer={pointsPerPlayer}
                  onToggle={() => setExpandedId(isExpanded ? null : round.id)}
                  onDelete={() => handle(() => api.deleteRound(eventId, round.id))}
                  onNext={() => {
                    const nextRound = data.rounds.find((r) => r.roundNumber === round.roundNumber + 1);
                    if (nextRound) setExpandedId(nextRound.id);
                  }}
                />
              );
            })}

            {isAuthor && inProgress && (
              <View style={styles.footerActions}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handle(() => api.addRound(eventId))}
                    disabled={busy}
                    leftIcon={<Plus size={14} color={colors.text} />}
                    style={{ flex: 1 }}
                  >
                    Раунд
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handle(() => api.addFinalRound(eventId))}
                    disabled={busy}
                    leftIcon={<Crown size={14} color={colors.warningFg} />}
                    style={{ flex: 1 }}
                  >
                    Финальный раунд
                  </Button>
                </View>
                <Button
                  variant="destructive"
                  fullWidth
                  onPress={() => handle(() => api.finishEvent(eventId))}
                  disabled={busy}
                  leftIcon={<Flag size={14} color="#fff" />}
                  style={{ marginTop: 8 }}
                >
                  Завершить игру
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RoundCard({
  round, expanded, active, finished, isAuthor, pointsPerPlayer, onToggle, onDelete, onNext,
}: {
  round: Round;
  expanded: boolean;
  active: boolean;
  finished: boolean;
  isAuthor: boolean;
  pointsPerPlayer: number;
  onToggle: () => void;
  onDelete: () => void;
  onNext: () => void;
}) {
  return (
    <View style={[styles.roundCard, expanded && styles.roundCardExpanded]}>
      <TouchableOpacity style={styles.roundHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.roundTitle}>Раунд {round.roundNumber}</Text>
          <Text style={styles.roundSubtitle}>
            Матчей: {round.matches.length}{finished ? ' · Сыгран' : ''}
          </Text>
        </View>
        {expanded
          ? <ChevronUp size={18} color={colors.textMuted} />
          : <ChevronDown size={18} color={colors.textMuted} />}
        {isAuthor && !finished && (
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={{ marginLeft: 12 }}>
            <X size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 10, gap: 10 }}>
          {round.matches.map((m) => (
            <MatchCard key={m.id} match={m} pointsPerPlayer={pointsPerPlayer} />
          ))}
          {!finished && active && (
            <View style={{ alignItems: 'flex-end' }}>
              <TouchableOpacity style={styles.nextRoundBtn} onPress={onNext}>
                <Text style={styles.nextRoundText}>Следующий раунд</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function MatchCard({ match, pointsPerPlayer }: { match: Match; pointsPerPlayer: number }) {
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const expectedTotal = pointsPerPlayer * 4;

  const teamAPoints = match.score?.points?.teamAPoints ?? 0;
  const teamBPoints = match.score?.points?.teamBPoints ?? 0;
  const finished = match.status === 'FINISHED' && match.score != null;
  const teamAWon = finished && teamAPoints > teamBPoints;
  const teamBWon = finished && teamBPoints > teamAPoints;

  const submitScore = async (value: number) => {
    const a = selectedTeam === 'A' ? value : expectedTotal - value;
    const b = selectedTeam === 'A' ? expectedTotal - value : value;
    setSubmitting(true);
    try {
      await api.submitScore(match.id, { points: { teamAPoints: a, teamBPoints: b } });
      setSelectedTeam(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.matchCard}>
      <Text style={styles.courtLabel}>{match.courtName ?? `Корт ${match.courtNumber}`}</Text>

      <View style={styles.teamsRow}>
        <TeamBox
          team={match.teamA}
          score={teamAPoints}
          selected={selectedTeam === 'A'}
          won={teamAWon}
          finished={finished}
          onPress={() => setSelectedTeam(selectedTeam === 'A' ? null : 'A')}
        />
        <TeamBox
          team={match.teamB}
          score={teamBPoints}
          selected={selectedTeam === 'B'}
          won={teamBWon}
          finished={finished}
          onPress={() => setSelectedTeam(selectedTeam === 'B' ? null : 'B')}
        />
      </View>

      {selectedTeam && (
        <>
          <View style={styles.numpad}>
            {Array.from({ length: expectedTotal + 1 }).map((_, n) => (
              <TouchableOpacity
                key={n}
                style={styles.numBtn}
                onPress={() => submitScore(n)}
                disabled={submitting}
              >
                <Text style={styles.numBtnText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            Выберите значение для команды {selectedTeam === 'A' ? 'слева' : 'справа'}
          </Text>
          {submitting && <ActivityIndicator color={colors.primary} style={{ marginTop: 4 }} />}
        </>
      )}

      {!selectedTeam && !finished && (
        <Text style={styles.hint}>Нажмите на счёт команды, чтобы выбрать очки.</Text>
      )}
    </View>
  );
}

function TeamBox({
  team, score, selected, won, finished, onPress,
}: {
  team: { name: string; avatarUrl?: string | null }[];
  score: number;
  selected: boolean;
  won: boolean;
  finished: boolean;
  onPress: () => void;
}) {
  const highlighted = selected || won;
  return (
    <TouchableOpacity
      style={[
        styles.teamBox,
        highlighted && { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.06)' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={finished}
    >
      <View style={styles.teamGrid}>
        <View style={styles.teamPlayer}>
          <PlayerAvatar name={team[0]?.name ?? '?'} avatarUrl={team[0]?.avatarUrl} size={28} />
          <Text style={styles.playerName} numberOfLines={1}>{team[0]?.name ?? '?'}</Text>
        </View>
        <Text style={styles.scoreText}>{score}</Text>
        <View style={[styles.teamPlayer, { flexDirection: 'row-reverse' }]}>
          <PlayerAvatar name={team[1]?.name ?? '?'} avatarUrl={team[1]?.avatarUrl} size={28} />
          <Text style={styles.playerName} numberOfLines={1}>{team[1]?.name ?? '?'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },

  roundCard: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  roundCardExpanded: { borderColor: colors.primary },
  roundHeader: { flexDirection: 'row', alignItems: 'center' },
  roundTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  roundSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  matchCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
  },
  courtLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamsRow: { flexDirection: 'row', gap: 8 },
  teamBox: {
    flex: 1,
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  teamGrid: { alignItems: 'center', gap: 4 },
  teamPlayer: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch' },
  playerName: { color: colors.text, fontSize: 11, flex: 1 },
  scoreText: { color: colors.text, fontSize: 24, fontWeight: '700', marginVertical: 6 },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  numBtn: {
    width: 44,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(54,54,54,0.40)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 },

  nextRoundBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  nextRoundText: { color: colors.primaryFg, fontSize: 13, fontWeight: '600' },

  footerActions: { marginTop: 8 },
});
