import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Calendar, Clock, MapPin, Sparkles, Users, Zap,
} from 'lucide-react-native';
import { api } from '../api/client';
import type { PairingMode } from '../api/types';
import { colors, radii } from '../theme/colors';
import { DateField, TimeField } from '../components/DateTimeField';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PillBadge } from '../components/ui/PillBadge';

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CreateEventScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('Американка');
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [courtsCount, setCourtsCount] = useState('2');
  const [courtNames, setCourtNames] = useState<string[]>(['Корт A', 'Корт B']);
  const [pairingMode, setPairingMode] = useState<PairingMode>('ROUND_ROBIN');
  const [roundsPlanned, setRoundsPlanned] = useState('6');
  const [pointsPerMatch, setPointsPerMatch] = useState('6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) { setError('Введите название'); return; }
    setSubmitting(true);
    try {
      const cc = parseInt(courtsCount, 10) || 1;
      const names = courtNames.slice(0, cc).map((n) => n.trim()).filter(Boolean);
      const event = await api.createEvent({
        title: title.trim(),
        date,
        startTime,
        endTime,
        format: 'AMERICANA',
        pairingMode,
        courtsCount: cc,
        courtNames: names.length === cc ? names : undefined,
        autoRounds: false,
        roundsPlanned: parseInt(roundsPlanned, 10) || 1,
        scoringMode: 'POINTS',
        pointsPerPlayerPerMatch: parseInt(pointsPerMatch, 10) || 6,
      });
      navigation.replace('EventDetails', { eventId: event.id });
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const minPlayers = (parseInt(courtsCount, 10) || 1) * 4;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <PillBadge icon={<Sparkles size={12} color={colors.primary} />} tone="primary" filled>
            Создание новой игры
          </PillBadge>
        </View>

        <Text style={styles.title}>Организуйте игру в падел</Text>
        <Text style={styles.subtitle}>
          Выберите время, место и параметры игры. Система автоматически подберёт оптимальные раунды и режим.
        </Text>

        {/* Progress dots */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        {/* Step 1 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Основная информация</Text>
        </View>

        <Input label="Название игры" value={title} onChangeText={setTitle} placeholder="Американка" />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <DateField label="Дата проведения" value={date} onChange={setDate} />
          </View>
        </View>

        {/* Time card - green outlined sub-card */}
        <View style={styles.subCard}>
          <View style={styles.subCardHeader}>
            <Clock size={14} color={colors.primary} />
            <Text style={styles.subCardTitle}>Время проведения</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.timeLabel}>Начало</Text>
              <TimeField label="" value={startTime} onChange={setStartTime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.timeLabel}>Окончание</Text>
              <TimeField label="" value={endTime} onChange={setEndTime} />
            </View>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepTitle}>Корты и подачи</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <MapPin size={12} color={colors.primary} />
              <Text style={styles.fieldLabel}>Количество кортов</Text>
            </View>
            <Input
              value={courtsCount}
              keyboardType="number-pad"
              onChangeText={(v) => {
                setCourtsCount(v);
                const cc = parseInt(v, 10) || 0;
                setCourtNames((prev) => {
                  const next = [...prev];
                  while (next.length < cc) next.push(`Корт ${String.fromCharCode(65 + next.length)}`);
                  return next.slice(0, cc);
                });
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Zap size={12} color={colors.primary} />
              <Text style={styles.fieldLabel}>Подач на игрока</Text>
            </View>
            <Input value={pointsPerMatch} keyboardType="number-pad" onChangeText={setPointsPerMatch} />
          </View>
        </View>

        <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Названия кортов</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: parseInt(courtsCount, 10) || 0 }).map((_, i) => (
            <View key={i} style={{ flexGrow: 1, flexBasis: '45%' }}>
              <Input
                placeholder={`Корт ${String.fromCharCode(65 + i)}`}
                value={courtNames[i] ?? ''}
                onChangeText={(v) => setCourtNames((p) => p.map((x, j) => (j === i ? v : x)))}
              />
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Users size={14} color={colors.warningFg} />
          <Text style={styles.infoText}>
            <Text style={{ fontWeight: '700' }}>Минимум {minPlayers} игроков</Text> требуется для старта игры
          </Text>
        </View>

        {/* Step 3 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepTitle}>Режим и раунды</Text>
        </View>

        <Text style={styles.fieldLabel}>Режим распределения пар</Text>
        <View style={styles.segment}>
          <SegBtn
            active={pairingMode === 'ROUND_ROBIN'}
            label="Каждый с каждым"
            onPress={() => setPairingMode('ROUND_ROBIN')}
          />
          <SegBtn
            active={pairingMode === 'BALANCED'}
            label="Равный бой"
            onPress={() => setPairingMode('BALANCED')}
          />
        </View>

        <Input
          label="Количество раундов"
          value={roundsPlanned}
          keyboardType="number-pad"
          onChangeText={setRoundsPlanned}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button size="lg" fullWidth onPress={handleSubmit} loading={submitting} style={{ marginTop: 8 }}>
          Создать игру
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SegBtn({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.segBtn, active && styles.segBtnActive]} onPress={onPress}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 22,
    paddingHorizontal: 40,
  },
  progressDot: {
    flex: 1,
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
  },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 12 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: colors.primaryFg, fontSize: 12, fontWeight: '700' },
  stepTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },

  subCard: {
    borderColor: 'rgba(34,197,94,0.30)',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    backgroundColor: 'rgba(34,197,94,0.04)',
    marginBottom: 14,
  },
  subCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subCardTitle: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  timeLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { color: colors.textMuted, fontSize: 13 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: radii.md,
    marginTop: 4,
    marginBottom: 4,
  },
  infoText: { color: colors.warningFg, fontSize: 12 },

  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    marginBottom: 14,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 12 },
  segTextActive: { color: colors.primaryFg, fontWeight: '600' },

  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
