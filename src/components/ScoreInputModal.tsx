import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import type { Match } from '../api/types';
import { colors } from '../theme/colors';

export default function ScoreInputModal({
  match,
  onClose,
  onSubmitted,
}: {
  match: Match | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setA(match.score?.points?.teamAPoints ?? 0);
      setB(match.score?.points?.teamBPoints ?? 0);
      setError(null);
    }
  }, [match]);

  const handleSubmit = async () => {
    if (!match) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitScore(match.id, { teamAPoints: a, teamBPoints: b });
      onSubmitted();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка отправки счёта');
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
          <Text style={styles.title}>Ввод счёта</Text>
          <Text style={styles.court}>{match.courtName ?? `Корт ${match.courtNumber}`}</Text>

          <View style={styles.teamsRow}>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel} numberOfLines={2}>{teamA}</Text>
              <ScoreControl value={a} onChange={setA} />
            </View>
            <Text style={styles.vs}>:</Text>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel} numberOfLines={2}>{teamB}</Text>
              <ScoreControl value={b} onChange={setB} />
            </View>
          </View>

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScoreControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.scoreCtrl}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(0, value - 1))}
      >
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
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  court: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: { flex: 1, alignItems: 'center' },
  teamLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    minHeight: 36,
  },
  vs: { color: colors.textDim, fontSize: 28, marginHorizontal: 8, fontWeight: '300' },
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: colors.primary, fontSize: 22, fontWeight: '600' },
  scoreValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', marginTop: 24, gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#000', fontSize: 15, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
