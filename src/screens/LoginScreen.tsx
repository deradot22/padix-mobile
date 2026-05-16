import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { api, setToken } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii } from '../theme/colors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PillBadge } from '../components/ui/PillBadge';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Заполните email и пароль');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Введите имя');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        const res = await api.register(email.trim(), password, name.trim(), gender ?? undefined);
        await setToken(res.token);
        await refreshUser();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <PillBadge icon={<Sparkles size={12} color={colors.primary} />} tone="primary" filled>
            Сезон 2026
          </PillBadge>
          <Text style={styles.heroTitle}>
            Добро пожаловать в <Text style={{ color: colors.primary }}>padix</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Организуйте игры в падел, отслеживайте свой рейтинг и находите партнёров для игры.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.modeSwitch}>
            <ModeBtn label="Вход" active={mode === 'login'} onPress={() => setMode('login')} />
            <ModeBtn label="Регистрация" active={mode === 'register'} onPress={() => setMode('register')} />
          </View>

          {mode === 'register' && (
            <Input label="Имя" value={name} onChangeText={setName} placeholder="Иван" />
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Пол</Text>
              <View style={styles.genderRow}>
                <GenderBtn label="М" active={gender === 'M'} onPress={() => setGender('M')} />
                <GenderBtn label="Ж" active={gender === 'F'} onPress={() => setGender('F')} />
                <GenderBtn label="—" active={gender === null} onPress={() => setGender(null)} />
              </View>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }}>
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.modeBtn, active && styles.modeBtnActive]} onPress={onPress}>
      <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function GenderBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.genderBtn, active && styles.genderBtnActive]} onPress={onPress}>
      <Text style={[styles.genderBtnText, active && styles.genderBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },

  hero: { marginBottom: 16, alignItems: 'flex-start' },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 14,
    lineHeight: 36,
  },
  heroSubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 10, lineHeight: 20 },

  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radii.sm },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { color: colors.textMuted, fontSize: 13 },
  modeBtnTextActive: { color: colors.primaryFg, fontWeight: '600' },

  fieldWrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    backgroundColor: 'rgba(54,54,54,0.30)',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.10)' },
  genderBtnText: { color: colors.textMuted, fontSize: 13 },
  genderBtnTextActive: { color: colors.primary, fontWeight: '600' },

  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
