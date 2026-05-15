import { useEffect, useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../api/client';
import type { PairingMode } from '../api/types';
import { colors } from '../theme/colors';
import { DateField, TimeField } from '../components/DateTimeField';

type EditEventRouteParams = {
  EditEvent: { eventId: string };
};

export default function EditEventScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditEventRouteParams, 'EditEvent'>>();
  const { eventId } = route.params;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [courtsCount, setCourtsCount] = useState('');
  const [pointsPerMatch, setPointsPerMatch] = useState('');
  const [pairingMode, setPairingMode] = useState<PairingMode>('ROUND_ROBIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.eventDetails(eventId);
        const e = d.event;
        setTitle(e.title);
        setDate(e.date);
        setStartTime(e.startTime?.slice(0, 5) ?? '');
        setEndTime(e.endTime?.slice(0, 5) ?? '');
        setCourtsCount(String(e.courtsCount));
        setPointsPerMatch(String(e.pointsPerPlayerPerMatch));
        setPairingMode(e.pairingMode);
      } catch (e: any) {
        setError(e?.message ?? 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const handleSave = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.updateEvent(eventId, {
        title: title.trim(),
        date,
        startTime,
        endTime,
        courtsCount: parseInt(courtsCount, 10) || 1,
        pointsPerPlayerPerMatch: parseInt(pointsPerMatch, 10) || 21,
        pairingMode,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Название" value={title} onChangeText={setTitle} />
      <DateField label="Дата" value={date} onChange={setDate} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TimeField label="Старт" value={startTime} onChange={setStartTime} />
        <TimeField label="Конец" value={endTime} onChange={setEndTime} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Кортов" value={courtsCount} onChangeText={setCourtsCount} keyboardType="number-pad" half />
        <Field label="Очков" value={pointsPerMatch} onChangeText={setPointsPerMatch} keyboardType="number-pad" half />
      </View>

      <Text style={styles.label}>Режим пар</Text>
      <View style={styles.segment}>
        <Seg active={pairingMode === 'ROUND_ROBIN'} label="Каждый с каждым" onPress={() => setPairingMode('ROUND_ROBIN')} />
        <Seg active={pairingMode === 'BALANCED'} label="Равный бой" onPress={() => setPairingMode('BALANCED')} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submit, submitting && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Сохранить</Text>}
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
      />
    </View>
  );
}

function Seg({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.segBtn, active && styles.segBtnActive]} onPress={onPress}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
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
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 7, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 13 },
  segTextActive: { color: '#000', fontWeight: '600' },
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
