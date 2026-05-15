import { useCallback, useEffect, useState } from 'react';
import { AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { RatingNotification } from '../api/types';
import { colors } from '../theme/colors';

export default function RatingNotificationModal() {
  const { user, refreshUser } = useAuth();
  const [notif, setNotif] = useState<RatingNotification | null>(null);

  const check = useCallback(async () => {
    if (!user) return;
    try {
      const n = await api.ratingNotification();
      if (n) setNotif(n);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [check]);

  const close = async () => {
    if (notif) {
      try { await api.markRatingNotificationSeen(notif.id); } catch {}
      await refreshUser();
    }
    setNotif(null);
  };

  if (!notif) return null;

  const positive = notif.delta >= 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Рейтинг обновился</Text>

          <View style={[styles.deltaPill, positive ? styles.deltaPos : styles.deltaNeg]}>
            <Text style={styles.deltaText}>
              {positive ? '+' : ''}{notif.delta}
            </Text>
          </View>

          <Text style={styles.newRating}>{notif.newRating}</Text>
          <Text style={styles.label}>новый рейтинг</Text>

          <TouchableOpacity style={styles.btn} onPress={close}>
            <Text style={styles.btnText}>Понятно</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  deltaPill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  deltaPos: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: colors.success },
  deltaNeg: { backgroundColor: 'rgba(244,63,94,0.15)', borderWidth: 1, borderColor: colors.rose },
  deltaText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  newRating: { color: colors.primary, fontSize: 36, fontWeight: '800' },
  label: { color: colors.textDim, fontSize: 12, marginTop: 2, marginBottom: 24 },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
