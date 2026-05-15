import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import type { PairingMode } from '../api/types';
import { colors } from '../theme/colors';
import { DateField, TimeField } from '../components/DateTimeField';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Название" value={title} onChangeText={setTitle} placeholder="Вечерняя игра" />
      <DateField label="Дата" value={date} onChange={setDate} />
      <Row>
        <TimeField label="Старт" value={startTime} onChange={setStartTime} />
        <TimeField label="Конец" value={endTime} onChange={setEndTime} />
      </Row>
      <Row>
        <Field
          label="Кортов"
          value={courtsCount}
          onChangeText={(v) => {
            setCourtsCount(v);
            const cc = parseInt(v, 10) || 0;
            setCourtNames((prev) => {
              const next = [...prev];
              while (next.length < cc) next.push('');
              return next.slice(0, cc);
            });
          }}
          keyboardType="number-pad"
          half
        />
        <Field label="Раундов" value={roundsPlanned} onChangeText={setRoundsPlanned} keyboardType="number-pad" half />
      </Row>

      <Text style={styles.label}>Имена кортов (необязательно)</Text>
      {Array.from({ length: parseInt(courtsCount, 10) || 0 }).map((_, i) => (
        <View key={i} style={[styles.fieldWrap, { marginBottom: 8 }]}>
          <TextInput
            style={styles.input}
            placeholder={`Корт ${i + 1}`}
            placeholderTextColor={colors.textDim}
            value={courtNames[i] ?? ''}
            onChangeText={(v) => setCourtNames((p) => p.map((x, j) => (j === i ? v : x)))}
          />
        </View>
      ))}
      <Field
        label="Очков на игрока в матче"
        value={pointsPerMatch}
        onChangeText={setPointsPerMatch}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Режим распределения</Text>
      <View style={styles.segment}>
        <SegmentBtn
          active={pairingMode === 'ROUND_ROBIN'}
          label="Каждый с каждым"
          onPress={() => setPairingMode('ROUND_ROBIN')}
        />
        <SegmentBtn
          active={pairingMode === 'BALANCED'}
          label="Равный бой"
          onPress={() => setPairingMode('BALANCED')}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submit, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Создать игру</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label, half, ...props
}: { label: string; half?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[styles.fieldWrap, half && { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
      />
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function SegmentBtn({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  fieldWrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: colors.text,
    fontSize: 15,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 7, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 13 },
  segmentTextActive: { color: '#000', fontWeight: '600' },
  submit: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: '#000', fontSize: 16, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
});
