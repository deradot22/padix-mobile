import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Рейтинг</Text>
          <Text style={styles.value}>{user?.rating}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>NTRP</Text>
          <Text style={styles.value}>{user?.ntrp}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Сыграно матчей</Text>
          <Text style={styles.value}>{user?.gamesPlayed}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  logout: {
    marginTop: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
