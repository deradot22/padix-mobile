import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Calendar, ChevronLeft, ChevronRight, Gamepad2, List, Plus, Users,
} from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../api/types';
import { colors, radii } from '../theme/colors';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { SectionCard } from '../components/ui/SectionCard';
import { PillBadge } from '../components/ui/PillBadge';

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

function statusBadge(status: Event['status']) {
  if (status === 'OPEN_FOR_REGISTRATION') return <PillBadge tone="primary" filled>Регистрация</PillBadge>;
  if (status === 'IN_PROGRESS') return <PillBadge tone="amber" filled>В процессе</PillBadge>;
  if (status === 'FINISHED') return <PillBadge tone="neutral" filled>Завершено</PillBadge>;
  if (status === 'REGISTRATION_CLOSED') return <PillBadge tone="amber" filled>Закрыта</PillBadge>;
  if (status === 'DRAFT') return <PillBadge tone="neutral" filled>Черновик</PillBadge>;
  return <PillBadge tone="neutral" filled>{status}</PillBadge>;
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
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
            leftIcon={<Plus size={14} color={colors.primaryFg} />}
          >
            Создать игру
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
        <SectionCard
          icon={<Calendar size={18} color={colors.primary} />}
          title="Ближайшие игры (2 недели)"
          subtitle={`${events.length} ${events.length === 1 ? 'игра' : 'игр'}`}
        >
          {events.length === 0 ? (
            <Text style={styles.empty}>{error ?? 'Ближайших игр нет'}</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {events.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  registered={registeredIds[e.id]}
                  onPress={() => navigation.navigate('EventDetails', { eventId: e.id })}
                />
              ))}
            </View>
          )}
        </SectionCard>
      ) : (
        <CalendarView
          events={events}
          onEventPress={(id) => navigation.navigate('EventDetails', { eventId: id })}
        />
      )}
    </ScrollView>
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

function EventRow({
  event, registered, onPress,
}: { event: Event; registered?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.eventRow} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title || 'Игра'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{shortDate(event.date)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{timeRange(event.startTime, event.endTime)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {event.pairingMode === 'BALANCED' ? 'Баланс' : 'Каждый с каждым'}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Users size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{event.registeredCount}/{event.courtsCount * 4}</Text>
        </View>
      </View>
      <View style={styles.eventRight}>
        {registered && <PillBadge tone="primary" filled>Вы записаны</PillBadge>}
        {statusBadge(event.status)}
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
    <SectionCard
      icon={<Calendar size={18} color={colors.primary} />}
      title="Календарь"
      subtitle={monthName}
    >
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => setMonth(month.m === 0 ? { y: month.y - 1, m: 11 } : { ...month, m: month.m - 1 })}
          style={styles.navArrow}
        >
          <ChevronLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity
          onPress={() => setMonth(month.m === 11 ? { y: month.y + 1, m: 0 } : { ...month, m: month.m + 1 })}
          style={styles.navArrow}
        >
          <ChevronRight size={18} color={colors.text} />
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
                  styles.dot,
                  { backgroundColor: isSelected ? colors.primaryFg : colors.primary },
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDate && (
        <View style={{ marginTop: 12, gap: 8 }}>
          {selectedEvents.length === 0 ? (
            <Text style={styles.empty}>В этот день игр нет</Text>
          ) : (
            selectedEvents.map((e) => (
              <EventRow key={e.id} event={e} onPress={() => onEventPress(e.id)} />
            ))
          )}
        </View>
      )}
    </SectionCard>
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
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  toggleTextActive: { color: colors.primaryFg, fontWeight: '600' },

  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 12 },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  eventTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { color: colors.textMuted, fontSize: 11 },
  metaDot: { color: colors.textDim, fontSize: 11 },
  eventRight: { alignItems: 'flex-end', gap: 4 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navArrow: { padding: 6, borderRadius: radii.md, backgroundColor: 'rgba(54,54,54,0.3)' },
  monthLabel: { color: colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
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
  dot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },
});
