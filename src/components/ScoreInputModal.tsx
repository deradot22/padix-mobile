import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import type { Match, ScoringMode } from '../api/types';
import { colors } from '../theme/colors';

type Props = {
  match: Match | null;
  scoringMode: ScoringMode;
  pointsPerPlayer: number;
  setsPerMatch: number;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function ScoreInputModal({
  match, scoringMode, pointsPerPlayer, setsPerMatch, onClose, onSubmitted,
}: Props) {
  const isSets = scoringMode === 'SETS';
  const expectedTotal = pointsPerPlayer * 4;

  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [sets, setSets] = useState<{ a: number; b: number }[]>([{ a: 0, b: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    setError(null);
    if (isSets) {
      const initial = match.score?.sets?.length
        ? match.score.sets.map((s) => ({ a: s.teamAGames, b: s.teamBGames }))
        : [{ a: 0, b: 0 }];
      setSets(initial);
    } else {
      setA(match.score?.points?.teamAPoints ?? 0);
      setB(match.score?.points?.teamBPoints ?? 0);
    }
  }, [match, isSets]);

  const handleSubmit = async () => {
    if (!match) return;
    setError(null);

    if (!isSets && a + b !== expectedTotal) {
      setError(`Сумма должна быть ${expectedTotal} (сейчас ${a + b})`);
      return;
    }

    setSubmitting(true);
    try {
      if (isSets) {
        await api.submitScore(match.id, {
          sets: sets.map((s) => ({ teamAGames: s.a, teamBGames: s.b })),
        });
      } else {
        await api.submitScore(match.id, { points: { teamAPoints: a, teamBPoints: b } });
      }
      onSubmitted();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  if (!match) return null;

  const teamA = match.teamA.map((p) => p.name).join(' / ');
  const teamB = match.teamB.map((p) => p.name).join(' / ');

  return (
    <Modal visible={!!match} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Ввод счёта</Text>
            <Text style={styles.court}>{match.courtName ?? `Корт ${match.courtNumber}`}</Text>

            <View style={styles.teamsHeader}>
              <Text style={styles.teamHeaderText} numberOfLines={2}>{teamA}</Text>
              <Text style={styles.vs}>:</Text>
              <Text style={[styles.teamHeaderText, { textAlign: 'right' }]} numberOfLines={2}>{teamB}</Text>
            </View>

            {isSets ? (
              <>
                {sets.map((s, i) => (
                  <View key={i} style={styles.setRow}>
                    <Text style={styles.setLabel}>Сет {i + 1}</Text>
                    <View style={styles.setControls}>
                      <ScoreControl value={s.a} onChange={(v) =>
                        setSets((prev) => prev.map((x, j) => (j === i ? { ...x, a: v } : x)))} />
                      <Text style={styles.colon}>:</Text>
                      <ScoreControl value={s.b} onChange={(v) =>
                        setSets((prev) => prev.map((x, j) => (j === i ? { ...x, b: v } : x)))} />
                      {sets.length > 1 && (
                        <TouchableOpacity
                          onPress={() => setSets((p) => p.filter((_, j) => j !== i))}
                          style={styles.removeSet}
                        >
                          <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                {sets.length < setsPerMatch && (
                  <TouchableOpacity
                    onPress={() => setSets((p) => [...p, { a: 0, b: 0 }])}
                    style={styles.addSet}
                  >
                    <Text style={styles.addSetText}>+ Добавить сет</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.pointsRow}>
                <ScoreControl value={a} onChange={setA} />
                <Text style={styles.colon}>:</Text>
                <ScoreControl value={b} onChange={setB} />
              </View>
            )}

            {!isSets && (
              <Text style={styles.hint}>Сумма очков: {a + b} / {expectedTotal}</Text>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={submitting}>
                <Text style={styles.btnGhostText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>Сохранить</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScoreControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.scoreCtrl}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 1))}>
        <Text style={styles.stepText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.scoreValue}>{value}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(value + 1)}>
        <Text style={styles.stepText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  court: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  teamsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  teamHeaderText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
  },
  vs: { color: colors.textDim, fontSize: 18 },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  setRow: { marginBottom: 12 },
  setLabel: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  setControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colon: { color: colors.textDim, fontSize: 24, fontWeight: '300' },
  removeSet: { marginLeft: 8 },
  addSet: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetText: { color: colors.primary, fontSize: 13 },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 12 },
  scoreCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: colors.primary, fontSize: 20, fontWeight: '600' },
  scoreValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', marginTop: 20, gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#000', fontSize: 15, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
