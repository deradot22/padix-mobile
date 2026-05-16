import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, Clock, List, Plus, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../api/types';
import { colors, radii } from '../theme/colors';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function shortDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return `${parseInt(m[3])} ${months[d.getMonth()]}`;
}

function timeRange(start: string, end: string): string {
  return `${start?.slice(0, 5)}–${end?.slice(0, 5)}`;
}

function getStatusBadge(status: Event['status']) {
  if (status === 'OPEN_FOR_REGISTRATION') return <Badge variant="primary">Регистрация</Badge>;
  if (status === 'IN_PROGRESS') return <Badge variant="amber">В процессе</Badge>;
  if (status === 'FINISHED') return <Badge>Завершено</Badge>;
  if (status === 'REGISTRATION_CLOSED') return <Badge variant="amber">Закрыта</Badge>;
  return <Badge>{status}</Badge>;
}

type ViewMode = 'list' | 'calendar';

export default function GamesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [registeredIds, setRegisteredIds] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setError(null);
      const now = new Date();
      const from = formatDate(now);
      const to = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14));
      const data = await api.upcomingEvents(from, to);
      const upcoming = data.filter((e) => e.status !== 'FINISHED');
      setEvents(upcoming);

      // Fetch which we're registered for
      if (user?.playerId && upcoming.length > 0) {
        try {
          const details = await Promise.all(upcoming.map((e) => api.eventDetails(e.id)));
          const map: Record<string, boolean> = {};
          details.forEach((d) => {
            map[d.event.id] = d.registeredPlayers.some((p) => p.id === user.playerId);
          });
          setRegisteredIds(map);
        } catch {
          setRegisteredIds({});
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить игры');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.playerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        <PageHeader
          title="Игры"
          subtitle="Выберите игру для участия"
          right={
            <Button
              size="sm"
              onPress={() => navigation.navigate('CreateEvent')}
              leftIcon={<Plus size={16} color={colors.primaryFg} />}
            >
              Создать
            </Button>
          }
        />

        <View style={styles.toggle}>
          <ToggleBtn
            active={view === 'list'}
            label="Игры"
            icon={<List size={14} color={view === 'list' ? colors.primaryFg : colors.textMuted} />}
            onPress={() => setView('list')}
          />
          <ToggleBtn
            active={view === 'calendar'}
            label="Календарь"
            icon={<Calendar size={14} color={view === 'calendar' ? colors.primaryFg : colors.textMuted} />}
            onPress={() => setView('calendar')}
          />
        </View>

        {view === 'list' ? (
          events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error ?? 'Ближайших игр нет'}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {events.map((e) => (
                <EventListRow
                  key={e.id}
                  event={e}
                  registered={registeredIds[e.id]}
                  onPress={() => navigation.navigate('EventDetails', { eventId: e.id })}
                />
              ))}
            </View>
          )
        ) : (
          <CalendarView
            events={events}
            onEventPress={(id) => navigation.navigate('EventDetails', { eventId: id })}
          />
        )}
      </ScrollView>
    </View>
  );
}

function ToggleBtn({
  active, label, icon, onPress,
}: { active: boolean; label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.toggleBtn, active && styles.toggleBtnActive]} onPress={onPress}>
      {icon}
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EventListRow({
  event, registered, onPress,
}: { event: Event; registered?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.eventRow} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        {event.title && (
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        )}
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{shortDate(event.date)}</Text>
          <Text style={styles.metaText}>{timeRange(event.startTime, event.endTime)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {event.pairingMode === 'BALANCED' ? 'Баланс' : 'Каждый с каждым'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Users size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{event.registeredCount}/{event.courtsCount * 4}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {registered && <Badge variant="primary">Вы записаны</Badge>}
        {getStatusBadge(event.status)}
      </View>
    </TouchableOpacity>
  );
}

function CalendarView({
  events, onEventPress,
}: { events: Event[]; onEventPress: (id: string) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((e) => { (map[e.date] ??= []).push(e); });
    return map;
  }, [events]);

  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const firstDay = new Date(month.y, month.m, 1).getDay();
  const offset = (firstDay + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = new Date(month.y, month.m).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const dayKey = (d: number) =>
    `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const today = formatDate(new Date());
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <View style={styles.calendarCard}>
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => setMonth(month.m === 0 ? { y: month.y - 1, m: 11 } : { ...month, m: month.m - 1 })}
          style={styles.navArrow}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity
          onPress={() => setMonth(month.m === 11 ? { y: month.y + 1, m: 0 } : { ...month, m: month.m + 1 })}
          style={styles.navArrow}
        >
          <ChevronRight size={20} color={colors.text} />
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
          const isToday = key === today;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.cell,
                isToday && styles.cellToday,
                isSelected && styles.cellSelected,
              ]}
              onPress={() => setSelectedDate(isSelected ? null : key)}
            >
              <Text style={[
                styles.dayNum,
                isToday && { color: colors.primary, fontWeight: '700' },
                isSelected && { color: colors.primaryFg, fontWeight: '700' },
              ]}>{d}</Text>
              {has && (
                <View style={[
                  styles.dot2,
                  { backgroundColor: isSelected ? colors.primaryFg : colors.primary },
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDate && (
        <View style={styles.selectedList}>
          {selectedEvents.length === 0 ? (
            <Text style={styles.emptyText}>В этот день игр нет</Text>
          ) : (
            selectedEvents.map((e) => (
              <EventListRow key={e.id} event={e} onPress={() => onEventPress(e.id)} />
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(54,54,54,0.3)',
    borderRadius: radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  toggleTextActive: { color: colors.primaryFg, fontWeight: '600' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  eventTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { color: colors.textMuted, fontSize: 12 },
  dot: { color: colors.textMuted, fontSize: 12 },

  calendarCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  navArrow: { padding: 6, borderRadius: radii.md },
  monthLabel: { color: colors.text, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  cellToday: { backgroundColor: 'rgba(34,197,94,0.10)' },
  cellSelected: { backgroundColor: colors.primary },
  dayNum: { color: colors.text, fontSize: 13 },
  dot2: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },
  selectedList: { marginTop: 12, gap: 8 },
});
