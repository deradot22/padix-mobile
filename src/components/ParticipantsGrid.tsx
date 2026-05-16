import { StyleSheet, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import type { Player } from '../api/types';
import { colors, radii } from '../theme/colors';
import PlayerAvatar from './PlayerAvatar';

type Props = {
  players: Player[];
  capacity: number;
};

export default function ParticipantsGrid({ players, capacity }: Props) {
  const progress = Math.min(1, players.length / capacity);
  const allReady = players.length >= capacity;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Users size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Участники</Text>
          <Text style={styles.subtitle}>
            {allReady ? 'Все игроки на месте' : `Для старта нужно минимум ${capacity} игроков`}
          </Text>
        </View>
        <View style={[
          styles.countPill,
          allReady && { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.15)' },
        ]}>
          <Text style={[styles.countText, allReady && { color: colors.primary }]}>
            {players.length} из {capacity}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.grid}>
        {players.map((p, i) => (
          <View key={p.id} style={styles.playerCard}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{i + 1}</Text>
            </View>
            <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size={44} />
            <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.playerRating}>{p.rating}</Text>
          </View>
        ))}
        {Array.from({ length: Math.max(0, capacity - players.length) }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.playerCard, styles.emptyCard]}>
            <Text style={styles.emptyText}>·</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  countPill: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },

  progressTrack: {
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radii.full },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  playerCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  numberBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(34,197,94,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.primary, fontSize: 9, fontWeight: '800' },
  playerName: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 8 },
  playerRating: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyCard: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  emptyText: { color: colors.textDim, fontSize: 24 },
});
