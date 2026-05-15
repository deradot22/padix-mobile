import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';

function pad(n: number) { return String(n).padStart(2, '0'); }

export function DateField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const date = parseDate(value) ?? new Date();

  const handleChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (d) {
      const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      onChange(s);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{formatDate(value)}</Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          themeVariant="dark"
        />
      )}
      {Platform.OS === 'ios' && open && (
        <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
          <Text style={styles.closeText}>Готово</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function TimeField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const date = parseTime(value) ?? new Date();

  const handleChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (d) onChange(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  return (
    <View style={[styles.wrap, { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{value || '—'}</Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          is24Hour
          themeVariant="dark"
        />
      )}
      {Platform.OS === 'ios' && open && (
        <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
          <Text style={styles.closeText}>Готово</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
}

function parseTime(s: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date();
  d.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
  return d;
}

function formatDate(s: string): string {
  const d = parseDate(s);
  if (!d) return s || '—';
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  field: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: { color: colors.text, fontSize: 15 },
  closeBtn: { alignSelf: 'flex-end', padding: 8 },
  closeText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
