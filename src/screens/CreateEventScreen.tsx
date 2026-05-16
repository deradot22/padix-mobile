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
import { api } from '../api/client';
import type { PairingMode } from '../api/types';
import { colors, radii } from '../theme/colors';
import { DateField, TimeField } from '../components/DateTimeField';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CreateEventScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [courtsCount, setCourtsCount] = useState('2');
  const [courtNames, setCourtNames] = useState<string[]>(['', '']);
  const [pairingMode, setPairingMode] = useState<PairingMode>('ROUND_ROBIN');
  const [roundsPlanned, setRoundsPlanned] = useState('6');
  const [pointsPerMatch, setPointsPerMatch] = useState('21');
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
        pointsPerPlayerPerMatch: parseInt(pointsPerMatch, 10) || 21,
      });
      navigation.replace('EventDetails', { eventId: event.id });
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader title="Новая игра" subtitle="Создайте игру за минуту" />

        <Card style={{ padding: 16, gap: 4 }}>
          <Text style={styles.section}>Основное</Text>
          <Input label="Название" value={title} onChangeText={setTitle} placeholder="Вечерняя игра" />
          <DateField label="Дата" value={date} onChange={setDate} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TimeField label="Старт" value={startTime} onChange={setStartTime} />
            <TimeField label="Конец" value={endTime} onChange={setEndTime} />
          </View>
        </Card>

        <Card style={{ padding: 16, marginTop: 12, gap: 4 }}>
          <Text style={styles.section}>Корты и раунды</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Кортов"
                value={courtsCount}
                keyboardType="number-pad"
                onChangeText={(v) => {
                  setCourtsCount(v);
                  const cc = parseInt(v, 10) || 0;
                  setCourtNames((prev) => {
                    const next = [...prev];
                    while (next.length < cc) next.push('');
                    return next.slice(0, cc);
                  });
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Раундов"
                value={roundsPlanned}
                keyboardType="number-pad"
                onChangeText={setRoundsPlanned}
              />
            </View>
          </View>

          {Array.from({ length: parseInt(courtsCount, 10) || 0 }).map((_, i) => (
            <Input
              key={i}
              placeholder={`Имя корта ${i + 1} (необязательно)`}
              value={courtNames[i] ?? ''}
              onChangeText={(v) => setCourtNames((p) => p.map((x, j) => (j === i ? v : x)))}
            />
          ))}
        </Card>

        <Card style={{ padding: 16, marginTop: 12, gap: 4 }}>
          <Text style={styles.section}>Очки и режим</Text>
          <Input
            label="Очков на игрока в матче"
            value={pointsPerMatch}
            keyboardType="number-pad"
            onChangeText={setPointsPerMatch}
            hint="Сумма очков обеих команд = очков × 4"
          />

          <Text style={styles.label}>Режим распределения пар</Text>
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
        </Card>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button size="lg" fullWidth onPress={handleSubmit} loading={submitting} style={{ marginTop: 16 }}>
          Создать игру
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SegBtn({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.segBtn, active && styles.segBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 4 },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(54,54,54,0.3)',
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 13 },
  segTextActive: { color: colors.primaryFg, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
