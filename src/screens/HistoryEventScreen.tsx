import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../api/client';
import type { EventHistoryMatch } from '../api/types';
import { colors } from '../theme/colors';

type HistoryEventRouteParams = {
  HistoryEvent: { eventId: string; eventTitle?: string };
};

export default function HistoryEventScreen() {
  const route = useRoute<RouteProp<HistoryEventRouteParams, 'HistoryEvent'>>();
  const { eventId } = route.params;

  const [matches, setMatches] = useState<EventHistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.myHistoryEvent(eventId);
        setMatches(data);
      } catch (e: any) {
        setError(e?.message ?? 'Ошибка');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  }
  if (matches.length === 0) {
    return <View style={styles.center}><Text style={styles.empty}>Матчей не было</Text></View>;
  }

  const first = matches[0];
  const totalDelta = matches.reduce((s, m) => s + (m.ratingDelta ?? 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        <Text style={styles.title}>{first.eventTitle}</Text>
        <Text style={styles.meta}>
          {first.eventDate}
          {first.eventStartTime ? ` · ${first.eventStartTime?.slice(0, 5)}` : ''}
        </Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Изменение рейтинга</Text>
          <Text
            style={[
              styles.totalDelta,
              { color: totalDelta >= 0 ? colors.success : colors.danger },
            ]}
          >
            {totalDelta >= 0 ? '+' : ''}{totalDelta}
          </Text>
        </View>
      </View>

      {matches.map((m) => {
        const won = m.result === 'WIN' || m.result === 'Победа';
        const lost = m.result === 'LOSS' || m.result === 'Поражение';
        return (
          <View key={m.matchId} style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.matchHeader}>
              <Text style={styles.round}>Раунд {m.roundNumber} · Корт {m.courtNumber}</Text>
              {m.ratingDelta != null && (
                <Text
                  style={[
                    styles.delta,
                    { color: m.ratingDelta >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {m.ratingDelta >= 0 ? '+' : ''}{m.ratingDelta}
                </Text>
              )}
            </View>

            <View style={styles.teamRow}>
              <Text style={styles.teamLabel}>Вы:</Text>
              <Text style={styles.teamText}>{m.teamText}</Text>
            </View>
            <View style={styles.teamRow}>
              <Text style={styles.teamLabel}>Соп.:</Text>
              <Text style={styles.teamText}>{m.opponentText}</Text>
            </View>

            {m.score && (
              <Text
                style={[
                  styles.score,
                  won && { color: colors.success },
                  lost && { color: colors.danger },
                ]}
              >
                {m.score} · {m.result}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  error: { color: colors.danger },
  empty: { color: colors.textDim },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.textMuted, fontSize: 13 },
  totalDelta: { fontSize: 20, fontWeight: '700' },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  round: { color: colors.textDim, fontSize: 12 },
  delta: { fontSize: 14, fontWeight: '700' },
  teamRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 2 },
  teamLabel: { color: colors.textDim, fontSize: 12, width: 50 },
  teamText: { color: colors.text, fontSize: 13, flex: 1 },
  score: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
