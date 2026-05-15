import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import type { Event } from '../api/types';
import { colors } from '../theme/colors';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  OPEN_FOR_REGISTRATION: 'Регистрация',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  IN_PROGRESS: 'Идёт',
  FINISHED: 'Завершена',
  CANCELLED: 'Отменена',
};

const statusColors: Record<string, string> = {
  OPEN_FOR_REGISTRATION: colors.success,
  IN_PROGRESS: colors.primary,
  REGISTRATION_CLOSED: colors.warning,
};

type ViewMode = 'list' | 'calendar';

export default function GamesScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('list');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.upcomingEvents();
      setEvents(data);
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить игры');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createBtnText}>+ Создать</Text>
        </TouchableOpacity>
        <View style={styles.modeSwitch}>
          <ModeBtn label="Список" active={mode === 'list'} onPress={() => setMode('list')} />
          <ModeBtn label="Календарь" active={mode === 'calendar'} onPress={() => setMode('calendar')} />
        </View>
      </View>

      {mode === 'list' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error ?? 'Игр пока нет'}</Text>
            </View>
          }
          renderItem={({ item }) => <EventCard event={item} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} />}
        />
      ) : (
        <CalendarView
          events={events}
          month={month}
          setMonth={setMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onEventPress={(id) => navigation.navigate('EventDetails', { eventId: id })}
        />
      )}
    </View>
  );
}

function ModeBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.modeBtn, active && styles.modeBtnActive]} onPress={onPress}>
      <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
        <View style={[styles.badge, { borderColor: statusColors[event.status] ?? colors.border }]}>
          <Text style={[styles.badgeText, { color: statusColors[event.status] ?? colors.textMuted }]}>
            {statusLabels[event.status] ?? event.status}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>
        📅 {event.date} · {event.startTime?.slice(0, 5)}–{event.endTime?.slice(0, 5)}
      </Text>
      <Text style={styles.meta}>
        👥 {event.registeredCount} · 🎾 {event.courtsCount} кортов · {event.roundsPlanned} раундов
      </Text>
    </TouchableOpacity>
  );
}

function CalendarView({
  events, month, setMonth, selectedDate, setSelectedDate, onEventPress,
}: {
  events: Event[];
  month: { y: number; m: number };
  setMonth: (m: { y: number; m: number }) => void;
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  onEventPress: (id: string) => void;
}) {
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const firstDay = new Date(month.y, month.m, 1).getDay();
  const offset = (firstDay + 6) % 7; // Make Monday first

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((e) => {
      (map[e.date] ??= []).push(e);
    });
    return map;
  }, [events]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = new Date(month.y, month.m).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const dayKey = (d: number) =>
    `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  const prev = () => {
    if (month.m === 0) setMonth({ y: month.y - 1, m: 11 });
    else setMonth({ y: month.y, m: month.m - 1 });
  };
  const next = () => {
    if (month.m === 11) setMonth({ y: month.y + 1, m: 0 });
    else setMonth({ y: month.y, m: month.m + 1 });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prev} style={styles.navArrow}>
          <Text style={styles.navArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity onPress={next} style={styles.navArrow}>
          <Text style={styles.navArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdays}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <Text key={d} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={styles.cell} />;
          const key = dayKey(d);
          const has = !!eventsByDate[key]?.length;
          const isSelected = key === selectedDate;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => setSelectedDate(isSelected ? null : key)}
            >
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{d}</Text>
              {has && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.calendarList}>
        {selectedDate && selectedEvents.length === 0 && (
          <Text style={styles.calendarEmpty}>В этот день игр нет</Text>
        )}
        {selectedEvents.map((e) => (
          <EventCard key={e.id} event={e} onPress={() => onEventPress(e.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', padding: 16, gap: 12 },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  createBtnText: { color: '#000', fontSize: 14, fontWeight: '600' },
  modeSwitch: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 7, borderRadius: 7, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { color: colors.textMuted, fontSize: 12 },
  modeBtnTextActive: { color: '#000', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { color: colors.textDim, fontSize: 14 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '500' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  navArrow: { padding: 6 },
  navArrowText: { color: colors.primary, fontSize: 22 },
  monthLabel: { color: colors.text, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  weekdays: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  weekday: { flex: 1, textAlign: 'center', color: colors.textDim, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellSelected: { backgroundColor: colors.primary },
  dayNum: { color: colors.text, fontSize: 14 },
  dayNumSelected: { color: '#000', fontWeight: '700' },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary,
    position: 'absolute', bottom: 6,
  },
  calendarList: { paddingHorizontal: 16, paddingTop: 16 },
  calendarEmpty: { color: colors.textDim, fontSize: 13, textAlign: 'center', padding: 16 },
});
